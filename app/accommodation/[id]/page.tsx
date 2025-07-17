"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  Calendar,
  CheckCircle2,
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
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ZIM_UNIVERSITIES from "@/utils/schools_data"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import ReviewsSection from '@/components/reviews/reviews-section'
import { useRouter } from "next/navigation"
import React from "react"
import BookingsList from '@/components/bookings-list'

export default function AccommodationDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter();
  const [property, setProperty] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [paramId, setParamId] = useState<string | null>(null)
  const [userBooking, setUserBooking] = useState<any | null>(null)
  const [propertyBookings, setPropertyBookings] = useState<any[]>([])
  const [tenantNames, setTenantNames] = useState<{ [userId: string]: string }>({})

  // Use params directly as provided by Next.js
  useEffect(() => {
    if (!params?.id) return;
    setParamId(params.id);
  }, [params]);

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

  // Fetch current user's booking for this property
  useEffect(() => {
    if (!user || !paramId) return
    async function fetchUserBooking() {
      if (!user) return; // extra guard for linter
      const bookingsRef = collection(db, 'accommodation_bookings')
      const q = query(bookingsRef, where('propertyId', '==', paramId), where('customerId', '==', user.id))
      const snap = await getDocs(q)
      setUserBooking(snap.docs.length > 0 ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null)
    }
    fetchUserBooking()
  }, [user, paramId])

  // Fetch all bookings for this property if user is landlord
  useEffect(() => {
    if (!user || !paramId || !property || !property.seller || user.id !== property.seller.id) return
    async function fetchPropertyBookings() {
      const bookingsRef = collection(db, 'accommodation_bookings')
      const q = query(bookingsRef, where('propertyId', '==', paramId))
      const snap = await getDocs(q)
      // Type assertion to any to ensure customerId exists
      const bookings = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      setPropertyBookings(bookings)
      // Fetch tenant names for each booking
      const uniqueTenantIds = Array.from(new Set(bookings.map((b: any) => b.customerId).filter(Boolean)))
      const names: { [userId: string]: string } = {}
      await Promise.all(uniqueTenantIds.map(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            names[uid] = data.full_name || data.email || uid
          } else {
            names[uid] = uid
          }
        } catch {
          names[uid] = uid
        }
      }))
      setTenantNames(names)
    }
    fetchPropertyBookings()
  }, [user, paramId, property])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!property) return <div className="p-8 text-center text-red-500">Accommodation not found.</div>

  // Helper: get university name
  const university = ZIM_UNIVERSITIES.find(u => u.id === property.university)

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 w-full h-full p-6">
        <div>
          <div className="flex flex-col gap-6">
            {/* Show user's booking status if exists */}
            {userBooking && (
              <div className="mb-4">
                <Card className="border-primary border-2">
                  <CardHeader>
                    <CardTitle>Your Booking Status</CardTitle>
                    <CardDescription>
                      {userBooking.status === 'pending' && 'Your booking is pending approval.'}
                      {userBooking.status === 'confirmed' && 'Your booking is confirmed!'}
                      {userBooking.status === 'cancelled' && 'Your booking was cancelled.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div><b>Check-in:</b> {userBooking.checkIn && new Date(userBooking.checkIn).toLocaleDateString()}</div>
                      <div><b>Check-out:</b> {userBooking.checkOut && new Date(userBooking.checkOut).toLocaleDateString()}</div>
                      <div><b>Lease Duration:</b> {userBooking.leaseDuration} months</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {/* Show upcoming bookings for landlord */}
            {user && property && property.seller && user.id === property.seller.id && propertyBookings.length > 0 && (
              <div className="mb-4">
                <Card className="border-accent border-2">
                  <CardHeader>
                    <CardTitle>Upcoming Bookings</CardTitle>
                    <CardDescription>All bookings for this property</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {propertyBookings.map(booking => {
                        const b: any = booking // Type guard for Firestore data
                        return (
                          <div key={b.id} className="p-2 rounded border flex flex-col md:flex-row md:items-center gap-2">
                            <div><b>Tenant:</b> {tenantNames[b.customerId] || b.customerId}</div>
                            <div><b>Status:</b> {b.status}</div>
                            <div><b>Check-in:</b> {b.checkIn && new Date(b.checkIn).toLocaleDateString()}</div>
                            <div><b>Check-out:</b> {b.checkOut && new Date(b.checkOut).toLocaleDateString()}</div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
                    <Badge variant="secondary" className="bg-primary text-primary-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
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
                      {/* Only show BookingForm if user is logged in and not the seller; otherwise show login prompt */}
                      {user ? (
                        (!property.seller || user.id !== property.seller.id) && (
                          <BookingForm propertyId={property.id} landlordId={property.seller?.id} userId={user?.id} />
                        )
                      ) : (
                        <Button className="w-full" onClick={() => router.push('/login')}>
                          Sign in to book this accommodation
                        </Button>
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
                        {user ? (
                          <ReviewsSection accommodationId={property.id} revieweeId={property.seller?.id} landlordId={property.seller?.id} />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <p className="mb-4 text-muted-foreground">Sign in to view and write reviews for this accommodation.</p>
                            <Button onClick={() => router.push('/login')}>Sign in</Button>
                          </div>
                        )}
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
