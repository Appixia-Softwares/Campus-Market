"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SlidersHorizontal, Search, X, CheckCircle, GraduationCap } from "lucide-react"
import AccommodationFilters, { AccommodationFilterState, AccommodationFiltersTrigger } from "@/components/accommodation-filters"
import AccommodationList from "@/components/accommodation-list"
import { getAccommodations } from "@/services/accommodation"

const DEFAULT_FILTERS: AccommodationFilterState = {
  price: [0, 500],
  types: [],
  amenities: [],
  locations: [],
  verifiedOnly: false,
}

export default function AccommodationPage() {
  const [filters, setFilters] = useState<AccommodationFilterState>(DEFAULT_FILTERS)
  const [filterDraft, setFilterDraft] = useState<AccommodationFilterState>(DEFAULT_FILTERS)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [accommodations, setAccommodations] = useState<any[]>([])

  // Fetch accommodations from backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const data = await getAccommodations({
          searchQuery: search,
          // Add more filter mapping as needed
        })
        setAccommodations(data)
      } catch (e) {
        setAccommodations([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [filters, search])

  // Filtering logic (client-side for now, can be moved to backend)
  const filteredListings = useMemo(() => {
    return accommodations.filter((listing) => {
      // Price
      if (listing.price < filters.price[0] || listing.price > filters.price[1]) return false
      // Type
      if (filters.types.length && !filters.types.includes(listing.type)) return false
      // Amenities (all selected must be present)
      if (filters.amenities && filters.amenities.length && !filters.amenities.every((a: string) => (listing.amenities || []).includes(a))) return false
      // Location
      if (filters.locations.length && !filters.locations.includes((listing.location || '').replace(/ /g, '-').toLowerCase())) return false
      // Verified
      if (filters.verifiedOnly && !listing.verified) return false
      return true
    })
  }, [accommodations, filters])

  // Responsive: use bottom sheet for filters on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setFilterDraft(DEFAULT_FILTERS)
  }

  // Active filter badges (reuse logic from filters)
  const activeBadges = [
    ...filters.types,
    ...filters.amenities,
    ...filters.locations,
    filters.verifiedOnly ? "Verified Only" : undefined,
    (filters.price[0] > 0 || filters.price[1] < 1000) ? `$${filters.price[0]}-${filters.price[1]}` : undefined,
  ].filter(Boolean)

  // Filter popover/sheet logic
  const handleOpenFilters = () => {
    setFilterDraft(filters)
    setShowFilters(true)
  }
  const handleApplyFilters = () => {
    setFilters(filterDraft)
    setShowFilters(false)
  }
  const handleCancelFilters = () => {
    setShowFilters(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container py-0">
        {/* Hero/Header Section */}
        <div className="relative bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-xl p-8 md:p-12 shadow-xl overflow-hidden mb-8 mt-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 mb-2">
              <span className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-900" /> Verified Listings
              </span>
              <span className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-green-900" /> For Students
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-black drop-shadow-lg mb-2">
              Find Accommodation
            </h1>
            <div className="flex items-center text-black/80 mb-2">
              Browse verified listings near your campus
            </div>
          </div>
        </div>
        {/* Top search and filter bar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for accommodation..."
                className="pl-10 h-12 text-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && e.preventDefault()}
              />
            </div>
            {/* Filter trigger button */}
            <div>
              <AccommodationFiltersTrigger onClick={handleOpenFilters} badgeCount={activeBadges.length} />
            </div>
          </div>
          {/* Active filter badges */}
          {activeBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {activeBadges.map((badge, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                  {badge}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => {
                      // Remove badge logic
                      if (badge === "Verified Only") setFilters(f => ({ ...f, verifiedOnly: false }))
                      else if (typeof badge === "string" && badge.startsWith("$") && badge.includes("-")) setFilters(f => ({ ...f, price: [0, 500] }))
                      else if (filters.types.includes(badge as string)) setFilters(f => ({ ...f, types: f.types.filter(t => t !== badge) }))
                      else if (filters.amenities.includes(badge as string)) setFilters(f => ({ ...f, amenities: f.amenities.filter(a => a !== badge) }))
                      else if (filters.locations.includes(badge as string)) setFilters(f => ({ ...f, locations: f.locations.filter(l => l !== badge) }))
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
        {/* Filter popover/sheet (controlled) */}
        {showFilters && (
          <AccommodationFilters
            value={filterDraft}
            onChange={setFilterDraft}
            onReset={() => setFilterDraft(DEFAULT_FILTERS)}
            mobileSheet={isMobile}
            showActions
            onApply={handleApplyFilters}
            onCancel={handleCancelFilters}
          />
        )}
        {/* Sort and view toggle (only one instance) */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredListings.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Sort by: Newest
            </Button>
            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')}>Grid</Button>
            <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>List</Button>
          </div>
        </div>
        {/* Listings */}
        <AccommodationList listings={filteredListings} isLoading={loading} />
      </main>
    </div>
  )
}
