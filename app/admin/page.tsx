'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAllUsers } from '@/lib/api/users';
import { getProducts } from '@/app/actions/products';
import { getAllReports } from '@/lib/api/reports';
import { Card } from '@/components/ui/card';
import { MigrateButton } from '@/components/admin/MigrateButton';
import { Button } from '@/components/ui/button';
import { Settings, Plus, AlertTriangle, Activity, Database, Mail, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Dynamically import the full chart wrapper component
const UserGrowthChart = dynamic(() => import('@/components/charts/UserGrowthChart'), {
  ssr: false,
});

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [usersData, productsData, reportsData] = await Promise.all([
        getAllUsers(),
        getProducts(),
        getAllReports(),
      ]);
      setUsers(usersData);
      setProducts(productsData);
      setReports(reportsData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const userGrowth = users.reduce((acc, user) => {
    const date = user.created_at ? new Date(user.created_at) : null;
    if (!date) return acc;
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

  return (
    <div className="p-8">
      <AdminHeader />
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Overview of platform performance and recent activity.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
          <span className="text-3xl font-bold text-primary">{loading ? '...' : users.length}</span>
          <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Users</span>
        </Card>
        <Card className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
          <span className="text-3xl font-bold text-primary">{loading ? '...' : products.length}</span>
          <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Products</span>
        </Card>
        <Card className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
          <span className="text-3xl font-bold text-primary">{loading ? '...' : reports.length}</span>
          <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Reports</span>
        </Card>
        <Card className="bg-primary/10 rounded-lg p-6 flex flex-col items-center shadow">
          <span className="text-3xl font-bold text-primary">
            ₦{loading ? '...' : products.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Total Value</span>
        </Card>
      </div>

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
              <li className="py-2 flex items-center gap-2 text-sm"><Plus className="h-4 w-4 text-primary" /> New user <span className="font-medium">jane.doe@example.com</span> signed up <span className="ml-auto text-xs text-muted-foreground">2 min ago</span></li>
              <li className="py-2 flex items-center gap-2 text-sm"><Plus className="h-4 w-4 text-primary" /> Product <span className="font-medium">MacBook Pro 2022</span> listed <span className="ml-auto text-xs text-muted-foreground">10 min ago</span></li>
              <li className="py-2 flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Report submitted <span className="font-medium">Spam listing</span> <span className="ml-auto text-xs text-muted-foreground">1 hr ago</span></li>
              <li className="py-2 flex items-center gap-2 text-sm"><Settings className="h-4 w-4 text-muted-foreground" /> Admin updated settings <span className="ml-auto text-xs text-muted-foreground">2 hrs ago</span></li>
            </ul>
          </div>
        </Card>
        {/* System Health */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">System Health</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Online</span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">Last backup: 2 hours ago</div>
            <div className="text-xs text-muted-foreground mb-2">No critical errors</div>
            <div className="text-xs text-muted-foreground">Error log: <span className="text-red-500">None</span></div>
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
          {/* Placeholder bar chart using SVG */}
          <div className="w-full max-w-xl mx-auto">
            <svg width="100%" height="120" viewBox="0 0 400 120">
              {/* Example bars */}
              <rect x="20" y="40" width="60" height="60" fill="#6366f1" rx="6" />
              <rect x="100" y="20" width="60" height="80" fill="#10b981" rx="6" />
              <rect x="180" y="60" width="60" height="40" fill="#f59e42" rx="6" />
              <rect x="260" y="30" width="60" height="70" fill="#ef4444" rx="6" />
              {/* Labels */}
              <text x="50" y="115" textAnchor="middle" fontSize="12">Electronics</text>
              <text x="130" y="115" textAnchor="middle" fontSize="12">Books</text>
              <text x="210" y="115" textAnchor="middle" fontSize="12">Fashion</text>
              <text x="290" y="115" textAnchor="middle" fontSize="12">Home</text>
            </svg>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Electronics</span>
              <span>Books</span>
              <span>Fashion</span>
              <span>Home</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Orders Table */}
      <Card className="mb-8">
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
                <th className="px-2 py-1 text-left">Order ID</th>
                <th className="px-2 py-1 text-left">User</th>
                <th className="px-2 py-1 text-left">Product</th>
                <th className="px-2 py-1 text-left">Amount</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder rows */}
              <tr className="border-b">
                <td className="px-2 py-1 font-mono">#1234</td>
                <td className="px-2 py-1">Jane Doe</td>
                <td className="px-2 py-1">MacBook Pro</td>
                <td className="px-2 py-1">₦1,200,000</td>
                <td className="px-2 py-1"><span className="text-green-600 font-medium">Completed</span></td>
                <td className="px-2 py-1">2024-07-01</td>
                <td className="px-2 py-1"><Button size="sm" variant="outline">View</Button></td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1 font-mono">#1235</td>
                <td className="px-2 py-1">John Smith</td>
                <td className="px-2 py-1">Textbook</td>
                <td className="px-2 py-1">₦8,000</td>
                <td className="px-2 py-1"><span className="text-yellow-600 font-medium">Pending</span></td>
                <td className="px-2 py-1">2024-07-02</td>
                <td className="px-2 py-1"><Button size="sm" variant="outline">View</Button></td>
              </tr>
              <tr>
                <td className="px-2 py-1 font-mono">#1236</td>
                <td className="px-2 py-1">Mary Lee</td>
                <td className="px-2 py-1">Dress</td>
                <td className="px-2 py-1">₦15,000</td>
                <td className="px-2 py-1"><span className="text-red-600 font-medium">Cancelled</span></td>
                <td className="px-2 py-1">2024-07-03</td>
                <td className="px-2 py-1"><Button size="sm" variant="outline">View</Button></td>
              </tr>
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
              {/* Placeholder rows */}
              <tr className="border-b">
                <td className="px-2 py-1 flex items-center gap-2"><img src="/placeholder-user.jpg" className="h-7 w-7 rounded-full border" alt="Jane Doe" /> Jane Doe</td>
                <td className="px-2 py-1">12</td>
                <td className="px-2 py-1">5</td>
                <td className="px-2 py-1">2024-07-03</td>
                <td className="px-2 py-1"><Button size="sm" variant="outline">View Profile</Button></td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1 flex items-center gap-2"><img src="/placeholder-user.jpg" className="h-7 w-7 rounded-full border" alt="John Smith" /> John Smith</td>
                <td className="px-2 py-1">8</td>
                <td className="px-2 py-1">10</td>
                <td className="px-2 py-1">2024-07-02</td>
                <td className="px-2 py-1"><Button size="sm" variant="outline">View Profile</Button></td>
              </tr>
              <tr>
                <td className="px-2 py-1 flex items-center gap-2"><img src="/placeholder-user.jpg" className="h-7 w-7 rounded-full border" alt="Mary Lee" /> Mary Lee</td>
                <td className="px-2 py-1">15</td>
                <td className="px-2 py-1">2</td>
                <td className="px-2 py-1">2024-07-01</td>
                <td className="px-2 py-1"><Button size="sm" variant="outline">View Profile</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
        <div className="flex flex-wrap gap-4">
          {loading ? (
            <div>Loading…</div>
          ) : (
            users.slice(-5).reverse().map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 shadow-sm"
              >
                <img
                  src={user.avatar_url || '/placeholder-user.jpg'}
                  alt={user.full_name}
                  className="h-10 w-10 rounded-full border object-cover"
                />
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-xs text-muted-foreground">{user.email || user.id}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 