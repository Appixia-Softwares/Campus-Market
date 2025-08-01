"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bath, Bed, CheckCircle, Heart, MapPin, Star, Wifi, Home, Users, KeyRound, ParkingCircle, Utensils, WashingMachine, Sparkles, CheckCircle2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore"
import { useEffect } from "react"
import DeleteListingButton from "@/components/DeleteListingButton"

// Amenity icon map for DRYness
const AMENITY_ICONS: Record<string, any> = {
  Wifi,
  Furnished: Home,
  "Utilities Included": Sparkles,
  Kitchen: Utensils,
  Laundry: WashingMachine,
  Parking: ParkingCircle,
  "Shared Kitchen": Utensils,
  "Study Area": Home,
  Gym: Home,
  Pool: Home,
  "Study Rooms": Home,
  Desk: Home,
  "Bike Storage": ParkingCircle,
}

export interface AccommodationListing {
  id: string
  title: string
  location: string
  address: string
  price: number
  priceUnit: string
  type: string
  beds: number
  baths: number
  amenities: string[]
  verified: boolean
  rating: number
  reviewCount: number
  image: string
  images?: string[] // Added images to the interface
  seller?: {
    id: string
    name?: string
  }
}

export interface AccommodationListProps {
  listings: AccommodationListing[]
  isLoading?: boolean
}

export default function AccommodationList({ listings, isLoading, view = 'grid' }: AccommodationListProps & { view?: 'grid' | 'list' }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])

  // Fetch user's favourite accommodation IDs
  useEffect(() => {
    if (!user?.id) return
    async function fetchFavorites() {
      if (!user?.id) return
      const favSnap = await getDocs(query(
        collection(db, "user_favorites"),
        where("user_id", "==", user.id),
        where("type", "==", "accommodation")
      ))
      setFavorites(favSnap.docs.map(doc => doc.data().item_id))
    }
    fetchFavorites()
  }, [user])

  // Toggle favourite status
  const toggleFavorite = async (id: string) => {
    if (!user?.id) return
    const favRef = collection(db, "user_favorites")
    if (favorites.includes(id)) {
      // Remove favourite
      const favSnap = await getDocs(query(
        favRef,
        where("user_id", "==", user.id),
        where("item_id", "==", id),
        where("type", "==", "accommodation")
      ))
      favSnap.forEach(docu => deleteDoc(docu.ref))
      setFavorites(favs => favs.filter(f => f !== id))
    } else {
      // Add favourite
      await addDoc(favRef, { user_id: user.id, item_id: id, type: "accommodation" })
      setFavorites(favs => [...favs, id])
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 h-48 md:h-auto bg-muted" />
              <div className="p-4 md:w-2/3">
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-10 bg-muted rounded w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!listings.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Home className="h-12 w-12 mb-4 text-primary" />
        <div className="text-lg font-semibold mb-2">No accommodation matches your filters</div>
        <div className="mb-4">Try adjusting your filters or check back later for new listings.</div>
      </div>
    )
  }

  return (
    <div>
      {/* Remove the internal Grid/List toggle button block */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
      {listings.map((listing) => (
        <Card key={listing.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-1/3">
              <img
                src={Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : listing.image || "/placeholder.svg"}
                alt={listing.title}
                className="w-full h-48 md:h-full object-cover"
              />
              {listing.verified && (
                <Badge variant="secondary" className="absolute top-2 right-2 bg-primary text-primary-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {user && (
                <div className="flex gap-2">
                  <Button
                    variant={favorites.includes(listing.id) ? "default" : "outline"}
                    size="icon"
                    onClick={() => toggleFavorite(listing.id)}
                    aria-label={favorites.includes(listing.id) ? "Unfavourite" : "Favourite"}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  {/* Show delete button only for user's own listings */}
                  {user.id === listing.seller?.id && (
                    <DeleteListingButton
                      listingId={listing.id}
                      listingType="accommodation"
                      userId={user.id}
                      variant="destructive"
                      size="icon"
                    />
                  )}
                </div>
              )}
            </div>
            <div className="p-4 md:w-2/3 flex flex-col">
              <div className="mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{listing.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{listing.address}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {listing.type}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 my-2">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">
                    {listing.beds} {listing.beds > 1 ? "beds" : "bed"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">
                    {listing.baths} {listing.baths > 1 ? "baths" : "bath"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">{listing.rating}</span>
                  <span className="text-xs text-muted-foreground ml-1">({listing.reviewCount})</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 my-2">
                    {listing.amenities.map((amenity, i) => {
                      const Icon = AMENITY_ICONS[amenity] || Home
                      return (
                        <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                          <Icon className="h-3 w-3 mr-1" />
                    {amenity}
                  </Badge>
                      )
                    })}
                  </div>
                  <div className="mt-auto pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2 w-full">
                    <div className="font-semibold text-lg">
                      ${listing.price}
                      <span className="text-xs text-muted-foreground">/{listing.priceUnit}</span>
                    </div>
                    {/* Action buttons: full-width and stacked on mobile */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">Contact</Button>
                      <Link href={`/accommodation/${listing.id}`} className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-1/4">
                  <img
                    src={Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : listing.image || "/placeholder.svg"}
                    alt={listing.title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                  {listing.verified && (
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-primary text-primary-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-2 left-2 rounded-full bg-background/80 hover:bg-background ${
                      favorites.includes(listing.id) ? "text-red-500" : "text-muted-foreground"
                    }`}
                    onClick={() => toggleFavorite(listing.id)}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(listing.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>
                <div className="p-4 md:w-3/4 flex flex-col">
                  <div className="mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{listing.address}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {listing.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 my-2">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">
                        {listing.beds} {listing.beds > 1 ? "beds" : "bed"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">
                        {listing.baths} {listing.baths > 1 ? "baths" : "bath"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{listing.rating}</span>
                      <span className="text-xs text-muted-foreground ml-1">({listing.reviewCount})</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 my-2">
                    {listing.amenities.map((amenity, i) => {
                      const Icon = AMENITY_ICONS[amenity] || Home
                      return (
                        <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                          <Icon className="h-3 w-3 mr-1" />
                          {amenity}
                        </Badge>
                      )
                    })}
                  </div>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <div className="font-semibold text-lg">
                  ${listing.price}
                  <span className="text-xs text-muted-foreground">/{listing.priceUnit}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Contact
                  </Button>
                  <Link href={`/accommodation/${listing.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
        </div>
      )}
    </div>
  )
}
