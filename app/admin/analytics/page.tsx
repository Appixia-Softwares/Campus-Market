"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsersRealtime } from "@/lib/api/users";
import { getAllOrdersRealtime } from "@/lib/api/orders";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { UserGrowthChart } from "@/components/analytics/UserGrowthChart";
import { ActiveInactiveUsers } from "@/components/analytics/ActiveInactiveUsers";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { TopSellers } from "@/components/analytics/TopSellers";
import { NewListingsChart } from "@/components/analytics/NewListingsChart";
import { TransactionSuccessRate } from "@/components/analytics/TransactionSuccessRate";
import { TopProducts } from "@/components/analytics/TopProducts";
import { FilterBar } from "@/components/analytics/FilterBar";

interface User {
  id: string;
  created_at?: { seconds: number } | string | number;
}
interface Order {
  id: string;
  amount?: number;
  created_at?: { seconds: number } | string | number;
}
interface Product {
  id: string;
  created_at?: { seconds: number } | string | number;
}

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time users
  useEffect(() => {
    const unsub = getAllUsersRealtime(setUsers);
    return () => unsub();
  }, []);

  // Real-time orders
  useEffect(() => {
    const unsub = getAllOrdersRealtime(setOrders);
    return () => unsub();
  }, []);

  // Real-time products
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (users && orders && products) setLoading(false);
  }, [users, orders, products]);

  // Calculate stats
  const totalRevenue = orders.reduce((sum, o) => sum + (typeof o.amount === "number" ? o.amount : 0), 0);
  const newUsers = users.filter((u) => {
    if (!u.created_at) return false;
    const date = typeof u.created_at === "object" && "seconds" in u.created_at
      ? new Date(u.created_at.seconds * 1000)
      : new Date(u.created_at as any);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;
  const newOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const date = typeof o.created_at === "object" && "seconds" in o.created_at
      ? new Date(o.created_at.seconds * 1000)
      : new Date(o.created_at as any);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;

  return (
    <div className="flex-1 w-full h-full p-6">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">System Analytics</h1>
      <p className="text-muted-foreground mb-6">Real-time analytics for users, products, orders, and revenue.</p>
      <FilterBar />
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground">+{newUsers} new this week</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{orders.length}</div>
              <div className="text-xs text-muted-foreground">+{newOrders} new this week</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <UserGrowthChart />
        <NewListingsChart />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        <ActiveInactiveUsers />
        <CategoryBreakdown />
        <TopSellers />
        <TransactionSuccessRate />
        <TopProducts />
      </div>
    </div>
  );
} 