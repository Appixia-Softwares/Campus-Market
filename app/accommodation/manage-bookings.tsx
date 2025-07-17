"use client"
import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Mail, CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import confetti from "canvas-confetti"
import { toast } from "sonner"

export default function ManageBookingsPage() {
  // DEBUG: Confirm this page is rendering
  if (typeof window !== 'undefined') {
    console.log('DEBUG: ManageBookingsPage is rendering');
  }
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantNames, setTenantNames] = useState<{ [userId: string]: { name: string, email: string, avatar?: string } }>({})
  const [propertyInfo, setPropertyInfo] = useState<{ [propertyId: string]: { title: string, image?: string } }>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function fetchBookings() {
      if (!user) return; // Ensure user is defined
      setLoading(true)
      // Only run if user is defined
      const q = query(collection(db, 'accommodation_bookings'), where('landlordId', '==', user.id))
      const snap = await getDocs(q)
      // Explicitly type booking object
      type Booking = { id: string; customerId: string; propertyId: string; [key: string]: any }
      const bookingsData: Booking[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking))
      setBookings(bookingsData)
      // Fetch tenant names and property info
      const uniqueTenantIds = Array.from(new Set(bookingsData.map(b => b.customerId).filter(Boolean)))
      const uniquePropertyIds = Array.from(new Set(bookingsData.map(b => b.propertyId).filter(Boolean)))
      const names: { [userId: string]: { name: string, email: string, avatar?: string } } = {}
      const props: { [propertyId: string]: { title: string, image?: string } } = {}
      await Promise.all([
        ...uniqueTenantIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid))
            if (userDoc.exists()) {
              const data = userDoc.data()
              names[uid] = { name: data.full_name || data.email || uid, email: data.email || '', avatar: data.avatar_url || '' }
            } else {
              names[uid] = { name: uid, email: '', avatar: '' }
            }
          } catch {
            names[uid] = { name: uid, email: '', avatar: '' }
          }
        }),
        ...uniquePropertyIds.map(async (pid) => {
          try {
            const propDoc = await getDoc(doc(db, 'accommodations', pid))
            if (propDoc.exists()) {
              const data = propDoc.data()
              props[pid] = { title: data.title || 'Untitled', image: (data.images && data.images[0]) || data.image || '' }
            } else {
              props[pid] = { title: 'Not found', image: '' }
            }
          } catch {
            props[pid] = { title: 'Not found', image: '' }
          }
        })
      ])
      setTenantNames(names)
      setPropertyInfo(props)
      setLoading(false)
    }
    fetchBookings()
  }, [user])

  async function handleStatus(id: string, status: string) {
    setActionLoading(id + status)
    try {
      await updateDoc(doc(db, 'accommodation_bookings', id), { status })
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      // --- Animated feedback for booking approval/reject ---
      if (status === 'confirmed') {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 },
        })
        toast.success("Booking approved!", {
          description: "The tenant has been notified.",
          duration: 3500,
        })
      } else if (status === 'cancelled') {
        confetti({
          particleCount: 40,
          spread: 40,
          origin: { y: 0.7 },
        })
        toast("Booking rejected", {
          description: "The tenant has been notified.",
          duration: 3500,
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (!user) {
    return <div className="text-center text-muted-foreground py-12">Sign in to view your property bookings.</div>
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Manage Accommodation Bookings</h1>
      <p className="text-muted-foreground mb-6">View and manage all bookings for your listed accommodations.</p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No bookings found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg bg-card">
            <thead>
              <tr className="bg-muted text-xs uppercase">
                <th className="p-3 text-left">Property</th>
                <th className="p-3 text-left">Tenant</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Check-in</th>
                <th className="p-3 text-left">Check-out</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} className="border-b hover:bg-muted/50 transition">
                  <td className="p-3 flex items-center gap-3">
                    <img src={propertyInfo[b.propertyId]?.image || '/placeholder.svg'} alt="Property" className="h-12 w-16 rounded object-cover border" />
                    <span className="font-medium">{propertyInfo[b.propertyId]?.title || 'Not found'}</span>
                  </td>
                  <td className="p-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={tenantNames[b.customerId]?.avatar} />
                      <AvatarFallback>{tenantNames[b.customerId]?.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{tenantNames[b.customerId]?.name || b.customerId}</div>
                      <div className="text-xs text-muted-foreground">{tenantNames[b.customerId]?.email}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'pending' ? 'secondary' : 'outline'} className={b.status === 'cancelled' ? 'bg-destructive text-white' : ''}>
                      {b.status === 'confirmed' && <CheckCircle2 className="h-4 w-4 mr-1 inline" />}
                      {b.status === 'pending' && <Loader2 className="h-4 w-4 mr-1 inline animate-spin" />}
                      {b.status === 'cancelled' && <XCircle className="h-4 w-4 mr-1 inline" />}
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-3">{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '-'}</td>
                  <td className="p-3">{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : '-'}</td>
                  <td className="p-3 flex gap-2">
                    {b.status === 'pending' && (
                      <>
                        <Button size="sm" variant="default" disabled={actionLoading === b.id + 'confirmed'} onClick={() => handleStatus(b.id, 'confirmed')}>
                          {actionLoading === b.id + 'confirmed' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                        </Button>
                        <Button size="sm" variant="destructive" disabled={actionLoading === b.id + 'cancelled'} onClick={() => handleStatus(b.id, 'cancelled')}>
                          {actionLoading === b.id + 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${tenantNames[b.customerId]?.email || ''}`}><Mail className="h-4 w-4 mr-1" />Email</a>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/messages?user=${b.customerId}`}><MessageSquare className="h-4 w-4 mr-1" />Message</a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 