"use client"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, SlidersHorizontal, Search, X } from "lucide-react"
import AccommodationFilters, { AccommodationFilterState } from "@/components/accommodation-filters"
import AccommodationList, { AccommodationListing } from "@/components/accommodation-list"

// Mock data for listings (move to a separate file if needed)
const MOCK_LISTINGS: AccommodationListing[] = [
  {
    id: "1",
    title: "Modern Studio Apartment",
    location: "Main Campus",
    address: "123 University Ave",
    price: 250,
    priceUnit: "month",
    type: "studio",
    beds: 1,
    baths: 1,
    amenities: ["Wifi", "Furnished", "Utilities Included"],
    verified: true,
    rating: 4.8,
    reviewCount: 24,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "2",
    title: "Shared 2-Bedroom Apartment",
    location: "North Campus",
    address: "456 College St",
    price: 180,
    priceUnit: "month",
    type: "shared",
    beds: 2,
    baths: 1,
    amenities: ["Wifi", "Kitchen", "Laundry"],
    verified: true,
    rating: 4.5,
    reviewCount: 18,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "3",
    title: "Private Room in Student House",
    location: "City Center",
    address: "789 Downtown Rd",
    price: 200,
    priceUnit: "month",
    type: "single",
    beds: 1,
    baths: 1,
    amenities: ["Wifi", "Shared Kitchen", "Study Area"],
    verified: false,
    rating: 4.2,
    reviewCount: 12,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "4",
    title: "Luxury Student Apartment",
    location: "South Campus",
    address: "101 Campus Drive",
    price: 320,
    priceUnit: "month",
    type: "apartment",
    beds: 2,
    baths: 2,
    amenities: ["Wifi", "Gym", "Pool", "Study Rooms"],
    verified: true,
    rating: 4.9,
    reviewCount: 36,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "5",
    title: "Cozy Single Room",
    location: "Main Campus",
    address: "222 College Blvd",
    price: 150,
    priceUnit: "month",
    type: "single",
    beds: 1,
    baths: 1,
    amenities: ["Wifi", "Desk", "Shared Kitchen"],
    verified: true,
    rating: 4.3,
    reviewCount: 15,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "6",
    title: "Budget Friendly Shared Room",
    location: "South Campus",
    address: "333 Student Lane",
    price: 120,
    priceUnit: "month",
    type: "shared",
    beds: 2,
    baths: 1,
    amenities: ["Wifi", "Laundry", "Bike Storage"],
    verified: false,
    rating: 4.0,
    reviewCount: 8,
    image: "/placeholder.svg?height=200&width=300",
  },
]

const DEFAULT_FILTERS: AccommodationFilterState = {
  price: [0, 500],
  types: [],
  amenities: [],
  locations: [],
  verifiedOnly: false,
}

export default function AccommodationPage() {
  const [filters, setFilters] = useState<AccommodationFilterState>(DEFAULT_FILTERS)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Filtering logic
  const filteredListings = useMemo(() => {
    return MOCK_LISTINGS.filter((listing) => {
      // Search
      if (search && !(
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.address.toLowerCase().includes(search.toLowerCase())
      )) return false
      // Price
      if (listing.price < filters.price[0] || listing.price > filters.price[1]) return false
      // Type
      if (filters.types.length && !filters.types.includes(listing.type)) return false
      // Amenities (all selected must be present)
      if (filters.amenities.length && !filters.amenities.every(a => listing.amenities.includes(a))) return false
      // Location
      if (filters.locations.length && !filters.locations.includes(listing.location.replace(/ /g, '-').toLowerCase())) return false
      // Verified
      if (filters.verifiedOnly && !listing.verified) return false
      return true
    })
  }, [filters, search])

  // Responsive: use bottom sheet for filters on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const handleReset = () => setFilters(DEFAULT_FILTERS)

  // Active filter badges (reuse logic from filters)
  const activeBadges = [
    ...filters.types,
    ...filters.amenities,
    ...filters.locations,
    filters.verifiedOnly ? "Verified Only" : undefined,
    (filters.price[0] > 0 || filters.price[1] < 1000) ? `$${filters.price[0]}-${filters.price[1]}` : undefined,
  ].filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container py-8">
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
            <AccommodationFilters
              value={filters}
              onChange={setFilters}
              onReset={handleReset}
              mobileSheet={isMobile}
            />
            <Button onClick={() => setShowFilters(true)} className="hidden" />
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
        {/* Sort and view toggle */}
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
