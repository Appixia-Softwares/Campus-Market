"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, MessageSquare, Calendar, MapPin, Search, Star, UserPlus, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

interface CommunityStats {
  totalUsers: number
  activeToday: number
  totalProducts: number
  totalUniversities: number
}

interface TopMember {
  id: string
  full_name: string
  avatar_url: string | null
  university: {
    name: string
    abbreviation: string
  } | null
  verified: boolean
  product_count: number
  average_rating: number
  total_sales: number
}

interface University {
  id: string
  name: string
  abbreviation: string
  location: string
  user_count: number
}

interface RecentActivity {
  id: string
  type: string
  user: {
    full_name: string
    avatar_url: string | null
  }
  product?: {
    title: string
  }
  created_at: string
}

export default function CommunityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [topMembers, setTopMembers] = useState<TopMember[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCommunityData()
  }, [])

  const fetchCommunityData = async () => {
    try {
      setLoading(true)

      // Fetch community stats
      const [{ count: totalUsers }, { count: totalProducts }, { data: universities }] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("universities").select("*").order("name"),
      ])

      // Get users active today (simplified - you might want to track last_seen)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: activeToday } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        totalProducts: totalProducts || 0,
        totalUniversities: universities?.length || 0,
      })

      // Fetch top members with their stats
      const { data: topMembersData, error: membersError } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          avatar_url,
          verified,
          university:universities(name, abbreviation),
          products!products_seller_id_fkey(id, status)
        `)
        .eq("status", "active")
        .limit(10)

      if (membersError) throw membersError

      // Process top members data
      const processedMembers =
        topMembersData
          ?.map((member) => ({
            id: member.id,
            full_name: member.full_name || "Unknown User",
            avatar_url: member.avatar_url,
            university: member.university,
            verified: member.verified || false,
            product_count: member.products?.length || 0,
            average_rating: 4.5, // You can implement actual rating calculation
            total_sales: member.products?.filter((p) => p.status === "sold").length || 0,
          }))
          .sort((a, b) => b.product_count + b.total_sales - (a.product_count + a.total_sales)) || []

      setTopMembers(processedMembers)

      // Fetch universities with user counts
      const universitiesWithCounts = await Promise.all(
        (universities || []).map(async (uni) => {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("university_id", uni.id)

          return {
            ...uni,
            user_count: count || 0,
          }
        }),
      )

      setUniversities(universitiesWithCounts.sort((a, b) => b.user_count - a.user_count))

      // Fetch recent activity (simplified)
      const { data: recentProducts } = await supabase
        .from("products")
        .select(`
          id,
          title,
          created_at,
          users!products_seller_id_fkey(full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      const activityData =
        recentProducts?.map((product) => ({
          id: product.id,
          type: "product_created",
          user: {
            full_name: product.users?.full_name || "Unknown User",
            avatar_url: product.users?.avatar_url,
          },
          product: {
            title: product.title,
          },
          created_at: product.created_at,
        })) || []

      setRecentActivity(activityData)
    } catch (error) {
      console.error("Error fetching community data:", error)
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startConversation = async (memberId: string) => {
    if (!user || memberId === user.id) return

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_1_id.eq.${user.id},participant_2_id.eq.${memberId}),and(participant_1_id.eq.${memberId},participant_2_id.eq.${user.id})`,
        )
        .single()

      if (existingConversation) {
        window.location.href = `/messages/${existingConversation.id}`
        return
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          participant_1_id: user.id,
          participant_2_id: memberId,
        })
        .select()
        .single()

      if (error) throw error

      window.location.href = `/messages/${newConversation.id}`
    } catch (error) {
      console.error("Error starting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    }
  }

  const filteredMembers = topMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.university?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
            <Skeleton className="h-9 w-32" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">Connect with fellow students and traders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friends
          </Button>
        </div>
      </div>

      {/* Community Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeToday}</div>
            <p className="text-xs text-muted-foreground">New members today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Products available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universities</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUniversities}</div>
            <p className="text-xs text-muted-foreground">Participating schools</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Top Members</TabsTrigger>
          <TabsTrigger value="universities">Universities</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Community Members</CardTitle>
              <CardDescription>Most active and trusted members in the community</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members found</h3>
                  <p className="text-muted-foreground">Try adjusting your search</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMembers.map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Avatar>
                          <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {member.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.full_name}</p>
                            {member.verified && <Shield className="h-4 w-4 text-blue-600" />}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.university?.name || "University not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{member.average_rating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.product_count} listings • {member.total_sales} sales
                          </p>
                        </div>
                        {user && member.id !== user.id && (
                          <Button variant="outline" size="sm" onClick={() => startConversation(member.id)}>
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="universities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participating Universities</CardTitle>
              <CardDescription>Universities with active members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {universities.map((university) => (
                  <Card key={university.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{university.name}</CardTitle>
                        <Badge variant="secondary">{university.abbreviation}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {university.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {university.user_count} members
                        </div>
                        <Button size="sm" variant="outline">
                          View Members
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest community activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-4 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {activity.user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.full_name}</span>
                        {activity.type === "product_created" && " listed a new product"}
                        {activity.product && <span className="text-muted-foreground"> "{activity.product.title}"</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
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
