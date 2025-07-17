"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bath, Bed, Building, Calendar, CheckCircle, Clock, CreditCard, MapPin, XCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface BookingsListProps {
  userId?: string
  landlordId?: string
  limit?: number
}

export default function BookingsList({ userId, landlordId, limit = 0 }: BookingsListProps) {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // If listings are provided, use them (for demo/testing)
    if (listings) {
      setBookings(listings)
      setIsLoading(false)
      return
    }
    // Otherwise, fetch from Firestore if userId/landlordId is provided
    async function fetchBookings() {
      setIsLoading(true)
      let q
      if (userId) {
        q = query(collection(db, 'accommodation_bookings'), where('customerId', '==', userId))
      } else if (landlordId) {
        q = query(collection(db, 'accommodation_bookings'), where('landlordId', '==', landlordId))
      } else {
        // If no userId/landlordId, use mock data for demo
        setBookings(limit > 0 ? MOCK_BOOKINGS.slice(0, limit) : MOCK_BOOKINGS)
        setIsLoading(false)
        return
      }
      if (status) {
        q = query(q, where('status', '==', status))
      }
      const snapshot = await getDocs(q)
      let bookingsData = snapshot.docs.map(doc => {
        const data = doc.data() as Booking;
        return { ...data, id: doc.id };
      });
      if (limit > 0) bookingsData = bookingsData.slice(0, limit)

      // Fetch property details for each booking, with debug logs
      const bookingsWithProperty = await Promise.all(bookingsData.map(async (booking) => {
        const b: any = booking // Type guard for Firestore data
        if (!b.propertyId) {
          if (debug) console.warn(`[BookingsList Debug] Booking missing propertyId`, b)
          return { ...b, property: null, propertyDebug: 'No propertyId on booking' }
        }
        try {
          if (debug) console.log(`[BookingsList Debug] Fetching property for booking`, b.id, 'propertyId:', b.propertyId)
          const propDoc = await getDoc(doc(db, 'accommodations', b.propertyId))
          if (!propDoc.exists()) {
            if (debug) console.warn(`[BookingsList Debug] Property not found for propertyId`, b.propertyId)
            return { ...b, property: null, propertyDebug: 'Property not found in Firestore' }
          }
          const property: any = { id: propDoc.id, ...propDoc.data() }
          // Check for required fields
          if (!property.title || !property.address) {
            if (debug) console.warn(`[BookingsList Debug] Property missing required fields`, property)
            return { ...b, property, propertyDebug: 'Property missing required fields' }
          }
          return { ...b, property, propertyDebug: null }
        } catch (err) {
          if (debug) console.error(`[BookingsList Debug] Error fetching property`, b.propertyId, err)
          return { ...b, property: null, propertyDebug: 'Error fetching property' }
        }
      }))
      setBookings(bookingsWithProperty)
      setIsLoading(false)
      if (debug) {
        console.log(`[BookingsList Debug] ${label || ''}`, bookingsWithProperty)
      }
    }
    fetchBookings()
  }, [userId, landlordId, limit])

  return (
    <Card className="hover-card-animation">
      {analytics && (
        <div className="flex flex-wrap gap-4 p-4 border-b bg-muted/30">
          <div className="font-semibold">Bookings: <span className="text-primary">{analytics.total}</span></div>
          <div className="text-green-700">Active: {analytics.active}</div>
          <div className="text-yellow-700">Pending: {analytics.pending}</div>
          <div className="text-gray-500">Completed: {analytics.completed}</div>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>My Bookings</CardTitle>
          </div>
          {limit > 0 && (
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <CardDescription>Your accommodation bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array(limit > 0 ? limit : 3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 h-32 md:h-auto bg-muted"></div>
                    <div className="p-4 md:w-3/4">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                </Card>
              ))
          ) : bookings.length > 0 ? (
            ((() => {
              // Check if all bookings are missing property data
              const allMissing = bookings.every(
                b => !b.property || !b.property.title || !b.property.address
              )
              if (allMissing) {
                return (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1 text-destructive">No valid accommodation data found for your bookings.</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This may be due to missing or incomplete property info. Please contact support or try booking another accommodation.
                    </p>
                    <Link href="/accommodation">
                      <Button>Find Accommodation</Button>
                    </Link>
                    {debug && (
                      <div className="mt-6 text-left max-w-xl mx-auto">
                        <b>Debug Info:</b>
                        <pre className="overflow-x-auto mt-1 text-xs bg-muted p-2 rounded">{JSON.stringify(bookings, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )
              }
              // Otherwise, render the bookings as cards
              return bookings.map((booking, index) => (
                <Card
                  key={booking.id}
                  className="overflow-hidden group hover:border-primary/50 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="relative md:w-1/4">
                      <img
                        src={booking.property?.image || booking.property?.images?.[0] || "/placeholder.svg"}
                        alt={booking.property?.title || 'Accommodation'}
                        className="w-full h-32 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge
                        variant={
                          booking.status === "active" ? "default" : booking.status === "pending" ? "secondary" : "outline"
                        }
                        className="absolute top-2 right-2"
                      >
                        {booking.status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {booking.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {booking.status === "active" ? "Active" : booking.status === "pending" ? "Pending" : "Completed"}
                      </Badge>
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {booking.property?.title
                          ? booking.property.title
                          : booking.propertyDebug
                            ? `Not found`
                            : 'Not found'}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{booking.property?.address || (booking.propertyDebug ? 'Missing address' : 'No address available')}</span>
                      </div>
                      {/* Debug: Show raw property data if missing fields */}
                      {debug && booking.propertyDebug && (
                        <Collapsible>
                          <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                            <b>Debug Info:</b> {booking.propertyDebug}
                            <pre className="overflow-x-auto mt-1">{JSON.stringify(booking.property, null, 2)}</pre>
                          </div>
                        </Collapsible>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : '-'} - {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{booking.property?.beds ?? '-'}</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{booking.property?.baths ?? '-'}</span>
                        </div>
                      </div>
                      {booking.nextPaymentDate && (
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">
                            Next payment: ${booking.nextPaymentAmount} on {new Date(booking.nextPaymentDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link href={`/accommodation/${booking.propertyId}`}>
                        <Button variant="outline" size="sm" className="group-hover:border-primary/50 transition-colors">
                          View Property
                        </Button>
                      </Link>
                      {booking.status === "active" && (
                        <Button size="sm" className="group-hover:bg-primary/90 transition-colors" onClick={() => handlePay(booking, "rent") }>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Rent
                        </Button>
                      )}
                      {booking.status === "pending" && (
                        <Button size="sm" className="group-hover:bg-primary/90 transition-colors" onClick={() => handlePay(booking, "deposit") }>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Deposit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Building className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No bookings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start exploring accommodations to find your perfect student housing
              </p>
              <Link href="/accommodation">
                <Button>Find Accommodation</Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
