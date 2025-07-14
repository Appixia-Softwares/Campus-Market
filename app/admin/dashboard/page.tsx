import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAllUsers } from '@/lib/api/users';
import { getProducts } from '@/app/actions/products';
import { getAllReports } from '@/lib/api/reports';
import { Card } from '@/components/ui/card';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });

export default function AdminDashboardPage() {
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

  // Example: User growth by month (mocked from user created_at)
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
          <span className="text-3xl font-bold text-primary">₦{loading ? '...' : products.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}</span>
          <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Total Value</span>
        </Card>
      </div>
      {/* User Growth Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">User Growth</h2>
        <div className="w-full h-64">
          <Suspense fallback={<div>Loading chart…</div>}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      </div>
      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
        <div className="flex flex-wrap gap-4">
          {loading ? (
            <div>Loading…</div>
          ) : users.slice(-5).reverse().map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 shadow-sm">
              <img src={user.avatar_url || '/placeholder-user.jpg'} alt={user.full_name} className="h-10 w-10 rounded-full border object-cover" />
              <div>
                <div className="font-medium">{user.full_name}</div>
                <div className="text-xs text-muted-foreground">{user.email || user.id}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
