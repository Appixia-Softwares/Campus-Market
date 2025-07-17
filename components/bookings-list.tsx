"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bath, Bed, Building, Calendar, CheckCircle, Clock, CreditCard, MapPin, XCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

type Booking = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  landlord: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  image: string;
  beds: number;
  baths: number;
};

// Mock data for bookings
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    propertyId: "1",
    propertyTitle: "Modern Studio Apartment",
    propertyAddress: "123 University Ave, Campus Town",
    landlord: "John Smith",
    startDate: "2023-09-01",
    endDate: "2024-06-30",
    status: "active",
    paymentStatus: "paid",
    nextPaymentDate: "2023-10-01",
    nextPaymentAmount: 250,
    image: "/placeholder.svg?height=200&width=300",
    beds: 1,
    baths: 1,
  },
  {
    id: "2",
    propertyId: "3",
    propertyTitle: "Private Room in Student House",
    propertyAddress: "789 Downtown Rd, City Center",
    landlord: "Sarah Johnson",
    startDate: "2023-08-15",
    endDate: "2023-08-30",
    status: "completed",
    paymentStatus: "paid",
    nextPaymentDate: "", // was null
    nextPaymentAmount: 0, // was null
    image: "/placeholder.svg?height=200&width=300",
    beds: 1,
    baths: 1,
  },
  {
    id: "3",
    propertyId: "4",
    propertyTitle: "Luxury Student Apartment",
    propertyAddress: "101 Campus Drive, South Campus",
    landlord: "Michael Brown",
    startDate: "2023-10-01",
    endDate: "2024-07-31",
    status: "pending",
    paymentStatus: "awaiting_deposit",
    nextPaymentDate: "2023-10-01",
    nextPaymentAmount: 320,
    image: "/placeholder.svg?height=200&width=300",
    beds: 2,
    baths: 2,
  },
]

export default function BookingsList({ limit = 0, listings }: { limit?: number, listings?: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (listings) {
      setBookings(listings)
      setIsLoading(false)
      return
    }
    const timer = setTimeout(() => {
      setIsLoading(false)
      setBookings(limit > 0 ? (MOCK_BOOKINGS.slice(0, limit) as Booking[]) : MOCK_BOOKINGS)
    }, 800)
    return () => clearTimeout(timer)
  }, [limit, listings])

  // Analytics summary
  const analytics = listings && listings.length > 0 ? {
    total: listings.length,
    active: listings.filter(b => b.status === "active").length,
    pending: listings.filter(b => b.status === "pending").length,
    completed: listings.filter(b => b.status === "completed").length,
  } : null

  // Cancel booking (optimistic UI)
  const handleCancel = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id))
    toast({ title: "Booking Cancelled", description: "Your booking has been cancelled." })
    // TODO: Add backend cancellation logic here
  }

  // Pay Rent/Deposit (stub)
  const handlePay = (booking: Booking, type: "rent" | "deposit") => {
    toast({ title: `Pay ${type === "rent" ? "Rent" : "Deposit"}`,
      description: `Payment flow for ${booking.propertyTitle} would start here.` })
    // TODO: Integrate payment flow
  }

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
                      <Dialog open={selectedBooking?.id === booking.id} onOpenChange={open => setSelectedBooking(open ? booking : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="group-hover:border-primary/50 transition-colors">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{booking.propertyTitle}</DialogTitle>
                            <DialogDescription>{booking.propertyAddress}</DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col gap-2">
                            <div><b>Landlord:</b> {booking.landlord}</div>
                            <div><b>Stay:</b> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</div>
                            <div><b>Status:</b> {booking.status}</div>
                            <div><b>Payment Status:</b> {booking.paymentStatus}</div>
                            <div><b>Beds:</b> {booking.beds} | <b>Baths:</b> {booking.baths}</div>
                            {/* Add more property details here as needed */}
                          </div>
                        </DialogContent>
                      </Dialog>
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

                      {(booking.status === "pending" || booking.status === "active") && (
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(booking.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel Booking
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
