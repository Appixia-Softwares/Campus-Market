"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag, Eye, Heart, MessageSquare, Download, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

interface AnalyticsData {
  overview: {
    totalViews: number
    totalLikes: number
    totalMessages: number
    totalListings: number
    activeListings: number
    soldListings: number
  }
  topListings: Array<{
    id: string
    title: string
    views: number
    likes: number
    messages: number
    price: number
    status: string
  }>
  monthlyStats: Array<{
    month: string
    views: number
    likes: number
    messages: number
    listings: number
  }>
  categoryStats: Array<{
    category: string
    count: number
    percentage: number
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30") // days

  useEffect(() => {
    if (user) {
      fetchAnalyticsData()
    }
  }, [user, dateRange])

  const fetchAnalyticsData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(dateRange))

      // Fetch user's products with stats from Firebase
      const productsQuery = query(
        collection(db, "products"),
        where("seller_id", "==", user.id),
        orderBy("created_at", "desc")
      )
      const productsSnapshot = await getDocs(productsQuery)
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch messages count for user's products
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("product_id", "in", products?.map((p) => p.id) || [])
      )
      const conversationsSnapshot = await getDocs(conversationsQuery)
      const conversations = conversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate overview stats
      const totalViews = products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0
      const totalLikes = products?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0
      const totalListings = products?.length || 0
      const activeListings = products?.filter((p) => p.status === "active").length || 0
      const soldListings = products?.filter((p) => p.status === "sold").length || 0

      // Get top performing listings
      const topListings =
        products
          ?.map((product) => ({
            id: product.id,
            title: product.title,
            views: product.views || 0,
            likes: product.likes || 0,
            messages: conversations?.filter((c) => c.product_id === product.id).length || 0,
            price: product.price,
            status: product.status,
          }))
          .sort((a, b) => b.views + b.likes * 2 - (a.views + a.likes * 2))
          .slice(0, 5) || []

      // Calculate category stats
      const categoryMap = new Map()
      products?.forEach((product) => {
        const category = product.category || "Other"
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
      })

      const categoryStats = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
        percentage: totalListings > 0 ? Math.round((count / totalListings) * 100) : 0,
      }))

      // Generate monthly stats (simplified - you might want to implement proper monthly aggregation)
      const monthlyStats = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        const monthName = date.toLocaleDateString("en-US", { month: "short" })

        // Filter products created in this month
        const monthProducts =
          products?.filter((p) => {
            const productDate = new Date(p.created_at?.toDate?.() || p.created_at)
            return productDate.getMonth() === date.getMonth() && productDate.getFullYear() === date.getFullYear()
          }) || []

        return {
          month: monthName,
          views: monthProducts.reduce((sum, p) => sum + (p.views || 0), 0),
          likes: monthProducts.reduce((sum, p) => sum + (p.likes || 0), 0),
          messages: conversations?.filter((c) => monthProducts.some((p) => p.id === c.product_id)).length || 0,
          listings: monthProducts.length,
        }
      })

      setAnalyticsData({
        overview: {
          totalViews,
          totalLikes,
          totalMessages: conversations?.length || 0,
          totalListings,
          activeListings,
          soldListings,
        },
        topListings,
        monthlyStats,
        categoryStats,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!analyticsData) return

    const csvData = [
      ["Metric", "Value"],
      ["Total Views", analyticsData.overview.totalViews],
      ["Total Likes", analyticsData.overview.totalLikes],
      ["Total Messages", analyticsData.overview.totalMessages],
      ["Total Listings", analyticsData.overview.totalListings],
      ["Active Listings", analyticsData.overview.activeListings],
      ["Sold Listings", analyticsData.overview.soldListings],
      [""],
      ["Top Listings", ""],
      ...analyticsData.topListings.map((listing) => [listing.title, `${listing.views} views, ${listing.likes} likes`]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
        <p className="text-muted-foreground">Start selling to see your analytics here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your marketplace performance</p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time likes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.activeListings} active • {analyticsData.overview.soldListings} sold
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Top Listings</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Listings</CardTitle>
                <CardDescription>Your best performing items by engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topListings.map((listing, index) => (
                    <div key={listing.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-sm text-muted-foreground">${listing.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{listing.views} views</p>
                        <p className="text-xs text-muted-foreground">{listing.likes} likes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Your activity over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyStats.map((stat) => (
                    <div key={stat.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{stat.month}</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{stat.listings} listings</span>
                        <span>{stat.views} views</span>
                        <span>{stat.likes} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="listings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Listing Performance</CardTitle>
              <CardDescription>Detailed breakdown of your listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topListings.map((listing) => (
                  <div key={listing.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{listing.title}</h4>
                      <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                        {listing.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium">{listing.views}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Likes</p>
                        <p className="font-medium">{listing.likes}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Messages</p>
                        <p className="font-medium">{listing.messages}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Your performance trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyStats.map((stat) => (
                  <div key={stat.month} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{stat.month}</h4>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Listings</p>
                        <p className="font-medium">{stat.listings}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium">{stat.views}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Likes</p>
                        <p className="font-medium">{stat.likes}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Messages</p>
                        <p className="font-medium">{stat.messages}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>How your listings perform by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.categoryStats.map((stat) => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="font-medium">{stat.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{stat.count} listings</p>
                      <p className="text-sm text-muted-foreground">{stat.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
