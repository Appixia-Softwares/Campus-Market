'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Home, ShoppingBag, Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getCountFromServer } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStatsProps {
  userId: string
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    messageCount: 0,
    savedAccommodationsCount: 0,
    savedProductsCount: 0,
    likedProductsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Fetch messages count
        const messagesQuery = query(
          collection(db, "messages"),
          where("participants", "array-contains", user.id)
        )
        const messagesSnapshot = await getCountFromServer(messagesQuery)
        
        // Fetch saved accommodations count
        const accommodationsQuery = query(
          collection(db, "saved_accommodations"),
          where("userId", "==", user.id)
        )
        const accommodationsSnapshot = await getCountFromServer(accommodationsQuery)
        
        // Fetch saved products count
        const productsQuery = query(
          collection(db, "saved_products"),
          where("userId", "==", user.id)
        )
        const productsSnapshot = await getCountFromServer(productsQuery)
        
        // Fetch liked products count
        const likesQuery = query(
          collection(db, "product_likes"),
          where("userId", "==", user.id)
        )
        const likesSnapshot = await getCountFromServer(likesQuery)

        setStats({
          messageCount: messagesSnapshot.data().count,
          savedAccommodationsCount: accommodationsSnapshot.data().count,
          savedProductsCount: productsSnapshot.data().count,
          likedProductsCount: likesSnapshot.data().count
        })
      } catch (err) {
        setError('Failed to load stats')
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-destructive/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-4 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.messageCount}</div>
          <p className="text-xs text-muted-foreground">Total conversations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saved Accommodations</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.savedAccommodationsCount}</div>
          <p className="text-xs text-muted-foreground">Properties saved for later</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saved Products</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.savedProductsCount}</div>
          <p className="text-xs text-muted-foreground">Items saved for later</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Liked Products</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.likedProductsCount}</div>
          <p className="text-xs text-muted-foreground">Products you've liked</p>
        </CardContent>
      </Card>
    </div>
  )
}
