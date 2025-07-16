import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function TopProducts() {
  const [data, setData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    // Listen to completed orders and aggregate by product
    const q = query(collection(db, "orders"), where("status", "==", "completed"));
    const unsub = onSnapshot(q, (orderSnap) => {
      const byProduct: Record<string, number> = {};
      orderSnap.docs.forEach(doc => {
        const o = doc.data();
        byProduct[o.product_id] = (byProduct[o.product_id] || 0) + 1;
      });
      // Get product names
      onSnapshot(collection(db, "products"), (prodSnap) => {
        const products: Record<string, string> = {};
        prodSnap.docs.forEach(doc => {
          const p = doc.data();
          products[doc.id] = p.title || doc.id;
        });
        const arr = Object.entries(byProduct)
          .map(([productId, value]) => ({ name: products[productId] || productId, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setData(arr);
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Top-Selling Products</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 