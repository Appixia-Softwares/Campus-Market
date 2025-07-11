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
import { collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import ProfileForm from "@/components/profile-form";
import { ProfileFormValues } from "@/types";

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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      // fetchProfileData() // Removed as per edit hint
    }
  }, [user])

  // Remove fetchProfileData and stats state

  // Remove old formData and handleSave logic

  // New save handler for ProfileForm
  // Save handler for ProfileForm, using ProfileFormValues type
  const handleProfileSave = async (values: ProfileFormValues) => {
    if (!user) return
    try {
      setSaving(true)
      const userDoc = doc(db, 'users', user.id)
      await updateDoc(userDoc, {
        full_name: values.fullName,
        phone: values.phone,
        // bio: values.bio, // TODO: Add to backend if needed
        university_id: values.university_id || null,
        // location: values.location, // TODO: Add to backend if needed
        occupation: values.occupation,
        organization: values.organization,
        reason: values.reason,
        course: values.course,
        year_of_study: values.yearOfStudy,
        student_id: values.studentId,
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
      // setUploading(true) // Removed as per edit hint
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
      // setUploading(false) // Removed as per edit hint
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

  if (user === null) {
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
          onClick={() => setIsEditing(true)}
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
                    // disabled={uploading} // Removed as per edit hint
                  >
                    {/* {uploading ? ( // Removed as per edit hint
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : ( */}
                      <Camera className="h-4 w-4" />
                    {/* )} */}
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
              <CardDescription>{user?.university_id ? "University not specified" : "University not specified"}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* stats && ( // Removed as per edit hint
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
            ) */}
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
                        value={user?.full_name || ""}
                        disabled className="bg-muted"
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
                        value={user?.phone || ""}
                        disabled className="bg-muted"
                        placeholder="+263 77 123 4567"
                      />
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={user?.location || ""}
                        disabled className="bg-muted"
                        placeholder="Harare, Zimbabwe"
                      />
                    </div> */} // TODO: Add location to backend if needed
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select
                      value={user?.university_id || "none"}
                      onValueChange={(value) => {}} // No change in user data, just for display
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* universities.map((uni) => ( // Removed as per edit hint */}
                          <SelectItem key="no-university" value="none">
                            No University Selected
                          </SelectItem>
                        {/* ))} */}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={user?.bio || ""}
                      disabled className="bg-muted"
                      rows={3}
                      placeholder="Tell others about yourself..."
                    />
                  </div> */} // TODO: Add bio to backend if needed
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
                  {/* Notification preferences are not in the backend user type. Add if needed. */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control who can see your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Privacy settings are not in the backend user type. Add if needed. */}
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
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl p-0">
          {/* ProfileForm expects onSubmit to receive ProfileFormValues */}
          <ProfileForm onSubmit={handleProfileSave} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
