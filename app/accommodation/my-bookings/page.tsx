"use client"
import { useAuth } from '@/lib/auth-context'
import BookingsList from '@/components/bookings-list'

export default function MyBookingsPage() {
  const { user } = useAuth()
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">My Booked Accommodations</h1>
      <p className="text-muted-foreground mb-6">See all accommodations you have successfully booked and their status.</p>
      {user ? (
        <BookingsList userId={user.id} status="confirmed" debug label="My Bookings" />
      ) : (
        <div className="text-center text-muted-foreground py-12">Sign in to view your booked accommodations.</div>
      )}
    </div>
  )
} 