"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { listenToSettings, updateSettings, getFeatureFlags, setFeatureFlag, getExperiments, setExperiment } from "@/lib/api/settings"
import { getAllUsersRealtime, updateUser, deleteUser } from "@/lib/api/users";
import { getAllReportsRealtime } from "@/lib/api/reports";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { deleteNotification } from "@/lib/api/notifications"


export default function AdminSettingsPage() {
  // Firestore-backed settings state
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // Real-time users
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    user?: any;
    notif?: any;
    log?: any;
    action: 'delete' | 'ban' | 'demote' | 'deleteNotif' | 'exportLogs';
  } | null>(null);

  // State for dialogs
  const [showKeysDialog, setShowKeysDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showFlagsDialog, setShowFlagsDialog] = useState(false);
  const [showExperimentsDialog, setShowExperimentsDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Mock API keys and logs for now
  const [apiKeys, setApiKeys] = useState([
    { id: 'key1', value: 'sk_live_123...', created: '2024-06-01' },
    { id: 'key2', value: 'sk_live_456...', created: '2024-06-02' },
  ]);
  const [auditLogs, setAuditLogs] = useState([
    { id: 'log1', action: 'deleteUser', target: 'user123', admin: 'silver', time: '2024-06-01 10:00' },
    { id: 'log2', action: 'banUser', target: 'user456', admin: 'silver', time: '2024-06-02 12:00' },
  ]);

  // Real-time feature flags
  const [featureFlags, setFeatureFlags] = useState<any>({});
  const [experiments, setExperiments] = useState<any>({});

  const newFlagRef = useRef<HTMLInputElement>(null);
  const newExpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = listenToSettings((data) => {
      setSettings(data)
      setLoading(false)
      // Sync featureFlags state with Firestore in real time
      setFeatureFlags(data.featureFlags || {});
    })
    return () => unsub()
  }, [])

  // Real-time users
  useEffect(() => {
    const unsub = getAllUsersRealtime(setUsers);
    return () => unsub();
  }, []);

  // Real-time logs (reports as logs)
  useEffect(() => {
    const unsub = getAllReportsRealtime(setLogs);
    return () => unsub();
  }, []);

  // Real-time notifications (polling for now, can be optimized with onSnapshot if available)
  useEffect(() => {
    let ignore = false;
    async function fetchNotifs() {
      const res = await fetch('/api/notifications?userId=admin');
      const { data } = await res.json();
      if (!ignore) setNotifications(data || []);
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => { ignore = true; clearInterval(interval); };
  }, []);

  // Real-time feature flags
  useEffect(() => {
    if (!showFlagsDialog) return;
    let ignore = false;
    async function fetchFlags() {
      const flags = await getFeatureFlags();
      if (!ignore) setFeatureFlags(flags);
    }
    fetchFlags();
    const interval = setInterval(fetchFlags, 3000);
    return () => { ignore = true; clearInterval(interval); };
  }, [showFlagsDialog]);

  // Real-time experiments
  useEffect(() => {
    if (!showExperimentsDialog) return;
    let ignore = false;
    async function fetchExperiments() {
      const exps = await getExperiments();
      if (!ignore) setExperiments(exps);
    }
    fetchExperiments();
    const interval = setInterval(fetchExperiments, 3000);
    return () => { ignore = true; clearInterval(interval); };
  }, [showExperimentsDialog]);

  // Handlers for updating settings in Firestore
  const handleChange = useCallback((field: string, value: any) => {
    updateSettings({ [field]: value })
    toast({ title: "Settings Updated", description: `${field} updated.`, variant: "default" })
  }, [])

  // User actions
  const handleBanUser = async (userId: string, banned: boolean) => {
    await updateUser(userId, { status: banned ? 'banned' : 'active' });
    toast({ title: banned ? "User Banned" : "User Unbanned" });
  };
  const handlePromoteUser = async (userId: string, role: string) => {
    await updateUser(userId, { role });
    toast({ title: `User role set to ${role}` });
  };
  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    toast({ title: "User Deleted" });
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    const { user, action } = confirmAction;
    if (action === 'delete') await handleDeleteUser(user.id);
    if (action === 'ban') await handleBanUser(user.id, true);
    if (action === 'demote') await handlePromoteUser(user.id, 'user');
    setConfirmAction(null);
  };

  // Notification actions
  const handleMarkNotifRead = async (notifId: string) => {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notifId }),
    });
  };
  const handleDeleteNotif = async (notifId: string) => {
    await fetch('/api/notifications/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notifId }),
    });
    toast({ title: 'Notification Deleted' });
  };
  const handleSendTestNotif = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification: { userId: 'admin', title: 'Test Notification', body: 'This is a test.', type: 'admin', read: false } }),
    });
    toast({ title: 'Test Notification Sent' });
  };

  // Notification actions with confirmation
  const handleDeleteNotifConfirmed = async () => {
    if (confirmAction?.notif) {
      await deleteNotification(confirmAction.notif.id);
      toast({ title: "Notification Deleted" });
      setConfirmAction(null);
    }
  };

  // Logs export with confirmation
  const handleExportLogs = () => {
    // Export logs as CSV
    const csv = [
      ["Type", "Title", "Time", "ID"],
      ...logs.map(log => [log.type || "-", log.title || log.id, log.created_at && log.created_at.seconds ? new Date(log.created_at.seconds * 1000).toLocaleString() : "-", log.id])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs.csv";
    a.click();
    URL.revokeObjectURL(url);
    setConfirmAction(null);
  };

  // API Key actions (mocked)
  const handleCreateKey = () => {
    const newKey = { id: `key${apiKeys.length + 1}`, value: `sk_live_${Math.random().toString(36).slice(2, 10)}...`, created: new Date().toISOString().slice(0, 10) };
    setApiKeys([...apiKeys, newKey]);
  };
  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>
  }

  return (
    <div className="p-8 w-full max-w-none">
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
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
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
                <Input id="platformName" value={settings.platformName || ""} onChange={e => handleChange("platformName", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" type="email" value={settings.contactEmail || ""} onChange={e => handleChange("contactEmail", e.target.value)} />
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={settings.logoUrl || "/placeholder-logo.svg"} />
                    <AvatarFallback>CM</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change Logo</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: "Settings Saved", description: "General settings have been saved." })}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Control user registration, roles, and verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto w-full">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">Name</th>
                      <th className="px-2 py-1">Email</th>
                      <th className="px-2 py-1">Role</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b">
                        <td className="px-2 py-1">{user.full_name || user.email || user.id}</td>
                        <td className="px-2 py-1">{user.email}</td>
                        <td className="px-2 py-1">{user.role}</td>
                        <td className="px-2 py-1">{user.status === 'banned' ? <Badge variant="destructive">Banned</Badge> : <Badge variant="default">Active</Badge>}</td>
                        <td className="px-2 py-1 flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setConfirmAction({ user, action: 'ban' })} disabled={user.status === 'banned'}>Ban</Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmAction({ user, action: 'demote' })} disabled={user.role !== 'admin'}>Demote</Button>
                          <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ user, action: 'delete' })}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-muted-foreground">Total users: {users.length}</span>
            </CardFooter>
          </Card>
          {/* Confirmation Dialog */}
          <Dialog open={!!confirmAction && confirmAction.action === 'delete'} onOpenChange={open => !open && setConfirmAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete User</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to <b>delete</b> this user?</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div><b>Name:</b> {confirmAction?.user?.full_name || confirmAction?.user?.email || confirmAction?.user?.id}</div>
                  <div><b>Email:</b> {confirmAction?.user?.email}</div>
                  <div><b>Role:</b> {confirmAction?.user?.role}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleAction}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={!!confirmAction && confirmAction.action === 'ban'} onOpenChange={open => !open && setConfirmAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Ban User</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to <b>ban</b> this user?</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div><b>Name:</b> {confirmAction?.user?.full_name || confirmAction?.user?.email || confirmAction?.user?.id}</div>
                  <div><b>Email:</b> {confirmAction?.user?.email}</div>
                  <div><b>Role:</b> {confirmAction?.user?.role}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button variant="default" onClick={handleAction}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={!!confirmAction && confirmAction.action === 'demote'} onOpenChange={open => !open && setConfirmAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Demote User</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to <b>demote</b> this user?</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div><b>Name:</b> {confirmAction?.user?.full_name || confirmAction?.user?.email || confirmAction?.user?.id}</div>
                  <div><b>Email:</b> {confirmAction?.user?.email}</div>
                  <div><b>Role:</b> {confirmAction?.user?.role}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button variant="default" onClick={handleAction}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>Email & Notifications</CardTitle>
              <CardDescription>Configure email and notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">Title</th>
                      <th className="px-2 py-1">Body</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map(notif => (
                      <tr key={notif.id} className="border-b">
                        <td className="px-2 py-1">{notif.title}</td>
                        <td className="px-2 py-1">{notif.body}</td>
                        <td className="px-2 py-1">{notif.type}</td>
                        <td className="px-2 py-1">{notif.read ? <Badge variant="default">Read</Badge> : <Badge variant="secondary">Unread</Badge>}</td>
                        <td className="px-2 py-1 flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleMarkNotifRead(notif.id)} disabled={notif.read}>Mark Read</Button>
                          <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ notif, action: 'deleteNotif' })}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={handleSendTestNotif}>Send Test Notification</Button>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-muted-foreground">Total notifications: {notifications.length}</span>
            </CardFooter>
          </Card>
          {/* Confirmation Dialog for Notification Delete */}
          <Dialog open={!!confirmAction && confirmAction.action === 'deleteNotif'} onOpenChange={open => !open && setConfirmAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete Notification</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to <b>delete</b> this notification?</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div><b>Title:</b> {confirmAction?.notif?.title}</div>
                  <div><b>Body:</b> {confirmAction?.notif?.body}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteNotifConfirmed}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage security settings and policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Two-Factor Authentication</Label>
                <Switch checked={!!settings.twoFactorAuth} onCheckedChange={v => handleChange("twoFactorAuth", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Password Policy</Label>
                <Select value={settings.passwordPolicy || "strong"} onValueChange={v => handleChange("passwordPolicy", v)}>
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
              <div className="flex items-center justify-between">
                <Label>Session Timeout</Label>
                <Select value={settings.sessionTimeout || "30"} onValueChange={v => handleChange("sessionTimeout", v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Timeout (min)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Login Alerts</Label>
                <Switch checked={!!settings.loginAlerts} onCheckedChange={v => handleChange("loginAlerts", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>API Key Management</Label>
                <Button variant="outline" size="sm" onClick={() => setShowKeysDialog(true)}>Manage Keys</Button>
              </div>
              <div className="flex items-center justify-between">
                <Label>Audit Logs</Label>
                <Button variant="outline" size="sm" onClick={() => setShowLogsDialog(true)}>View Logs</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: "Settings Saved", description: "Security settings have been saved." })}>Save</Button>
            </CardFooter>
          </Card>
          {/* API Key Management Dialog */}
          <Dialog open={showKeysDialog} onOpenChange={setShowKeysDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>API Key Management</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <Button onClick={handleCreateKey} className="mb-2">Create New Key</Button>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">Key</th>
                      <th className="px-2 py-1">Created</th>
                      <th className="px-2 py-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(key => (
                      <tr key={key.id} className="border-b">
                        <td className="px-2 py-1 font-mono">{key.value}</td>
                        <td className="px-2 py-1">{key.created}</td>
                        <td className="px-2 py-1">
                          <Button size="sm" variant="destructive" onClick={() => handleRevokeKey(key.id)}>Revoke</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowKeysDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Audit Logs Dialog */}
          <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Audit Logs</DialogTitle>
              </DialogHeader>
              <div className="py-2 max-h-96 overflow-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">Action</th>
                      <th className="px-2 py-1">Target</th>
                      <th className="px-2 py-1">Admin</th>
                      <th className="px-2 py-1">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} className="border-b">
                        <td className="px-2 py-1">{log.action}</td>
                        <td className="px-2 py-1">{log.target}</td>
                        <td className="px-2 py-1">{log.admin}</td>
                        <td className="px-2 py-1">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLogsDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* Features Tab */}
        <TabsContent value="features">
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable major features for the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Marketplace</Label>
                <Switch checked={!!featureFlags['marketplace']} onCheckedChange={v => setFeatureFlag('marketplace', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Accommodation</Label>
                <Switch checked={!!featureFlags['accommodation']} onCheckedChange={v => setFeatureFlag('accommodation', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Messaging</Label>
                <Switch checked={!!featureFlags['messaging']} onCheckedChange={v => setFeatureFlag('messaging', v)} />
              </div>
              <div className="flex items-center justify-between mt-4">
                <Label>Feature Flags</Label>
                <Button variant="outline" size="sm" onClick={() => setShowFlagsDialog(true)}>Manage Flags</Button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Label>A/B Testing</Label>
                <Button variant="outline" size="sm" onClick={() => setShowExperimentsDialog(true)}>Manage Experiments</Button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Label>Maintenance Announcements</Label>
                <Button variant="outline" size="sm" onClick={() => setShowScheduleDialog(true)}>Schedule</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: "Settings Saved", description: "Feature settings have been saved." })}>Save</Button>
            </CardFooter>
          </Card>
          {/* Manage Flags Dialog */}
          <Dialog open={showFlagsDialog} onOpenChange={setShowFlagsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Feature Flags</DialogTitle>
              </DialogHeader>
              <div className="py-2 space-y-3">
                {Object.keys(featureFlags).length === 0 && <div className="text-muted-foreground text-sm">No feature flags found.</div>}
                {Object.entries(featureFlags).map(([flag, value]) => (
                  <div key={flag} className="flex items-center justify-between">
                    <span className="capitalize">{flag.replace(/([A-Z])/g, ' $1')}</span>
                    <Switch checked={!!value} onCheckedChange={v => setFeatureFlag(flag, v)} />
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4">
                  <Input placeholder="New flag name" ref={newFlagRef} />
                  <Button size="sm" onClick={async () => {
                    if (newFlagRef.current && newFlagRef.current.value) {
                      await setFeatureFlag(newFlagRef.current.value, true);
                      newFlagRef.current.value = '';
                    }
                  }}>Add Flag</Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFlagsDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Manage Experiments Dialog */}
          <Dialog open={showExperimentsDialog} onOpenChange={setShowExperimentsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage A/B Experiments</DialogTitle>
              </DialogHeader>
              <div className="py-2 space-y-3">
                {Object.keys(experiments).length === 0 && <div className="text-muted-foreground text-sm">No experiments found.</div>}
                {Object.entries(experiments).map(([exp, value]) => (
                  <div key={exp} className="flex items-center justify-between">
                    <span className="capitalize">{exp.replace(/([A-Z])/g, ' $1')}</span>
                    <Switch checked={!!value} onCheckedChange={v => setExperiment(exp, v)} />
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4">
                  <Input placeholder="New experiment name" ref={newExpRef} />
                  <Button size="sm" onClick={async () => {
                    if (newExpRef.current && newExpRef.current.value) {
                      await setExperiment(newExpRef.current.value, true);
                      newExpRef.current.value = '';
                    }
                  }}>Add Experiment</Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExperimentsDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Schedule Maintenance Dialog */}
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Maintenance Announcement</DialogTitle>
              </DialogHeader>
              <div className="py-2">Maintenance announcement scheduling UI coming soon.</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Branding & Appearance</CardTitle>
              <CardDescription>Customize your platform's look and feel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo Upload</Label>
                <Button variant="outline" size="sm">Upload Logo</Button>
              </div>
              <div>
                <Label>Theme</Label>
                <Select value={settings.theme || "auto"} onValueChange={v => handleChange("theme", v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: "Settings Saved", description: "Branding settings have been saved." })}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>Audit & Activity Logs</CardTitle>
              <CardDescription>Track all admin and user actions for security and compliance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Title</th>
                      <th className="px-2 py-1">Time</th>
                      <th className="px-2 py-1">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b">
                        <td className="px-2 py-1">{log.type || "-"}</td>
                        <td className="px-2 py-1">{log.title || log.id}</td>
                        <td className="px-2 py-1">{log.created_at && log.created_at.seconds ? new Date(log.created_at.seconds * 1000).toLocaleString() : "-"}</td>
                        <td className="px-2 py-1">{log.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirmAction({ action: 'exportLogs' })}>Export Logs</Button>
            </CardContent>
          </Card>
          {/* Confirmation Dialog for Logs Export */}
          <Dialog open={!!confirmAction && confirmAction.action === 'exportLogs'} onOpenChange={open => !open && setConfirmAction(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Export Logs</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to <b>export</b> all logs? This may contain sensitive data.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button variant="default" onClick={handleExportLogs}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        {/* System Tab (Enhanced) */}
        <TabsContent value="system">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>System & Maintenance</CardTitle>
              <CardDescription>Manage system status, maintenance mode, and backups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>App Version</Label>
                <span>{settings.appVersion || "1.0.0"}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Database Usage</Label>
                <span>{settings.dbUsage ? `${settings.dbUsage.storage} MB / ${settings.dbUsage.quota} MB` : "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>System Health</Label>
                <Badge variant={settings.systemHealth === "Online" ? "default" : "destructive"}>
                  {settings.systemHealth || "Online"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Last Sync</Label>
                <span>{settings.lastSync || "-"}</span>
              </div>
              <div>
                <Label>Error Logs</Label>
                <ul className="text-xs text-red-500">
                  {settings.errorLogs && settings.errorLogs.length > 0 ? settings.errorLogs.map((e: string, i: number) => <li key={i}>{e}</li>) : <li>No errors</li>}
                </ul>
              </div>
              <div className="flex items-center justify-between">
                <Label>Maintenance Mode</Label>
                <Switch checked={!!settings.maintenanceMode} onCheckedChange={v => handleChange("maintenanceMode", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>System Status</Label>
                <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>{settings.maintenanceMode ? "Maintenance" : "Online"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Backup Data</Label>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Backup Started", description: "System backup has started." })}>Backup Now</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: "Settings Saved", description: "System settings have been saved." })}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
}
