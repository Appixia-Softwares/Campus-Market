"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Star,
  User,
} from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import PropertyGallery from "@/components/property-gallery"
import PropertyAmenities from "@/components/property-amenities"
import BookingForm from "@/components/booking-form"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ZIM_UNIVERSITIES from "@/utils/schools_data"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import ReviewsSection from '@/components/reviews/reviews-section'

export default function AccommodationDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [property, setProperty] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [paramId, setParamId] = useState<string | null>(null)

  useEffect(() => {
    async function getParams() {
      // Await params if needed (for Next.js dynamic route)
      if (typeof params?.id === 'undefined') return
      setParamId(params.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!paramId) return
    async function fetchProperty() {
      setLoading(true)
      try {
        if (!paramId) return // Guard for Firestore doc()
        const docRef = doc(db, "accommodations", paramId as string)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setProperty({ id: paramId, ...docSnap.data() })
        } else {
          setProperty(null)
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load accommodation." })
        setProperty(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [paramId])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!property) return <div className="p-8 text-center text-red-500">Accommodation not found.</div>

  // Helper: get university name
  const university = ZIM_UNIVERSITIES.find(u => u.id === property.university)

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="container py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href="/accommodation" className="text-sm text-muted-foreground hover:underline">
                    Accommodation
                  </Link>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="text-sm">{property.title}</span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {property.verified && (
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline">{property.propertyType === "other" ? property.customPropertyType : property.propertyType}</Badge>
                  {university && <Badge variant="outline">{university.name}</Badge>}
                  {property.campusLocation && <Badge variant="outline">{property.campusLocation}</Badge>}
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{property.rating || "-"}</span>
                    {property.reviewCount && <span className="text-xs text-muted-foreground ml-1">({property.reviewCount} reviews)</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
                {/* Remove direct contact buttons for privacy */}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 order-1 md:order-none flex flex-col gap-6">
                <div className="sticky top-20 z-20 shadow-lg border-2 border-primary">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>${property.price}</span>
                        <span className="text-sm font-normal text-muted-foreground">per month</span>
                      </CardTitle>
                      <CardDescription>
                        {property.availableFrom && <>Available from {new Date(property.availableFrom).toLocaleDateString()}</>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Only show BookingForm if user is not the seller */}
                      {(!user || !property.seller || user.id !== property.seller.id) && (
                        <BookingForm propertyId={property.id} landlordId={property.seller?.id} userId={user?.id} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="md:col-span-2 order-2 md:order-none">
                <PropertyGallery images={property.images || []} />
                <div className="mt-6">
                  <Tabs defaultValue="details">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="amenities">Amenities</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Property Details</CardTitle>
                          <CardDescription>Complete information about this accommodation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p>{property.longDescription}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Type</span>
                              <span className="font-medium">{property.propertyType === "other" ? property.customPropertyType : property.propertyType}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Bedrooms</span>
                              <span className="font-medium">{property.beds}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Bathrooms</span>
                              <span className="font-medium">{property.baths}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Price</span>
                              <span className="font-medium">${property.price}</span>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <h3 className="font-medium mb-2">Availability</h3>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Available from {property.availableFrom && new Date(property.availableFrom).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {property.seller && (
                            <div className="mt-8 flex items-center gap-4 p-4 bg-muted rounded-lg shadow-sm">
                              <div className="flex-shrink-0">
                                {property.seller.avatar_url ? (
                              <img
                                    src={property.seller.avatar_url}
                                    alt={property.seller.full_name || property.seller.email}
                                    className="h-14 w-14 rounded-full object-cover border-2 border-primary shadow"
                              />
                                ) : (
                                  <div className="h-14 w-14 rounded-full flex items-center justify-center bg-primary text-white text-2xl font-bold border-2 border-primary shadow">
                                    {(property.seller.full_name || property.seller.email || "U").charAt(0).toUpperCase()}
                                </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-lg text-primary flex items-center gap-2">
                                  {property.seller.full_name || "Verified User"}
                                  <Badge variant="secondary" className="ml-2">Seller</Badge>
                            </div>
                                {/* Hide contact details for privacy */}
                                <div className="text-xs text-muted-foreground mt-1 italic">Contact details are hidden for your safety. Connect via platform messaging.</div>
                                <Link href={`/messages?user=${property.seller.id}&property=${property.id}`}>
                                  <Button className="mt-3 w-full" variant="default" size="lg">
                                    Message Seller
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )}
                          </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="amenities" className="mt-4">
                      <PropertyAmenities amenities={property.amenities || []} />
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-4">
                      {/* Pass accommodationId, revieweeId (landlord id), and landlordId to ReviewsSection */}
                      <ReviewsSection accommodationId={property.id} revieweeId={property.seller?.id} landlordId={property.seller?.id} />
                    </TabsContent>
                    <TabsContent value="location" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Location</CardTitle>
                          <CardDescription>{property.address}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-muted-foreground">Map view would be displayed here</p>
                              <Button variant="outline" className="mt-2">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on Map
                              </Button>
                            </div>
                          </div>
                          <h3 className="font-medium mt-6">Nearby</h3>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm">{university?.name || property.university}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm">{property.campusLocation}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 bg-card mt-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              
              
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()}  All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
