'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAllUsers, getAllUsersRealtime, updateUser, deleteUser } from '@/lib/api/users';
import { getProducts, getProductsRealtime, updateProduct, deleteProduct } from '@/lib/api/products';
import { getAllReports, getAllReportsRealtime } from '@/lib/api/reports';
import { getAllOrders, getAllOrdersRealtime } from '@/lib/api/orders';
import { Card } from '@/components/ui/card';
import { MigrateButton } from '@/components/admin/MigrateButton';
import { Button } from '@/components/ui/button';
import { Settings, Plus, AlertTriangle, Activity, Database, Mail, Info, Bell, User, ShoppingCart, Flag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { collection, onSnapshot } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

// Dynamically import the full chart wrapper component
const UserGrowthChart = dynamic(() => import('@/components/charts/UserGrowthChart'), {
  ssr: false,
});

// Add a type for user with created_at
export interface UserWithMeta {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string | number | { seconds: number };
  updated_at?: string | number | { seconds: number };
  status?: 'active' | 'banned';
}

function TopCategoriesCard() {
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const cat = doc.data().category || "Uncategorized";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      const arr = Object.entries(counts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5
      setCategoryData(arr);
    });
    return () => unsub();
  }, []);

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between p-6 pb-2 border-b">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Top Categories</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 cursor-pointer text-muted-foreground">?</span>
              </TooltipTrigger>
              <TooltipContent>
                <span>Shows the most popular product categories by number of listings.</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="p-6 pt-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryData}>
            <XAxis dataKey="category" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserWithMeta[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Add state for recent orders
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  // Add 'orders' to state if not already present
  const [orders, setOrders] = useState<any[]>([]);
  // System health state
  const [firestoreStatus, setFirestoreStatus] = useState<'online' | 'offline'>('online');
  const [lastSync, setLastSync] = useState<{ users: number|null, products: number|null, reports: number|null, orders: number|null }>({ users: null, products: null, reports: null, orders: null });
  const [listenerError, setListenerError] = useState<{ users?: string, products?: string, reports?: string, orders?: string }>({});
  const healthInterval = useRef<NodeJS.Timeout|null>(null);
  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Add state for confirmation dialogs
  const [confirmUser, setConfirmUser] = useState<{ id: string, action: 'ban' | 'unban' | 'delete' }|null>(null);
  const [confirmOrder, setConfirmOrder] = useState<{ id: string, action: 'complete' | 'delete' }|null>(null);
  // Add state for user and order filters/search
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [userSort, setUserSort] = useState<'name' | 'email' | 'date'>('date');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('desc');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [orderSort, setOrderSort] = useState<'date' | 'amount'>('date');
  const [orderSortDir, setOrderSortDir] = useState<'asc' | 'desc'>('desc');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  // Admin Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const announcementTitleRef = useRef<HTMLInputElement>(null);

  // --- User lookup map for quick access ---
  const userMap = users.reduce<Record<string, UserWithMeta>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  // --- Robust date formatter ---
  function formatOrderDate(dateValue: any): string {
    if (!dateValue) return '-';
    // Firestore Timestamp
    if (typeof dateValue === 'object' && dateValue?.seconds) {
      const d = new Date(dateValue.seconds * 1000);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
    }
    // String or number
    const d = new Date(dateValue);
    return !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
  }

  useEffect(() => {
    setLoading(true);
    // Firestore connection check
    function updateStatus() {
      // Firestore JS SDK doesn't expose direct connection status, so we ping a tiny query
      getAllUsers().then(() => setFirestoreStatus('online')).catch(() => setFirestoreStatus('offline'));
    }
    updateStatus();
    healthInterval.current = setInterval(updateStatus, 15000); // check every 15s
    // Real-time listeners
    const unsubUsers = getAllUsersRealtime((usersData) => {
      setUsers(usersData as UserWithMeta[]);
      setLastSync(l => ({ ...l, users: Date.now() }));
      setListenerError(e => ({ ...e, users: undefined }));
      setLoading(false);
    });
    const unsubProducts = getProductsRealtime((productsData) => {
      setProducts(productsData);
      setLastSync(l => ({ ...l, products: Date.now() }));
      setListenerError(e => ({ ...e, products: undefined }));
    });
    const unsubReports = getAllReportsRealtime((reportsData) => {
      setReports(reportsData);
      setLastSync(l => ({ ...l, reports: Date.now() }));
      setListenerError(e => ({ ...e, reports: undefined }));
    });
    return () => {
      unsubUsers();
      unsubProducts();
      unsubReports();
      if (healthInterval.current) clearInterval(healthInterval.current);
    };
  }, []);

  useEffect(() => {
    setOrdersLoading(true);
    const unsubOrders = getAllOrdersRealtime((orders) => {
      try {
        const sorted = orders
          .filter(o => {
            const createdAt = (o as any)?.created_at ?? (o as any)?.createdAt;
            let date: Date | null = null;
            if (typeof createdAt === 'string' || typeof createdAt === 'number') {
              date = new Date(createdAt);
            } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
              date = new Date(createdAt.seconds * 1000);
            }
            return date && !isNaN(date.getTime());
          })
          .sort((a, b) => {
            const getDate = (order: any) => {
              const createdAt = order.created_at;
              if (typeof createdAt === 'string' || typeof createdAt === 'number') {
                return new Date(createdAt).getTime();
              } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
                return new Date(createdAt.seconds * 1000).getTime();
              }
              return 0;
            };
            return getDate(b) - getDate(a);
          })
          .slice(0, 5);
        setRecentOrders(sorted);
        setLastSync(l => ({ ...l, orders: Date.now() }));
        setListenerError(e => ({ ...e, orders: undefined }));
      } catch (e) {
        setListenerError(err => ({ ...err, orders: String(e) }));
        setRecentOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    });
    return () => unsubOrders();
  }, []);

  useEffect(() => {
    // Listen to users, orders, reports for new events
    let unsubUsers: any, unsubOrders: any, unsubReports: any;
    try {
      unsubUsers = getAllUsersRealtime((usersData) => {
        if (!Array.isArray(usersData)) return;
        const latest = usersData
          .filter(u => u.created_at)
          .sort((a, b) => {
            const getTime = (u: UserWithMeta) =>
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
            link: `/admin/users`,
          }));
        setNotifications(n => {
          const filtered = n.filter(e => e.type !== 'user');
          return [...latest, ...filtered].sort((a, b) => b.time - a.time).slice(0, 10);
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
            link: `/admin/orders/${o.id}`,
          }));
        setNotifications(n => {
          const filtered = n.filter(e => e.type !== 'order');
          return [...latest, ...filtered].sort((a, b) => b.time - a.time).slice(0, 10);
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
            link: `/admin/reports`,
          }));
        setNotifications(n => {
          const filtered = n.filter(e => e.type !== 'report');
          return [...latest, ...filtered].sort((a, b) => b.time - a.time).slice(0, 10);
        });
      });
    } catch (err) {
      console.error('Notification listener error:', err);
    }
    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubOrders) unsubOrders();
      if (unsubReports) unsubReports();
    };
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const userGrowth = users.reduce((acc, user) => {
    let date: Date | null = null;
    if (typeof user.created_at === 'string' || typeof user.created_at === 'number') {
      date = new Date(user.created_at);
    } else if (user.created_at && typeof user.created_at === 'object' && 'seconds' in user.created_at) {
      date = new Date(user.created_at.seconds * 1000);
    }
    if (!date || isNaN(date.getTime())) return acc;
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userGrowthData = Object.entries(userGrowth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // Calculate new users this month for the User Growth card
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const newUsersThisMonth = userGrowthData.find(d => d.month === monthKey)?.count || 0;

  // Admin Announcement Handler
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            userId: null, // null for broadcast
            type: 'admin',
            title: announcementTitle,
            body: announcementBody,
            read: false,
            createdAt: new Date(),
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Announcement sent to all users!');
      setAnnouncementTitle('');
      setAnnouncementBody('');
      if (announcementTitleRef.current) announcementTitleRef.current.focus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send announcement');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  return (
    <div className="p-8">
      <AdminHeader />
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Overview of platform performance and recent activity.</p>

      {/* Quick Actions, Recent Activity, System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add User</Button>
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
            <Button variant="outline" className="gap-2"><AlertTriangle className="h-4 w-4" /> Review Reports</Button>
            <Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Settings</Button>
            <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" /> Send Announcement</Button>
          </div>
        </Card>
        {/* Recent Activity */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            <ul className="divide-y divide-muted">
              {notifications.length === 0 ? (
                <li className="py-2 text-muted-foreground text-sm">No recent activity.</li>
              ) : (
                notifications.slice(0, 10).map((n, i) => (
                  <li key={n.type + n.id + i} className="py-2 flex items-center gap-2 text-sm">
                    {n.type === 'user' && <User className="h-4 w-4 text-primary" />}
                    {n.type === 'order' && <ShoppingCart className="h-4 w-4 text-green-600" />}
                    {n.type === 'report' && <Flag className="h-4 w-4 text-red-500" />}
                    <Link href={(() => {
                      if (n.link && n.link.startsWith('/admin/')) return n.link;
                      if (n.type === 'user') return `/admin/users/${n.id}`;
                      if (n.type === 'order') return `/admin/orders/${n.id}`;
                      if (n.type === 'report') return `/admin/reports/${n.id}`;
                      return n.link || '#';
                    })()} className="font-medium hover:underline">
                      {n.type.charAt(0).toUpperCase() + n.type.slice(1)}: {n.label}
                    </Link>
                    <span className="ml-auto text-xs text-muted-foreground">{n.time ? new Date(n.time).toLocaleString() : ''}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Card>
        {/* System Health */}
        <Card className="mb-8">
          <div className="flex items-center justify-between p-6 pb-2 border-b">
            <div className="flex items-center gap-3">
              <Activity className={firestoreStatus === 'online' ? 'h-5 w-5 text-green-600' : 'h-5 w-5 text-red-600'} />
              <h2 className="text-lg font-semibold">System Health</h2>
            </div>
            <div className="text-xs text-muted-foreground">
              Firestore: <span className={firestoreStatus === 'online' ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{firestoreStatus}</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Sync Times:</div>
                <ul className="text-xs">
                  <li>Users: {lastSync.users ? new Date(lastSync.users).toLocaleTimeString() : '-'}</li>
                  <li>Products: {lastSync.products ? new Date(lastSync.products).toLocaleTimeString() : '-'}</li>
                  <li>Reports: {lastSync.reports ? new Date(lastSync.reports).toLocaleTimeString() : '-'}</li>
                  <li>Orders: {lastSync.orders ? new Date(lastSync.orders).toLocaleTimeString() : '-'}</li>
                </ul>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Listener Errors:</div>
                <ul className="text-xs text-red-600">
                  {Object.entries(listenerError).filter(([_, v]) => v).length === 0 ? (
                    <li>None</li>
                  ) : (
                    Object.entries(listenerError).map(([k, v]) => v && <li key={k}>{k}: {v}</li>)
                  )}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="mb-8">
        <div className="flex items-center justify-between p-6 pb-2 border-b">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">User Growth</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-muted-foreground">?</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Shows the number of new users registered each month.</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xs text-muted-foreground">
            New this month: <span className="font-bold text-primary">{String(newUsersThisMonth)}</span>
          </div>
        </div>
        <div className="w-full h-64 p-6 pt-4">
          <Suspense fallback={<div>Loading chart…</div>}>
            <UserGrowthChart
              data={userGrowthData.map(({ month, count }) => ({
                month,
                count: typeof count === "number" ? count : 0,
              }))}
            />
          </Suspense>
        </div>
      </Card>

      {/* Top Categories Chart */}
      <TopCategoriesCard />

      {/* Recent Orders Table */}
      <Card className="mb-8">
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <Input
            type="text"
            placeholder="Search orders (order ID, user, product)"
            value={orderSearch}
            onChange={e => setOrderSearch(e.target.value)}
            className="w-56"
          />
          <Select value={orderStatus} onValueChange={setOrderStatus}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <div className="flex gap-2 items-center">
            <span className="text-xs">Date from:</span>
            <Input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} className="w-32" />
            <span className="text-xs">to</span>
            <Input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} className="w-32" />
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-xs">Sort by:</span>
            <Select value={orderSort} onValueChange={v => setOrderSort(v as any)}>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => setOrderSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{orderSortDir === 'asc' ? '↑' : '↓'}</Button>
          </div>
        </div>
        <div className="flex items-center justify-between p-6 pb-2 border-b">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-muted-foreground">?</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Latest orders placed on the platform.</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="p-6 pt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="px-2 py-1 text-left cursor-pointer" onClick={() => { setOrderSort('date'); setOrderSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Date {orderSort === 'date' ? (orderSortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="px-2 py-1 text-left">Order ID</th>
                <th className="px-2 py-1 text-left">User</th>
                <th className="px-2 py-1 text-left">Product</th>
                <th className="px-2 py-1 text-left cursor-pointer" onClick={() => { setOrderSort('amount'); setOrderSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Amount {orderSort === 'amount' ? (orderSortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">Loading…</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">No recent orders found.</td></tr>
              ) : (
                recentOrders
                  .filter(order => {
                    if (!orderSearch) return true;
                    const q = orderSearch.toLowerCase();
                    return (
                      (order.id && String(order.id).toLowerCase().includes(q)) ||
                      (order.user_id && String(order.user_id).toLowerCase().includes(q)) ||
                      (order.product_id && String(order.product_id).toLowerCase().includes(q))
                    );
                  })
                  .filter(order => orderStatus === 'all' ? true : (order.status || 'pending') === orderStatus)
                  .filter(order => {
                    if (!orderDateFrom && !orderDateTo) return true;
                    const dateValue = order.created_at;
                    const date = typeof dateValue === 'object' && 'seconds' in dateValue
                      ? new Date(dateValue.seconds * 1000)
                      : new Date(dateValue);
                    if (orderDateFrom && date < new Date(orderDateFrom)) return false;
                    if (orderDateTo && date > new Date(orderDateTo + 'T23:59:59')) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    let cmp = 0;
                    if (orderSort === 'date') {
                      const getTime = (o: any) =>
                        typeof o.created_at === 'object' && o.created_at !== null && 'seconds' in o.created_at
                          ? o.created_at.seconds * 1000
                          : new Date(o.created_at as any).getTime();
                      cmp = getTime(b) - getTime(a);
                    } else if (orderSort === 'amount') {
                      const getAmount = (o: any) => typeof o.amount === 'number' ? o.amount : (typeof o.total_amount === 'number' ? o.total_amount : 0);
                      cmp = getAmount(b) - getAmount(a);
                    }
                    return orderSortDir === 'asc' ? -cmp : cmp;
                  })
                  .map(order => {
                    const user = userMap[order.user_id];
                    const userId = order.user_id || '-';
                    let userDisplay = userId;
                    if (user) {
                      if (user.full_name && user.email) userDisplay = `${user.full_name} (${user.email})`;
                      else if (user.full_name) userDisplay = user.full_name;
                      else if (user.email) userDisplay = user.email;
                      else userDisplay = userId;
                    }
                    const amount = typeof order.amount === 'number'
                      ? order.amount
                      : typeof order.total_amount === 'number'
                        ? order.total_amount
                        : 0;
                    const dateValue = order.created_at;
                    const date = typeof dateValue === 'object' && 'seconds' in dateValue
                      ? new Date(dateValue.seconds * 1000)
                      : new Date(dateValue);
                    return (
                      <tr key={order.id} className="border-b">
                        <td className="px-2 py-1">{!isNaN(date.getTime()) ? date.toLocaleDateString() : '-'}</td>
                        <td className="px-2 py-1 font-mono">#{order.id}</td>
                        <td className="px-2 py-1 truncate max-w-[180px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{userDisplay}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>User ID: {userId}</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="px-2 py-1 truncate max-w-[140px]">{order.product_id || '-'}</td>
                        <td className="px-2 py-1">₦{amount.toLocaleString()}</td>
                        <td className="px-2 py-1">
                          <span className={
                            order.status === 'completed' ? 'text-green-600 font-medium' :
                            order.status === 'pending' ? 'text-yellow-600 font-medium' :
                            order.status === 'cancelled' ? 'text-red-600 font-medium' :
                            'text-muted-foreground font-medium'
                          }>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <Link href={`/admin/orders/${order.id}`} passHref legacyBehavior>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                          {order.status !== 'completed' && (
                            <Button size="sm" variant="default" onClick={() => setConfirmOrder({ id: order.id, action: 'complete' })}>Mark as Completed</Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => setConfirmOrder({ id: order.id, action: 'delete' })}>Delete</Button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Performance Table */}
      <Card className="mb-8">
        <div className="flex items-center justify-between p-6 pb-2 border-b">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">User Performance</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-pointer text-muted-foreground">?</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>See the most active and top performing users on the platform.</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="p-6 pt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="px-2 py-1 text-left">User</th>
                <th className="px-2 py-1 text-left">Listings</th>
                <th className="px-2 py-1 text-left">Orders</th>
                <th className="px-2 py-1 text-left">Last Active</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">No users found.</td></tr>
              ) : (
                [...users]
                  .sort((a, b) => {
                    // Sort by most recent activity
                    const getTime = (u: any) => {
                      if (u.updated_at) {
                        if (typeof u.updated_at === 'object' && 'seconds' in u.updated_at) return u.updated_at.seconds * 1000;
                        return new Date(u.updated_at).getTime();
                      }
                      if (u.created_at) {
                        if (typeof u.created_at === 'object' && 'seconds' in u.created_at) return u.created_at.seconds * 1000;
                        return new Date(u.created_at).getTime();
                      }
                      return 0;
                    };
                    return getTime(b) - getTime(a);
                  })
                  .slice(0, 10)
                  .map(user => {
                    const listingsCount = products.filter(p => p.seller_id === user.id).length;
                    const ordersCount = orders.filter(o => o.buyer_id === user.id || o.seller_id === user.id).length;
                    let lastActive = '-';
                    if (user.updated_at) {
                      if (typeof user.updated_at === 'object' && 'seconds' in user.updated_at) {
                        const d = new Date(user.updated_at.seconds * 1000);
                        lastActive = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '-';
                      } else {
                        const d = new Date(user.updated_at);
                        lastActive = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '-';
                      }
                    } else if (user.created_at) {
                      if (typeof user.created_at === 'object' && 'seconds' in user.created_at) {
                        const d = new Date(user.created_at.seconds * 1000);
                        lastActive = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '-';
                      } else {
                        const d = new Date(user.created_at);
                        lastActive = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '-';
                      }
                    }
                    return (
                      <tr key={user.id} className="border-b">
                        <td className="px-2 py-1 flex items-center gap-2">
                          <img src={user.avatar_url || '/placeholder-user.jpg'} className="h-7 w-7 rounded-full border" alt={user.full_name || user.email || user.id} />
                          {user.full_name || user.email || user.id}
                        </td>
                        <td className="px-2 py-1">{listingsCount}</td>
                        <td className="px-2 py-1">{ordersCount}</td>
                        <td className="px-2 py-1">{lastActive}</td>
                        <td className="px-2 py-1">
                          <Link href={`/admin/users/${user.id}`}><Button size="sm" variant="outline">View</Button></Link>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <Input
            type="text"
            placeholder="Search users (name, email, id)"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-56"
          />
          <Select value={userStatus} onValueChange={setUserStatus}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </Select>
          <div className="flex gap-1 items-center">
            <span className="text-xs">Sort by:</span>
            <Select value={userSort} onValueChange={v => setUserSort(v as any)}>
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => setUserSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{userSortDir === 'asc' ? '↑' : '↓'}</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {loading ? (
            <div>Loading…</div>
          ) : users.length === 0 ? (
            <div className="text-muted-foreground">No users found.</div>
          ) : (
            [...users]
              .filter(u => u.created_at)
              .filter(u => {
                if (!userSearch) return true;
                const q = userSearch.toLowerCase();
                return (
                  (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                  (u.email && u.email.toLowerCase().includes(q)) ||
                  (u.id && u.id.toLowerCase().includes(q))
                );
              })
              .filter(u => userStatus === 'all' ? true : (u.status || 'active') === userStatus)
              .sort((a, b) => {
                let cmp = 0;
                if (userSort === 'date') {
                  const getTime = (u: UserWithMeta) =>
                    typeof u.created_at === 'object' && u.created_at !== null && 'seconds' in u.created_at
                      ? u.created_at.seconds * 1000
                      : new Date(u.created_at as any).getTime();
                  cmp = getTime(b) - getTime(a);
                } else if (userSort === 'name') {
                  cmp = (a.full_name || '').localeCompare(b.full_name || '');
                } else if (userSort === 'email') {
                  cmp = (a.email || '').localeCompare(b.email || '');
                }
                return userSortDir === 'asc' ? -cmp : cmp;
              })
              .slice(0, 5)
              .map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 shadow-sm min-w-[220px]"
                >
                  <img
                    src={user.avatar_url || '/placeholder-user.jpg'}
                    alt={user.full_name || user.email || user.id}
                    className="h-10 w-10 rounded-full border object-cover"
                  />
                  <div>
                    <div className="font-medium">{user.full_name || "No Name"}</div>
                    <div className="text-xs text-muted-foreground">{user.email || user.id}</div>
                    <div className="text-xs text-muted-foreground">
                      Joined:{" "}
                      {user.created_at
                        ? typeof user.created_at === "object" && "seconds" in user.created_at
                          ? new Date(user.created_at.seconds * 1000).toLocaleDateString()
                          : new Date(user.created_at as any).toLocaleDateString()
                        : "-"}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Link href={`/admin/users/${user.id}`}><Button size="sm" variant="outline">View</Button></Link>
                      {user.status === 'banned' ? (
                        <Button size="sm" variant="default" onClick={() => setConfirmUser({ id: user.id, action: 'unban' })}>Unban</Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => setConfirmUser({ id: user.id, action: 'ban' })}>Ban</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setConfirmUser({ id: user.id, action: 'delete' })}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      {/* User confirmation dialog */}
      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <div className="mb-4 text-lg font-semibold">
              {confirmUser.action === 'ban' && 'Ban this user?'}
              {confirmUser.action === 'unban' && 'Unban this user?'}
              {confirmUser.action === 'delete' && 'Delete this user?'}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmUser(null)}>Cancel</Button>
              <Button variant={confirmUser.action === 'delete' ? 'destructive' : 'default'}
                onClick={async () => {
                  try {
                    if (confirmUser.action === 'ban') {
                      await updateUser(confirmUser.id, { status: 'banned' });
                      toast.success('User banned');
                    } else if (confirmUser.action === 'unban') {
                      await updateUser(confirmUser.id, { status: 'active' });
                      toast.success('User unbanned');
                    } else if (confirmUser.action === 'delete') {
                      await deleteUser(confirmUser.id);
                      toast.success('User deleted');
                    }
                  } catch (e) {
                    toast.error('Action failed: ' + (e as any)?.message);
                  } finally {
                    setConfirmUser(null);
                  }
                }}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Notification Bell */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white rounded-full text-xs">{unreadCount}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[320px]">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-auto">
            {notifications.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">No notifications</div>
            ) : (
              notifications.map((n, i) => (
                <DropdownMenuItem key={n.type + n.id + i} className="cursor-pointer py-3">
                  <Link href={n.link} className="flex flex-col gap-1 w-full">
                    <span className="font-medium capitalize">{n.type}: {n.label}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.time).toLocaleString()}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Order confirmation dialog */}
      {confirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <div className="mb-4 text-lg font-semibold">
              {confirmOrder.action === 'complete' && 'Mark this order as completed?'}
              {confirmOrder.action === 'delete' && 'Delete this order?'}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmOrder(null)}>Cancel</Button>
              <Button variant={confirmOrder.action === 'delete' ? 'destructive' : 'default'}
                onClick={async () => {
                  try {
                    if (confirmOrder.action === 'complete') {
                      await updateDoc(doc(db, 'orders', confirmOrder.id), { status: 'completed' });
                      toast.success('Order marked as completed');
                    } else if (confirmOrder.action === 'delete') {
                      await deleteDoc(doc(db, 'orders', confirmOrder.id));
                      toast.success('Order deleted');
                    }
                  } catch (e) {
                    toast.error('Action failed: ' + (e as any)?.message);
                  } finally {
                    setConfirmOrder(null);
                  }
                }}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Admin Announcement Form */}
      <Card className="mb-8">
        <form onSubmit={handleSendAnnouncement} className="p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Send Admin Announcement
          </h2>
          <input
            ref={announcementTitleRef}
            className="border rounded px-3 py-2"
            placeholder="Announcement Title"
            value={announcementTitle}
            onChange={e => setAnnouncementTitle(e.target.value)}
            required
          />
          <textarea
            className="border rounded px-3 py-2 min-h-[80px]"
            placeholder="Announcement Body"
            value={announcementBody}
            onChange={e => setAnnouncementBody(e.target.value)}
            required
          />
          <Button type="submit" disabled={announcementLoading || !announcementTitle || !announcementBody}>
            {announcementLoading ? 'Sending...' : 'Send Announcement'}
          </Button>
        </form>
      </Card>
    </div>
  );
} 