"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bath, Bed, Building, Calendar, CheckCircle, Clock, CreditCard, MapPin } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
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

  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true)
      let q
      if (userId) {
        q = query(collection(db, 'accommodation_bookings'), where('customerId', '==', userId))
      } else if (landlordId) {
        q = query(collection(db, 'accommodation_bookings'), where('landlordId', '==', landlordId))
      } else {
        q = collection(db, 'accommodation_bookings')
      }
      const snapshot = await getDocs(q)
      let bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      if (limit > 0) bookingsData = bookingsData.slice(0, limit)
      setBookings(bookingsData)
      setIsLoading(false)
    }
    fetchBookings()
  }, [userId, landlordId, limit])

  return (
    <Card className="hover-card-animation">
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
            bookings.map((booking, index) => (
              <Card
                key={booking.id}
                className="overflow-hidden group hover:border-primary/50 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative md:w-1/4">
                    <img
                      src={booking.image || "/placeholder.svg"}
                      alt={booking.propertyTitle}
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

                  <div className="p-4 md:w-3/4">
                    <div className="flex flex-col md:flex-row justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {booking.propertyTitle}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{booking.propertyAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 my-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(booking.startDate).toLocaleDateString()} -{" "}
                          {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{booking.beds}</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">{booking.baths}</span>
                        </div>
                      </div>

                      {booking.nextPaymentDate && (
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm">
                            Next payment: ${booking.nextPaymentAmount} on{" "}
                            {new Date(booking.nextPaymentDate).toLocaleDateString()}
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
                        <Button size="sm" className="group-hover:bg-primary/90 transition-colors">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Rent
                        </Button>
                      )}

                      {booking.status === "pending" && (
                        <Button size="sm" className="group-hover:bg-primary/90 transition-colors">
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
