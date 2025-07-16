import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function TopSellers() {
  const [data, setData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    // Listen to completed orders and aggregate by seller
    const q = query(collection(db, "orders"), where("status", "==", "completed"));
    const unsub = onSnapshot(q, (orderSnap) => {
      const bySeller: Record<string, number> = {};
      orderSnap.docs.forEach(doc => {
        const o = doc.data();
        bySeller[o.seller_id] = (bySeller[o.seller_id] || 0) + 1;
      });
      // Get seller names
      onSnapshot(collection(db, "users"), (userSnap) => {
        const users: Record<string, string> = {};
        userSnap.docs.forEach(doc => {
          const u = doc.data();
          users[doc.id] = u.full_name || u.email || doc.id;
        });
        const arr = Object.entries(bySeller)
          .map(([sellerId, value]) => ({ name: users[sellerId] || sellerId, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setData(arr);
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Top Sellers</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#22c55e" barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 