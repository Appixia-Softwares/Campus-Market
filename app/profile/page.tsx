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
import { Star, Shield, Camera, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { uploadFileToStorage } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import ProfileForm from "@/components/profile-form";
import { ProfileFormValues } from "@/types";
import ZIM_UNIVERSITIES from "@/utils/schools_data";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

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
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  // Avatar upload handler with preview and loading state
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setAvatarUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const avatarUrl = await uploadFileToStorage(fileName, file);
      await updateDoc(doc(db, 'users', user.id), { avatar_url: avatarUrl });
      setAvatarPreview(null);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

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
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Sidebar: overlay on mobile, collapsible on desktop */}
      {/* Desktop sidebar */}
      <div className="hidden md:block transition-all duration-300 h-full w-64 flex-shrink-0 bg-background border-r">
        <DashboardSidebar />
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          {/* Sidebar */}
          <div className="relative w-64 h-full bg-background border-r shadow-lg">
            <DashboardSidebar isMobile />
          </div>
        </div>
      )}
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMobileMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-auto p-2 md:p-6 bg-background">
          {/* Profile content below */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground text-sm md:text-base">Manage your account settings and preferences</p>
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
            <div className="grid gap-4 md:gap-6 md:grid-cols-3">
              {/* Modern Avatar Card with Upload */}
              <Card className="md:col-span-1 flex flex-col items-center py-6 md:py-8 bg-gradient-to-b from-background to-muted/60 shadow-lg">
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {avatarUploading ? (
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    ) : avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Avatar className="h-32 w-32">
                <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-3xl">
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
                    <Camera className="h-5 w-5" />
                </label>
                </div>
                <div className="text-center">
                  <h3 className="text-base md:text-lg font-semibold">Profile Photo</h3>
                  <p className="text-xs text-muted-foreground">Click the camera to upload a new photo</p>
                </div>
        </Card>

        {/* Profile Details */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="overflow-x-auto whitespace-nowrap">
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
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                              value={user?.location || ""}
                              disabled className="bg-muted"
                        placeholder="Harare, Zimbabwe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                          <div className="bg-muted rounded px-3 py-2 min-h-[40px] flex items-center">
                            {(() => {
                              if (!user?.university_id || user.university_id === 'none') return 'No University Selected';
                              const uni = ZIM_UNIVERSITIES.find(u => u.id === user.university_id);
                              return uni ? uni.name + (uni.location ? ` (${uni.location})` : '') : 'No University Selected';
                            })()}
                          </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                            value={user?.bio || ""}
                            disabled className="bg-muted"
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
                        {/* Notification preferences toggles */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                            checked={user?.email_notifications ?? false}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { email_notifications: checked });
                            }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <Switch
                            checked={user?.push_notifications ?? false}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { push_notifications: checked });
                            }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Message Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified of new messages</p>
                    </div>
                    <Switch
                            checked={user?.message_notifications ?? false}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { message_notifications: checked });
                            }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive promotional content</p>
                    </div>
                    <Switch
                            checked={user?.marketing_emails ?? false}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { marketing_emails: checked });
                            }}
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
                        {/* Privacy settings toggles */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                    </div>
                    <Switch
                            checked={user?.profile_visible ?? true}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { profile_visible: checked });
                            }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                            checked={user?.show_online_status ?? true}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { show_online_status: checked });
                            }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Contact Info</Label>
                      <p className="text-sm text-muted-foreground">Display your contact information</p>
                    </div>
                    <Switch
                            checked={user?.show_contact_info ?? false}
                            onCheckedChange={async (checked) => {
                              if (!user) return;
                              await updateDoc(doc(db, 'users', user.id), { show_contact_info: checked });
                            }}
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
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="max-w-2xl p-0">
                {/* ProfileForm expects onSubmit to receive ProfileFormValues */}
                <ProfileForm onSubmit={handleProfileSave} />
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </div>
  )
}
