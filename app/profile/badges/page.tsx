'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserBadgeDisplay, OfficialBadgeDisplay } from '@/components/ui/badge-display'
import { BADGE_CONFIG, ACCOUNT_TIER_BENEFITS, type OfficialBadge, type AccountTier } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { 
  Trophy, 
  Star, 
  Shield, 
  Crown, 
  Users, 
  TrendingUp, 
  Calendar,
  Award,
  Target,
  CheckCircle,
  Clock,
  Building,
  Rocket,
  TestTube,
  GraduationCap,
  ShieldCheck,
  Zap
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email: string
  official_badge?: OfficialBadge
  account_tier?: AccountTier
  is_official_account?: boolean
  verified?: boolean
  badges?: any[]
  achievements?: any[]
  total_sales?: number
  total_reviews?: number
  average_rating?: number
  member_since?: Date
  created_at?: Date
}

export default function BadgesPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalListings: 0,
    totalSales: 0,
    responseRate: 0,
    daysActive: 0,
  })

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchUserStats()
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.id))
      if (userDoc.exists()) {
        setProfile({
          id: userDoc.id,
          ...userDoc.data()
        } as UserProfile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // Get user's listings
      const listingsQuery = query(
        collection(db, 'products'),
        where('seller_id', '==', user.id)
      )
      const listingsSnapshot = await getDocs(listingsQuery)
      
      // Get user's sales (completed orders)
      const salesQuery = query(
        collection(db, 'orders'),
        where('seller_id', '==', user.id),
        where('status', '==', 'completed')
      )
      const salesSnapshot = await getDocs(salesQuery)

      const totalSales = salesSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data()
        return sum + (data.total_amount || 0)
      }, 0)

      // Calculate days active
      const memberSince = profile?.created_at || new Date()
      const daysActive = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

      setStats({
        totalListings: listingsSnapshot.size,
        totalSales,
        responseRate: 95, // Mock data - would calculate from actual responses
        daysActive,
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const getAchievementProgress = (achievement: any) => {
    const progress = (achievement.progress / achievement.max_progress) * 100
    return Math.min(progress, 100)
  }

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'campus_market_official': return <Building className="h-5 w-5" />
      case 'verified_seller': return <CheckCircle className="h-5 w-5" />
      case 'premium_member': return <Star className="h-5 w-5" />
      case 'trusted_seller': return <Shield className="h-5 w-5" />
      case 'top_seller': return <Trophy className="h-5 w-5" />
      case 'community_leader': return <Users className="h-5 w-5" />
      case 'early_adopter': return <Rocket className="h-5 w-5" />
      case 'beta_tester': return <TestTube className="h-5 w-5" />
      case 'campus_ambassador': return <GraduationCap className="h-5 w-5" />
      case 'moderator': return <ShieldCheck className="h-5 w-5" />
      case 'admin': return <Zap className="h-5 w-5" />
      default: return <Award className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-muted-foreground">Unable to load your profile information.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || '/placeholder-user.jpg'} />
              <AvatarFallback>
                {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                {profile.verified && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-2">{profile.email}</p>
              <div className="flex items-center gap-2">
                <UserBadgeDisplay user={profile} size="md" maxDisplay={5} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Member since</div>
              <div className="font-semibold">
                {profile.member_since 
                  ? new Date(profile.member_since).toLocaleDateString()
                  : new Date(profile.created_at || Date.now()).toLocaleDateString()
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalListings}</div>
                <div className="text-sm text-muted-foreground">Active Listings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">${stats.totalSales}</div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{profile.average_rating || 0}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.daysActive}</div>
                <div className="text-sm text-muted-foreground">Days Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges and Achievements */}
      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="account">Account Status</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>
                Badges earned through your activity and contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.badges && profile.badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.badges.map((badge) => (
                    <Card key={badge.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getBadgeIcon(badge.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{badge.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {badge.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned {new Date(badge.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
                  <p className="text-muted-foreground">
                    Start selling and engaging with the community to earn badges!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>
                Track your progress towards various achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.achievements && profile.achievements.length > 0 ? (
                <div className="space-y-4">
                  {profile.achievements.map((achievement) => (
                    <Card key={achievement.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {achievement.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Target className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{achievement.name}</h3>
                            {achievement.completed && (
                              <Badge variant="default" className="bg-green-600">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{achievement.progress} / {achievement.max_progress}</span>
                            </div>
                            <Progress value={getAchievementProgress(achievement)} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground">
                    Achievements will appear here as you use the platform.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                Your current account tier and benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Account Tier */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Tier</h3>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {profile.account_tier === 'official' && <Crown className="h-6 w-6 text-blue-600" />}
                        {profile.account_tier === 'premium' && <Star className="h-6 w-6 text-yellow-600" />}
                        {profile.account_tier === 'basic' && <Shield className="h-6 w-6 text-green-600" />}
                        {(!profile.account_tier || profile.account_tier === 'free') && <Users className="h-6 w-6 text-gray-600" />}
                        <div>
                          <h4 className="font-semibold">
                            {profile.account_tier ? 
                              ACCOUNT_TIER_BENEFITS[profile.account_tier as AccountTier]?.name || 'Free' 
                              : 'Free'
                            }
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {profile.account_tier ? 
                              ACCOUNT_TIER_BENEFITS[profile.account_tier as AccountTier]?.description 
                              : 'Basic account features'
                            }
                          </p>
                        </div>
                      </div>
                      {profile.is_official_account && (
                        <OfficialBadgeDisplay badge={profile.official_badge!} size="lg" />
                      )}
                    </div>
                  </Card>
                </div>

                {/* Account Benefits */}
                {profile.account_tier && profile.account_tier !== 'free' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ACCOUNT_TIER_BENEFITS[profile.account_tier as AccountTier]?.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        {profile.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span>Account Verification</span>
                      </div>
                      <Badge variant={profile.verified ? "default" : "secondary"}>
                        {profile.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
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