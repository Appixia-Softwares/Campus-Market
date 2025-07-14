"use client"
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAllUsers } from '@/lib/api/users';
import { getProducts } from '@/app/actions/products';
import { getAllReports } from '@/lib/api/reports';
import { getAllOrders } from '@/lib/api/orders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [usersData, productsData, reportsData, ordersData] = await Promise.all([
        getAllUsers(),
        getProducts(),
        getAllReports(),
        getAllOrders(),
      ]);
      setUsers(usersData);
      setProducts(productsData);
      setReports(reportsData);
      setOrders(ordersData);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Date range filter logic
  const filterByDate = (arr: any[], field: string) => {
    if (!dateRange) return arr;
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    return arr.filter(item => {
      const d = item[field] ? new Date(item[field]) : null;
      return d && d >= from && d <= to;
    });
  };

  // User growth by month
  const userGrowth = filterByDate(users, 'created_at').reduce((acc, user) => {
    const date = user.created_at ? new Date(user.created_at) : null;
    if (!date) return acc;
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const userGrowthData = Object.entries(userGrowth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // Sales over time (orders by month)
  const salesByMonth = filterByDate(orders, 'created_at').reduce((acc, order) => {
    const date = order.created_at ? new Date(order.created_at) : null;
    if (!date) return acc;
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + (order.amount || 0);
    return acc;
  }, {} as Record<string, number>);
  const salesData = Object.entries(salesByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  // Top products by sales
  const productSales: Record<string, { title: string; sales: number }> = {};
  filterByDate(orders, 'created_at').forEach(order => {
    if (order.product_id) {
      const product = products.find(p => p.id === order.product_id);
      const title = product?.title || order.product_id;
      productSales[title] = productSales[title] || { title, sales: 0 };
      productSales[title].sales += order.amount || 0;
    }
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // User activity (signups per day)
  const userActivity = filterByDate(users, 'created_at').reduce((acc, user) => {
    const date = user.created_at ? new Date(user.created_at) : null;
    if (!date) return acc;
    const key = date.toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const userActivityData = Object.entries(userActivity)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return (
    <div className="p-8">
      <AdminHeader />
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Overview of platform performance and recent activity.</p>
      {/* Date Range Filter and Export */}
      <div className="flex flex-wrap gap-4 mb-8 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm">From</span>
          <input type="date" value={dateRange?.from || ''} onChange={e => setDateRange(r => ({ from: e.target.value, to: r?.to || e.target.value }))} className="border rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm">To</span>
          <input type="date" value={dateRange?.to || ''} onChange={e => setDateRange(r => ({ to: e.target.value, from: r?.from || e.target.value }))} className="border rounded px-2 py-1" />
        </label>
        <Button onClick={() => setDateRange(null)} variant="outline" size="sm">Clear</Button>
        <Button onClick={() => exportToCSV(users, 'users.csv')} variant="default" size="sm">Export Users CSV</Button>
        <Button onClick={() => exportToCSV(orders, 'orders.csv')} variant="default" size="sm">Export Orders CSV</Button>
      </div>
      {/* Stat Cards */}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">User Growth</h2>
        </div>
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
      {/* Sales Over Time Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sales Over Time</h2>
        </div>
        <div className="w-full h-64">
          <Suspense fallback={<div>Loading chart…</div>}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
                        </div>
                      </div>
      {/* Top Products Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Products</h2>
        </div>
        <div className="w-full h-64">
          <Suspense fallback={<div>Loading chart…</div>}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sales" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
              </div>
            </div>
      {/* User Activity Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">User Activity</h2>
        </div>
        <div className="w-full h-64">
          <Suspense fallback={<div>Loading chart…</div>}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e42" />
              </BarChart>
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
