"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { CalendarIcon, Check, CreditCard, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from '@/lib/firebase'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { addDays, isBefore, isAfter, isWithinInterval } from 'date-fns'
import { createNotification } from '@/lib/api/notifications'
import { DateRange } from 'react-day-picker'
import confetti from "canvas-confetti"
import { toast } from "sonner"

interface BookingFormProps {
  propertyId: string
  landlordId?: string
  userId?: string
}

export default function BookingForm({ propertyId, landlordId, userId }: BookingFormProps) {
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined })
  const [duration, setDuration] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookedRanges, setBookedRanges] = useState<Array<{ from: Date; to: Date }>>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch existing bookings for this property to disable booked dates
  React.useEffect(() => {
    async function fetchBookings() {
      const bookingsRef = collection(db, 'accommodation_bookings')
      const q = query(bookingsRef, where('propertyId', '==', propertyId), where('status', 'in', ['pending', 'confirmed']))
      const snapshot = await getDocs(q)
      const ranges: Array<{ from: Date; to: Date }> = []
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.checkIn && data.checkOut) {
          ranges.push({ from: new Date(data.checkIn), to: new Date(data.checkOut) })
        }
      })
      setBookedRanges(ranges)
    }
    fetchBookings()
  }, [propertyId, isSuccess])

  // Helper: check if selected range overlaps with any booked range
  function isRangeAvailable(from?: Date, to?: Date) {
    if (!from || !to) return false;
    return !bookedRanges.some(range =>
      isWithinInterval(from, { start: range.from, end: range.to }) ||
      isWithinInterval(to, { start: range.from, end: range.to }) ||
      (isBefore(from, range.from) && isAfter(to, range.to))
    );
  }

  // Helper: disable booked dates in calendar
  function isDateDisabled(date: Date) {
    return bookedRanges.some(range => isWithinInterval(date, { start: range.from, end: range.to }))
  }

  // Handler for date range selection compatible with Calendar's onSelect
  function handleDateRangeSelect(range: DateRange | undefined) {
    setDateRange(range || { from: undefined, to: undefined })
  }

  // Handle booking submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!dateRange || !dateRange.from || !dateRange.to || !userId || !landlordId) {
      setError('Please select a valid date range.')
      return
    }
    if (!isRangeAvailable(dateRange.from, dateRange.to)) {
      setError('Selected dates are not available. Please choose another range.')
      return
    }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'accommodation_bookings'), {
        propertyId,
        customerId: userId,
        landlordId,
        checkIn: dateRange.from?.toISOString(),
        checkOut: dateRange.to?.toISOString(),
        leaseDuration: duration,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      // Send notification to landlord
      await createNotification({
        userId: landlordId,
        type: 'accommodation',
        title: 'New Booking Request',
        body: `You have a new booking request for your property.`,
        link: '/accommodation/manage-bookings',
        read: false,
      })
      // --- Animated feedback for booking success ---
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
      })
      toast.success("Booking request sent! 🎉", {
        description: "The landlord will review your request and get back to you soon.",
        duration: 4000,
      })
      setIsSuccess(true)
      setDateRange({ from: undefined, to: undefined })
      setDuration("")
      setMessage("")
    } catch (error) {
      setError('Failed to send booking request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-medium text-lg mb-2">Booking Request Sent!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The landlord will review your request and get back to you soon.
        </p>
        <Button variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
          Make Another Request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date Range Picker */}
      <div className="space-y-2">
        <label htmlFor="date-range" className="text-sm font-medium">
          Booking Dates
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !dateRange || !dateRange.from && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange && dateRange.from && dateRange.to
                ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                : "Select date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              initialFocus
              disabled={isDateDisabled}
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Lease Duration */}
      <div className="space-y-2">
        <label htmlFor="duration" className="text-sm font-medium">
          Lease Duration
        </label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger id="duration">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 months</SelectItem>
            <SelectItem value="6">6 months</SelectItem>
            <SelectItem value="9">9 months</SelectItem>
            <SelectItem value="12">12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message to Landlord (Optional)
        </label>
        <Textarea
          id="message"
          placeholder="Introduce yourself and ask any questions..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>
      {/* Error Message */}
      {error && <div className="text-sm text-red-500 text-center">{error}</div>}
      {/* Submit Button */}
      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={!dateRange || !dateRange.from || !dateRange.to || !duration || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Request to Book</>
          )}
        </Button>
      </div>
      {/* Payment Button (future) */}
      <div className="pt-2">
        <Button variant="outline" className="w-full" disabled>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Deposit Now
        </Button>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        You won't be charged yet. The landlord needs to approve your request first.
      </div>
    </form>
  )
}
