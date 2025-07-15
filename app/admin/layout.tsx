"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  BookOpen,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Home,
  Settings,
  LogOut,
  Bell,
  Search,
  UserIcon,
  Loader2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/admin-sidebar";
import { getAllUsersRealtime } from '@/lib/api/users';
import { getAllOrdersRealtime } from '@/lib/api/orders';
import { getAllReportsRealtime } from '@/lib/api/reports';

// Add Notification type
interface Notification {
  id: string;
  type?: string;
  entityId?: string;
  title?: string;
  body?: string;
  createdAt?: { seconds: number } | Date | string | number;
  read?: boolean;
  forUserId?: string;
  link?: string;
  label?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState(authUser);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.replace("/login?redirectTo=" + encodeURIComponent(pathname));
      } else if (user.role !== "admin") {
        router.replace("/");
      }
    }
  }, [user, loading, mounted, router, pathname]);

  useEffect(() => {
    if (authUser?.id) {
      // Listen to real-time updates for the admin user profile
      const unsub = onSnapshot(doc(db, 'users', authUser.id), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUser({
            id: snap.id,
            email: data.email || authUser.email || '',
            full_name: data.full_name || authUser.full_name,
            avatar_url: data.avatar_url || authUser.avatar_url,
            role: data.role || authUser.role,
            ...data
          });
        } else {
          setUser(authUser);
        }
      });
      return () => unsub();
    }
  }, [authUser]);

  useEffect(() => {
    if (!user?.id) return;
    // Listen to notifications for this admin or all
    const q = query(
      collection(db, 'notifications'),
      where('forUserId', 'in', [user.id, 'all'])
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(docu => ({ ...(docu.data() as Notification), id: docu.id }));
      notifs.sort((a, b) => {
        const aTime = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt ? a.createdAt.seconds : 0;
        const bTime = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt ? b.createdAt.seconds : 0;
        return bTime - aTime;
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => n.read === false).length);
    });
    return () => unsub();
  }, [user?.id]);

  // Mark all as read
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
  };

  useEffect(() => {
    // Listen to users, orders, reports for new events
    let unsubUsers: any, unsubOrders: any, unsubReports: any;
    unsubUsers = getAllUsersRealtime((usersData) => {
      if (!Array.isArray(usersData)) return;
      const latest = usersData
        .filter(u => u.created_at)
        .sort((a, b) => {
          const getTime = (u: any) =>
            typeof u.created_at === 'object' && u.created_at !== null && 'seconds' in u.created_at
              ? u.created_at.seconds * 1000
              : new Date(u.created_at as any).getTime();
          return getTime(b) - getTime(a);
        })
        .slice(0, 1)
        .map(u => ({
          type: 'user',
          id: u.id,
          time: typeof u.created_at === 'object' && u.created_at !== null && 'seconds' in u.created_at
            ? u.created_at.seconds * 1000
            : new Date(u.created_at as any).getTime(),
          label: u.full_name || u.email || u.id,
        }));
      setNotifications((n) => {
        // Filter out previous 'user' notifications
        const filtered = n.filter(
          (e) => e.type !== 'user'
        );
        // Map all notifications to a common shape with a 'time' property for sorting
        const normalize = (item: any) => {
          if ('time' in item && typeof item.time === 'number') {
            return item;
          }
          // For Notification type, try to extract createdAt.seconds or fallback to 0
          let time = 0;
          if ('createdAt' in item && item.createdAt && typeof item.createdAt === 'object' && 'seconds' in item.createdAt) {
            time = item.createdAt.seconds * 1000;
          }
          return { ...item, time };
        };
        const all = [...latest, ...filtered].map(normalize);
        return all.sort((a, b) => b.time - a.time).slice(0, 10);
      });
    });
    unsubOrders = getAllOrdersRealtime((ordersData) => {
      if (!Array.isArray(ordersData)) return;
      const latest = ordersData
        .filter(o => o.created_at)
        .sort((a, b) => {
          const getTime = (o: any) =>
            typeof o.created_at === 'object' && o.created_at !== null && 'seconds' in o.created_at
              ? o.created_at.seconds * 1000
              : new Date(o.created_at as any).getTime();
          return getTime(b) - getTime(a);
        })
        .slice(0, 1)
        .map(o => ({
          type: 'order',
          id: o.id,
          time: typeof o.created_at === 'object' && o.created_at !== null && 'seconds' in o.created_at
            ? o.created_at.seconds * 1000
            : new Date(o.created_at as any).getTime(),
          label: o.product_id || o.id,
        }));
      setNotifications(n => {
        const filtered = n.filter(e => e.type !== 'order');
        const getTime = (x: any) =>
          typeof x.time === 'number' ? x.time
          : x.createdAt && typeof x.createdAt === 'object' && 'seconds' in x.createdAt
            ? x.createdAt.seconds * 1000
            : 0;
        return [...latest, ...filtered].sort((a, b) => getTime(b) - getTime(a)).slice(0, 10);
      });
    });
    unsubReports = getAllReportsRealtime((reportsData) => {
      if (!Array.isArray(reportsData)) return;
      const latest = reportsData
        .filter(r => r.created_at)
        .sort((a, b) => {
          const getTime = (r: any) =>
            typeof r.created_at === 'object' && r.created_at !== null && 'seconds' in r.created_at
              ? r.created_at.seconds * 1000
              : new Date(r.created_at as any).getTime();
          return getTime(b) - getTime(a);
        })
        .slice(0, 1)
        .map(r => ({
          type: 'report',
          id: r.id,
          time: typeof r.created_at === 'object' && r.created_at !== null && 'seconds' in r.created_at
            ? r.created_at.seconds * 1000
            : new Date(r.created_at as any).getTime(),
          label: r.title || r.id,
        }));
      setNotifications(n => {
        const filtered = n.filter(e => e.type !== 'report');
        const getTime = (x: any) =>
          typeof x.time === 'number' ? x.time
          : x.createdAt && typeof x.createdAt === 'object' && 'seconds' in x.createdAt
            ? x.createdAt.seconds * 1000
            : 0;
        return [...latest, ...filtered].sort((a, b) => getTime(b) - getTime(a)).slice(0, 10);
      });
    });
    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubOrders) unsubOrders();
      if (unsubReports) unsubReports();
    };
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  if (!mounted || loading || !user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-2 py-3">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-xl font-bold">Campus Admin</span>
            </div>
          </SidebarHeader>
          <AdminSidebar pathname={pathname} />
          <SidebarFooter className="border-t">
            <div className="p-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => router.push("/login")}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="w-full flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[240px] lg:w-[440px]"
                />
              </div>
              <div className="flex items-center gap-4">
                <Suspense fallback={<div>Loading...</div>}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center">
                            {unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[320px]">
                      <DropdownMenuLabel className="flex justify-between items-center">
                        Notifications
                        <Button size="sm" variant="ghost" onClick={markAllAsRead} disabled={unreadCount === 0}>Mark all as read</Button>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="max-h-[300px] overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-2">No notifications</div>
                        ) : (
                          notifications.map((n, i) => (
                            <DropdownMenuItem key={n.id} className={`cursor-pointer py-3 ${n.read === false ? 'bg-primary/10' : ''}`}
                              onClick={async () => {
                                if (n.read === false) await updateDoc(doc(db, 'notifications', n.id), { read: true });
                                if (n.link) window.location.href = n.link;
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={n.type === 'user' ? '/placeholder-user.jpg' : n.type === 'order' ? '/placeholder.svg' : '/flag.svg'} />
                                  <AvatarFallback>{n.type?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                  <p className="text-sm font-medium">{n.title || n.type}</p>
                                  <p className="text-xs text-muted-foreground">{n.body || n.label || n.entityId}</p>
                                  <p className="text-xs text-muted-foreground">{n.createdAt && typeof n.createdAt === 'object' && 'seconds' in n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : ''}</p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Suspense>

                <Suspense fallback={<div>Loading...</div>}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative h-8 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback>{user?.full_name ? user.full_name[0] : "A"}</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium">{user?.full_name || user?.email || "Admin"}</p>
                          <p className="text-xs text-muted-foreground">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Administrator"}</p>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/login")}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Suspense>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
