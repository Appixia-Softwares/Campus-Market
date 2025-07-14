"use client"

import { useState } from "react"
import { Bell, Copy, Globe, Lock, Save, Shield, User, Zap, Settings, Database, Activity, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function AdminSettingsPage() {
  // Example state for toggles and inputs
  const [platformName, setPlatformName] = useState("Campus Market")
  const [contactEmail, setContactEmail] = useState("admin@campusmarket.com")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [featureMarketplace, setFeatureMarketplace] = useState(true)
  const [featureAccommodation, setFeatureAccommodation] = useState(true)
  const [featureMessaging, setFeatureMessaging] = useState(true)

  function handleSave(section: string) {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been saved.`,
      variant: "default",
    })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Settings className="h-6 w-6" /> Settings</h1>
      <p className="text-muted-foreground mb-6">Configure admin and platform settings here.</p>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-1" /> General</TabsTrigger>
          <TabsTrigger value="users"><User className="h-4 w-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-1" /> Security</TabsTrigger>
          <TabsTrigger value="features"><Zap className="h-4 w-4 mr-1" /> Features</TabsTrigger>
          <TabsTrigger value="system"><Database className="h-4 w-4 mr-1" /> System</TabsTrigger>
        </TabsList>
        {/* General Tab */}
        <TabsContent value="general">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Platform Info</CardTitle>
              <CardDescription>Update platform name, logo, and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="platformName">Platform Name</Label>
                <Input id="platformName" value={platformName} onChange={e => setPlatformName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder-logo.svg" />
                    <AvatarFallback>CM</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change Logo</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("General")}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Control user registration, roles, and verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Registration Open</Label>
                <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Email Verification</Label>
                <Switch checked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require Student ID Verification</Label>
                <Switch checked={true} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("Users")}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Email & Notifications</CardTitle>
              <CardDescription>Configure email and notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Push Notifications</Label>
                <Switch checked={true} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("Notifications")}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage security settings and policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Two-Factor Authentication</Label>
                <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Password Policy</Label>
                <Select defaultValue="strong">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong">Strong (min 8 chars, symbols)</SelectItem>
                    <SelectItem value="medium">Medium (min 6 chars)</SelectItem>
                    <SelectItem value="weak">Weak (min 4 chars)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("Security")}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* Features Tab */}
        <TabsContent value="features">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable major features for the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Marketplace</Label>
                <Switch checked={featureMarketplace} onCheckedChange={setFeatureMarketplace} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Accommodation</Label>
                <Switch checked={featureAccommodation} onCheckedChange={setFeatureAccommodation} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Messaging</Label>
                <Switch checked={featureMessaging} onCheckedChange={setFeatureMessaging} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("Features")}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* System Tab */}
        <TabsContent value="system">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>System & Maintenance</CardTitle>
              <CardDescription>Manage system status, maintenance mode, and backups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Maintenance Mode</Label>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <div className="flex items-center justify-between">
                <Label>System Status</Label>
                <Badge variant={maintenanceMode ? "destructive" : "default"}>{maintenanceMode ? "Maintenance" : "Online"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Backup Data</Label>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Backup Started", description: "System backup has started." })}>Backup Now</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave("System")}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
}
