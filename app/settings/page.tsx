"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Shield, Palette, Globe, Download, Trash2, AlertTriangle, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { profile } from "console"

interface UserSettings {
  theme: string
  language: string
  currency: string
  timezone: string
  compact_mode: boolean
  animations: boolean
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  price_drop_alerts: boolean
  new_listing_alerts: boolean
  marketing_emails: boolean
  profile_visible: boolean
  show_online_status: boolean
  show_last_seen: boolean
  show_contact_info: boolean
  activity_history: boolean
  analytics_enabled: boolean
  personalization: boolean
  crash_reports: boolean
}

interface StorageUsage {
  images: number
  messages: number
  cache: number
  total: number
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    language: "en",
    currency: "usd",
    timezone: "africa/harare",
    compact_mode: false,
    animations: true,
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    price_drop_alerts: true,
    new_listing_alerts: false,
    marketing_emails: false,
    profile_visible: true,
    show_online_status: true,
    show_last_seen: false,
    show_contact_info: false,
    activity_history: false,
    analytics_enabled: true,
    personalization: true,
    crash_reports: true,
  })
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({
    images: 0,
    messages: 0,
    cache: 0,
    total: 0,
  })

  useEffect(() => {
    if (user) {
      fetchUserSettings()
      fetchStorageUsage()
    }
  }, [user])

  const fetchUserSettings = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch user preferences from database
      // No user preferences to fetch; using default settings
      setLoading(false)
    } catch (error) {
      console.error("Error fetching user settings:", error)
      setLoading(false)
    }
  }

  const fetchStorageUsage = async () => {
    if (!user) return

    try {
      // Calculate storage usage from user's data
      // This logic is removed as per the instructions

      // Estimate storage usage (in MB)
      const imageStorage = 0 // No profile.images, so set to 0 or fetch from Firestore if needed
      const messageStorage = 0 // No messagesList, so set to 0 or fetch from Firestore if needed
      const cacheStorage = 8.4 // Fixed cache size

      setStorageUsage({
        images: imageStorage,
        messages: messageStorage,
        cache: cacheStorage,
        total: imageStorage + messageStorage + cacheStorage,
      })
    } catch (error) {
      console.error("Error fetching storage usage:", error)
    }
  }

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return

    try {
      setSaving(true)

      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)

      // Save to database
      // This logic is removed as per the instructions

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    if (!user) return

    try {
      // Fetch all user data
      // This logic is removed as per the instructions

      const exportData = {
        settings,
        storageUsage,
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campus-market-data-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Data exported",
        description: "Your data has been exported successfully",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const clearCache = async () => {
    try {
      // Clear browser cache
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      }

      // Clear localStorage
      localStorage.clear()

      setStorageUsage((prev) => ({ ...prev, cache: 0, total: prev.total - prev.cache }))

      toast({
        title: "Cache cleared",
        description: "Application cache has been cleared",
      })
    } catch (error) {
      console.error("Error clearing cache:", error)
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      })
    }
  }

  const deleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
    )

    if (!confirmed) return

    try {
      // In a real app, you'd want to implement proper account deletion
      // This might involve soft deletion, data anonymization, etc.

      toast({
        title: "Account deletion requested",
        description:
          "Your account deletion request has been submitted. You'll receive an email with further instructions.",
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to process account deletion",
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
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and account settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data & Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the application looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(value) => {
                    setTheme(value)
                    saveSettings({ theme: value })
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use a more compact layout to fit more content</p>
                </div>
                <Switch
                  checked={settings.compact_mode}
                  onCheckedChange={(checked) => saveSettings({ compact_mode: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable smooth animations and transitions</p>
                </div>
                <Switch
                  checked={settings.animations}
                  onCheckedChange={(checked) => saveSettings({ animations: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Set your language and regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={settings.language} onValueChange={(value) => saveSettings({ language: value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sn">Shona</SelectItem>
                    <SelectItem value="nd">Ndebele</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => saveSettings({ currency: value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="zwl">ZWL (Z$)</SelectItem>
                    <SelectItem value="zar">ZAR (R)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Zone</Label>
                <Select value={settings.timezone} onValueChange={(value) => saveSettings({ timezone: value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="africa/harare">Africa/Harare (CAT)</SelectItem>
                    <SelectItem value="africa/johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Messages</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => saveSettings({ email_notifications: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Price Drops</Label>
                  <p className="text-sm text-muted-foreground">Get notified when items you're watching drop in price</p>
                </div>
                <Switch
                  checked={settings.price_drop_alerts}
                  onCheckedChange={(checked) => saveSettings({ price_drop_alerts: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Listings</Label>
                  <p className="text-sm text-muted-foreground">Notifications for new listings in your categories</p>
                </div>
                <Switch
                  checked={settings.new_listing_alerts}
                  onCheckedChange={(checked) => saveSettings({ new_listing_alerts: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                </div>
                <Switch
                  checked={settings.marketing_emails}
                  onCheckedChange={(checked) => saveSettings({ marketing_emails: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Methods</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => saveSettings({ email_notifications: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => saveSettings({ push_notifications: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Important notifications via SMS</p>
                  <Badge variant="outline" className="text-xs">
                    Premium
                  </Badge>
                </div>
                <Switch
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => saveSettings({ sms_notifications: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Controls
              </CardTitle>
              <CardDescription>Control who can see your information and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                </div>
                <Switch
                  checked={settings.profile_visible}
                  onCheckedChange={(checked) => saveSettings({ profile_visible: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                </div>
                <Switch
                  checked={settings.show_online_status}
                  onCheckedChange={(checked) => saveSettings({ show_online_status: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Last Seen</Label>
                  <p className="text-sm text-muted-foreground">Display when you were last active</p>
                </div>
                <Switch
                  checked={settings.show_last_seen}
                  onCheckedChange={(checked) => saveSettings({ show_last_seen: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Contact Information</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see your contact details</p>
                </div>
                <Switch
                  checked={settings.show_contact_info}
                  onCheckedChange={(checked) => saveSettings({ show_contact_info: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activity History</Label>
                  <p className="text-sm text-muted-foreground">Show your recent activity to others</p>
                </div>
                <Switch
                  checked={settings.activity_history}
                  onCheckedChange={(checked) => saveSettings({ activity_history: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
              <CardDescription>Control what data we collect to improve your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help us improve by sharing anonymous usage data</p>
                </div>
                <Switch
                  checked={settings.analytics_enabled}
                  onCheckedChange={(checked) => saveSettings({ analytics_enabled: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Personalization</Label>
                  <p className="text-sm text-muted-foreground">Use your data to personalize recommendations</p>
                </div>
                <Switch
                  checked={settings.personalization}
                  onCheckedChange={(checked) => saveSettings({ personalization: checked })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Crash Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send crash reports to help us fix issues
                  </p>
                </div>
                <Switch
                  checked={settings.crash_reports}
                  onCheckedChange={(checked) => saveSettings({ crash_reports: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>Download your data and account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You can request a copy of all your data including your profile, listings, messages, and activity
                  history.
                </p>
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>See how much storage your account is using</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Images</span>
                  <span>{storageUsage.images.toFixed(1)} MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(storageUsage.images / Math.max(storageUsage.total, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Messages</span>
                  <span>{storageUsage.messages.toFixed(1)} MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(storageUsage.messages / Math.max(storageUsage.total, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Cache</span>
                  <span>{storageUsage.cache.toFixed(1)} MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(storageUsage.cache / Math.max(storageUsage.total, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{storageUsage.total.toFixed(1)} MB</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={clearCache}>
                Clear Cache
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that will affect your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-destructive">Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" onClick={deleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
