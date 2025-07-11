"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag, MessageSquare, Plus, Eye, Heart, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { collection, query, where, orderBy, getDocs, limit, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface DashboardStats {
  totalListings: number
  activeListings: number
  soldListings: number
  totalViews: number
  totalMessages: number
  favoriteCount: number
  totalEarnings: number
  responseRate: number
}

interface Product {
  id: string
  title: string
  price: number
  status: string
  views: number
  likes: number
  created_at: string
  product_images: Array<{ url: string }>
}

interface Message {
  id: string
  content: string
  created_at: string
  sender: {
    full_name: string
    avatar_url: string | null
  } | null
  conversation: {
    product: {
      title: string
    } | null
  } | null
}

interface RecentListing {
  id: string
  title: string
  price: number
  status: string
  views: number
  likes: number
  created_at: string
  product_images: { url: string }[]
}

interface RecentMessage {
  id: string
  content: string
  created_at: string
  sender: {
    full_name: string
    avatar_url: string | null
  } | null
  conversation: {
    product: {
      title: string
    } | null
  } | null
}

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function DashboardClientPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalViews: 0,
    totalMessages: 0,
    favoriteCount: 0,
    totalEarnings: 0,
    responseRate: 0,
  })
  const [recentListings, setRecentListings] = useState<RecentListing[]>([])
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Enforce only email verification: redirect if not verified
  if (user && !user.email_verified) {
    if (typeof window !== 'undefined') {
      window.location.href = '/verification';
    }
    return null;
  }

  const quickActions: QuickAction[] = [
    {
      title: "Sell Product",
      description: "List a new item for sale",
      href: "/marketplace/sell",
      icon: Plus,
      color: "bg-blue-500",
    },
    {
      title: "Browse Market",
      description: "Find products to buy",
      href: "/marketplace",
      icon: ShoppingBag,
      color: "bg-green-500",
    },
    {
      title: "View Messages",
      description: "Check your conversations",
      href: "/messages",
      icon: MessageSquare,
      color: "bg-purple-500",
    },
    {
      title: "Analytics",
      description: "View your performance",
      href: "/analytics",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ]

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch user's products
      const productsRef = collection(db, 'products')
      const productsQuery = query(
        productsRef,
        where('seller_id', '==', user.id),
        orderBy('created_at', 'desc')
      )
      const productsSnapshot = await getDocs(productsQuery)
      
      const typedProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]

      // Calculate product stats
      const totalListings = typedProducts.length
      const activeListings = typedProducts.filter((item) => item.status === "active").length
      const soldListings = typedProducts.filter((item) => item.status === "sold").length
      const totalViews = typedProducts.reduce((sum, item) => sum + (item.views || 0), 0)

      // Calculate total earnings (sum of sold products)
      const totalEarnings = typedProducts
        .filter((item) => item.status === "sold")
        .reduce((sum, item) => sum + (item.price || 0), 0)

      // Fetch conversations count
      const conversationsRef = collection(db, 'conversations')
      const conversationsQuery = query(
        conversationsRef,
        where('participant_1_id', '==', user.id)
      )
      const conversationsSnapshot = await getDocs(conversationsQuery)
      const conversationsCount = conversationsSnapshot.size

      // Fetch favorites count
      const favoritesRef = collection(db, 'user_favorites')
      const favoritesQuery = query(
        favoritesRef,
        where('user_id', '==', user.id)
      )
      const favoritesSnapshot = await getDocs(favoritesQuery)
      const favoritesCount = favoritesSnapshot.size

      // Fetch recent messages
      const messagesRef = collection(db, 'messages')
      const messagesQuery = query(
        messagesRef,
        where('sender_id', '==', user.id),
        orderBy('created_at', 'desc'),
        limit(5)
      )
      const messagesSnapshot = await getDocs(messagesQuery)
      
      const typedMessages = await Promise.all(
        messagesSnapshot.docs.map(async (messageDoc) => {
          const messageData = messageDoc.data()
          const senderDoc = await getDoc(doc(db, 'users', messageData.sender_id as string))
          const conversationDoc = await getDoc(doc(db, 'conversations', messageData.conversation_id as string))
          const productDoc = conversationDoc.exists() ? 
            await getDoc(doc(db, 'products', conversationDoc.data()?.product_id as string)) : null

          return {
            id: messageDoc.id,
            content: messageData.content as string,
            created_at: messageData.created_at as string,
            sender: senderDoc.exists() ? {
              full_name: senderDoc.data()?.full_name as string,
              avatar_url: senderDoc.data()?.avatar_url as string | null
            } : null,
            conversation: {
              product: productDoc?.exists() ? {
                title: productDoc.data()?.title as string
              } : null
            }
          }
        })
      ) as Message[]

      setStats({
        totalListings,
        activeListings,
        soldListings,
        totalViews,
        totalMessages: conversationsCount,
        favoriteCount: favoritesCount,
        totalEarnings,
        responseRate: 95, // You can implement actual calculation
      })

      setRecentListings(typedProducts.slice(0, 5))
      setRecentMessages(typedMessages)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.email?.split("@")[0]}!
        </h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/marketplace/sell">
              <Plus className="mr-2 h-4 w-4" />
              Sell Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeListings} active • {stats.soldListings} sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalListings > 0
                ? `${Math.round(stats.totalViews / stats.totalListings)} avg per listing`
                : "No listings yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">{stats.responseRate}% response rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">From {stats.soldListings} sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Tabs defaultValue="listings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listings">Recent Listings</TabsTrigger>
          <TabsTrigger value="messages">Recent Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Recent Listings</CardTitle>
              <CardDescription>Manage and track your marketplace items</CardDescription>
            </CardHeader>
            <CardContent>
              {recentListings.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No listings yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first listing.</p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/marketplace/sell">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Listing
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentListings.map((listing) => (
                    <div key={listing.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {listing.product_images && listing.product_images.length > 0 ? (
                          <img
                            src={listing.product_images[0]?.url || "/placeholder.svg"}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(listing.price)}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {listing.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {listing.likes || 0}
                          </span>
                          <span>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={listing.status === "active" ? "default" : "secondary"}>{listing.status}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/marketplace/products/${listing.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link href="/marketplace/my-listings">View All Listings</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest conversations about your listings</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No messages yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Messages from interested buyers will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        {message.sender?.avatar_url ? (
                          <img
                            src={message.sender.avatar_url || "/placeholder.svg"}
                            alt={message.sender.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-primary-foreground">
                            {message.sender?.full_name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {message.sender?.full_name || "Unknown User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {message.conversation?.product && (
                          <p className="text-sm text-muted-foreground">Re: {message.conversation.product.title}</p>
                        )}
                        <p className="text-sm text-gray-900 mt-1 line-clamp-2">{message.content}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/messages">Reply</Link>
                      </Button>
                    </div>
                  ))}
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link href="/messages">View All Messages</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
