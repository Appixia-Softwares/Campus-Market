"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag, Eye, Heart, MessageSquare, Download, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
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

      // Fetch user's products with stats
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          views,
          likes,
          status,
          created_at,
          product_categories (name)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })

      if (productsError) throw productsError

      // Fetch messages count for user's products
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select("id, product_id")
        .in("product_id", products?.map((p) => p.id) || [])

      if (conversationsError) throw conversationsError

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
        const category = product.product_categories?.name || "Other"
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
            const productDate = new Date(p.created_at)
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

    toast({
      title: "Export successful",
      description: "Analytics data has been exported to CSV",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
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
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
          <p className="text-muted-foreground mb-6">Start selling products to see your analytics</p>
          <Button asChild>
            <a href="/marketplace/sell">Create Your First Listing</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track your marketplace performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
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
            <p className="text-xs text-muted-foreground">Across {analyticsData.overview.totalListings} listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.totalViews > 0
                ? `${((analyticsData.overview.totalLikes / analyticsData.overview.totalViews) * 100).toFixed(1)}% like rate`
                : "No views yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.totalViews > 0
                ? `${((analyticsData.overview.totalMessages / analyticsData.overview.totalViews) * 100).toFixed(1)}% conversion`
                : "No conversations yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.activeListings}</div>
            <p className="text-xs text-muted-foreground">{analyticsData.overview.soldListings} sold</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Top Listings</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>Your marketplace activity by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyStats.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{data.month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {data.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {data.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {data.messages}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {data.listings}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Your listings by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categoryStats.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full">
                          <div
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{category.count}</span>
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
              <CardTitle>Top Performing Listings</CardTitle>
              <CardDescription>Your most popular listings</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.topListings.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first listing to see analytics</p>
                  <Button asChild>
                    <a href="/marketplace/sell">Create Listing</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData.topListings.map((listing, index) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-sm text-muted-foreground">
                            ${listing.price.toFixed(2)} • {listing.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {listing.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {listing.messages}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/marketplace/products/${listing.id}`}>View</a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key metrics and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Engagement Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">Average Views per Listing</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.overview.totalListings > 0
                          ? Math.round(analyticsData.overview.totalViews / analyticsData.overview.totalListings)
                          : 0}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">Like Rate</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.overview.totalViews > 0
                          ? `${((analyticsData.overview.totalLikes / analyticsData.overview.totalViews) * 100).toFixed(1)}%`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    {analyticsData.overview.totalViews === 0 && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span>Add high-quality photos to increase views</span>
                      </div>
                    )}
                    {analyticsData.overview.totalLikes / Math.max(analyticsData.overview.totalViews, 1) < 0.05 && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                        <Heart className="h-4 w-4 text-yellow-600" />
                        <span>Improve your descriptions to increase engagement</span>
                      </div>
                    )}
                    {analyticsData.overview.activeListings === 0 && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                        <span>Create more listings to reach more buyers</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
