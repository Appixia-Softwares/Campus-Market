"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bath, Bed, CheckCircle, Heart, MapPin, Star, Wifi } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

// Extended mock data for accommodation listings
const MOCK_LISTINGS = [
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

export default function AccommodationList() {
  const [listings, setListings] = useState(MOCK_LISTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 h-48 md:h-auto bg-muted animate-pulse" />
              <div className="p-4 md:w-2/3">
                <div className="h-6 bg-muted animate-pulse rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted animate-pulse rounded w-full mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-4" />
                <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-1/3">
              <img
                src={listing.image || "/placeholder.svg"}
                alt={listing.title}
                className="w-full h-48 md:h-full object-cover"
              />
              {listing.verified && (
                <Badge variant="secondary" className="absolute top-2 right-2 bg-primary text-primary-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
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
                {listing.amenities.map((amenity, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {amenity === "Wifi" && <Wifi className="h-3 w-3 mr-1" />}
                    {amenity}
                  </Badge>
                ))}
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
  )
}
