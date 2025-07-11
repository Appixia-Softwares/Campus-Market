"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Shield, Camera } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { uploadFileToStorage } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore'

interface ProfileStats {
  totalListings: number
  activeListing: number
  totalSales: number
  totalViews: number
  totalLikes: number
  averageRating: number
  responseRate: number
  joinDate: string
}

interface University {
  id: string
  name: string
  abbreviation: string
  location: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [universities, setUniversities] = useState<University[]>([])

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
    university_id: "",
    location: "",
  })

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    marketing_emails: false,
    profile_visible: true,
    show_online_status: true,
    show_contact_info: false,
  })

  useEffect(() => {
    if (user) {
      fetchProfileData()
      fetchUniversities()
    }
  }, [user])

  const fetchProfileData = async () => {
    if (!user) return
    try {
      setLoading(true)
      // Set form data from user (or profile if available)
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        bio: (user as any).bio || "",
        university_id: user.university_id || "",
        location: (user as any).location || "",
      })
      // Fetch user's product stats
      const productsRef = collection(db, 'products')
      const productsQuery = query(productsRef, where('seller_id', '==', user.id))
      const productsSnap = await getDocs(productsQuery)
      const products = productsSnap.docs.map(doc => doc.data())
      const totalListings = products.length
      const activeListings = products.filter((p: any) => p.status === "active").length
      const soldListings = products.filter((p: any) => p.status === "sold").length
      const totalViews = products.reduce((sum: number, p: any) => sum + (p.views || 0), 0)
      const totalLikes = products.reduce((sum: number, p: any) => sum + (p.likes || 0), 0)
      // Fetch user's reviews to calculate average rating
      const reviewsRef = collection(db, 'reviews')
      const reviewsQuery = query(reviewsRef, where('receiver_id', '==', user.id))
      const reviewsSnap = await getDocs(reviewsQuery)
      const reviews = reviewsSnap.docs.map(doc => doc.data())
      const averageRating = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0
      // Calculate response rate (simplified)
      const responseRate = 95
      setStats({
        totalListings,
        activeListing: activeListings,
        totalSales: soldListings,
        totalViews,
        totalLikes,
        averageRating,
        responseRate,
        joinDate: typeof user.created_at === 'string' ? user.created_at : (user.created_at ? user.created_at.toISOString() : ''),
      })
    } catch (error) {
      console.error("Error fetching profile data:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUniversities = async () => {
    try {
      const universitiesRef = collection(db, 'universities')
      const universitiesSnap = await getDocs(universitiesRef)
      setUniversities(universitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as University))
    } catch (error) {
      console.error("Error fetching universities:", error)
    }
  }

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      const userDoc = doc(db, 'users', user.id)
      await updateDoc(userDoc, {
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        university_id: formData.university_id || null,
        location: formData.location,
        updated_at: new Date().toISOString(),
      })
      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    try {
      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const avatarUrl = await uploadFileToStorage(fileName, file)
      // Update user profile with new avatar URL (implement this logic as needed)
      // await updateProfile({ avatar_url: avatarUrl })
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const requestVerification = async () => {
    try {
      // In a real app, this would trigger a verification process
      toast({
        title: "Verification requested",
        description: "Your verification request has been submitted. We'll review it within 24 hours.",
      })
    } catch (error) {
      console.error("Error requesting verification:", error)
      toast({
        title: "Error",
        description: "Failed to request verification",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardHeader>
          </Card>
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saving}
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">
                  {(user?.full_name || user?.email || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full cursor-pointer"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </label>
              </div>
            </div>
            <div>
              <CardTitle className="flex items-center justify-center gap-2">
                {user?.full_name || user?.email?.split("@")[0] || "User"}
                {user?.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{universities.find(u => u.id === user?.university_id)?.name || "University not specified"}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "No ratings"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Listings</span>
                  <span className="font-medium">{stats.totalListings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Successful Sales</span>
                  <span className="font-medium">{stats.totalSales}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Views</span>
                  <span className="font-medium">{stats.totalViews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {typeof stats.joinDate === 'string' && stats.joinDate
                      ? new Date(stats.joinDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+263 77 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Harare, Zimbabwe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select
                      value={formData.university_id}
                      onValueChange={(value) => setFormData({ ...formData, university_id: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id}>
                            {uni.name} ({uni.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Tell others about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <Switch
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, push_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified of new messages</p>
                    </div>
                    <Switch
                      checked={preferences.message_notifications}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, message_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive promotional content</p>
                    </div>
                    <Switch
                      checked={preferences.marketing_emails}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, marketing_emails: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control who can see your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                    </div>
                    <Switch
                      checked={preferences.profile_visible}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, profile_visible: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                      checked={preferences.show_online_status}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, show_online_status: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Contact Info</Label>
                      <p className="text-sm text-muted-foreground">Display your contact information</p>
                    </div>
                    <Switch
                      checked={preferences.show_contact_info}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, show_contact_info: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Verification</CardTitle>
                  <CardDescription>Verify your student status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.verified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Your account is verified</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Verify your student status to gain access to exclusive features and build trust with other
                        users.
                      </p>
                      <Button onClick={requestVerification}>Start Verification</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
