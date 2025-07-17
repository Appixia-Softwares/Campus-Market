"use client"
import { useAuth } from '@/lib/auth-context'
import BookingsList from '@/components/bookings-list'

export default function BookedAccommodationsPage() {
  const { user } = useAuth()
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Booked Accommodations</h1>
      <p className="text-muted-foreground mb-6">All accommodations you have successfully booked.</p>
      {user ? (
        <BookingsList userId={user.id} />
      ) : (
        <div className="text-center text-muted-foreground py-12">Sign in to view your booked accommodations.</div>
      )}
    </div>
  )
} 