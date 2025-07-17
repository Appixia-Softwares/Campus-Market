"use client"
import { useAuth } from '@/lib/auth-context'
import BookingsList from '@/components/bookings-list'

export default function ManageBookingsPage() {
  const { user } = useAuth()
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Manage Bookings</h1>
      <p className="text-muted-foreground mb-6">View and manage bookings for your listed accommodations.</p>
      {user ? (
        <BookingsList landlordId={user.id} />
      ) : (
        <div className="text-center text-muted-foreground py-12">Sign in to view your property bookings.</div>
      )}
    </div>
  )
} 