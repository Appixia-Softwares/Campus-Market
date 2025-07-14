"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, Camera, Loader2, Menu, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import ZIM_UNIVERSITIES from "@/utils/schools_data"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import DashboardSidebar from "@/components/dashboard-sidebar"

// Mock data and types for demonstration
interface User {
  id: string
  full_name?: string
  email?: string
  phone?: string
  location?: string
  bio?: string
  avatar_url?: string
  university_id?: string
  verified?: boolean
  email_notifications?: boolean
  push_notifications?: boolean
  message_notifications?: boolean
  marketing_emails?: boolean
  profile_visible?: boolean
  show_online_status?: boolean
  show_contact_info?: boolean
}

interface ProfileFormValues {
  fullName: string
  phone: string
  university_id: string
  occupation: string
  organization: string
  reason: string
  course: string
  yearOfStudy: string
  studentId: string
}






const ProfileForm = ({ onSubmit }: { onSubmit: (values: ProfileFormValues) => void }) => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          fullName: "John Doe",
          phone: "+263 77 123 4567",
          university_id: "uz",
          occupation: "Student",
          organization: "University of Zimbabwe",
          reason: "Academic",
          course: "Computer Science",
          yearOfStudy: "3",
          studentId: "R123456",
        })
      }}
    >
      <Button type="submit">Save Changes</Button>
    </form>
  </div>
)

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleProfileSave = async (values: ProfileFormValues) => {
    if (!user) return

    try {
      setSaving(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

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

    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setAvatarUploading(true)
    try {
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setAvatarPreview(null)
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
      setAvatarUploading(false)
    }
  }

  const requestVerification = async () => {
    try {
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

  const updateUserPreference = async (field: string, value: boolean) => {
    if (!user) return
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  if (user === null) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block w-64 border-r bg-background">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1 p-6">
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
    

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full bg-background border-r shadow-lg">
            <DashboardSidebar isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(true)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Avatar Card */}
              <Card className="lg:col-span-1">
                <CardContent className="flex flex-col items-center py-8">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {avatarUploading ? (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      ) : avatarPreview ? (
                        <img
                          src={avatarPreview || "/placeholder.svg"}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-2xl">
                            {(user?.full_name || user?.email || "U")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg border-2 border-white"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
                      {user?.full_name}
                      {user?.verified && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-2">Click the camera to upload a new photo</p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Details */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="personal" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={user?.full_name || ""} disabled className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={user?.phone || ""}
                              disabled
                              className="bg-muted"
                              placeholder="+263 77 123 4567"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={user?.location || ""}
                              disabled
                              className="bg-muted"
                              placeholder="Harare, Zimbabwe"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="university">University</Label>
                          <div className="bg-muted rounded px-3 py-2 min-h-[40px] flex items-center">
                            {(() => {
                              if (!user?.university_id || user.university_id === "none") return "No University Selected"
                              const uni = ZIM_UNIVERSITIES.find((u) => u.id === user.university_id)
                              return uni ? `${uni.name} (${uni.location})` : "No University Selected"
                            })()}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={user?.bio || ""}
                            disabled
                            className="bg-muted"
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
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={user?.email_notifications ?? false}
                            onCheckedChange={(checked) => updateUserPreference("email_notifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive push notifications</p>
                          </div>
                          <Switch
                            checked={user?.push_notifications ?? false}
                            onCheckedChange={(checked) => updateUserPreference("push_notifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Message Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get notified of new messages</p>
                          </div>
                          <Switch
                            checked={user?.message_notifications ?? false}
                            onCheckedChange={(checked) => updateUserPreference("message_notifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">Receive promotional content</p>
                          </div>
                          <Switch
                            checked={user?.marketing_emails ?? false}
                            onCheckedChange={(checked) => updateUserPreference("marketing_emails", checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Privacy Settings</CardTitle>
                        <CardDescription>Control who can see your information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                          </div>
                          <Switch
                            checked={user?.profile_visible ?? true}
                            onCheckedChange={(checked) => updateUserPreference("profile_visible", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Online Status</Label>
                            <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                          </div>
                          <Switch
                            checked={user?.show_online_status ?? true}
                            onCheckedChange={(checked) => updateUserPreference("show_online_status", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Contact Info</Label>
                            <p className="text-sm text-muted-foreground">Display your contact information</p>
                          </div>
                          <Switch
                            checked={user?.show_contact_info ?? false}
                            onCheckedChange={(checked) => updateUserPreference("show_contact_info", checked)}
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
        </main>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl p-0">
          <ProfileForm onSubmit={handleProfileSave} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
