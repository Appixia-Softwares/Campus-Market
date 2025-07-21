import { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLORS = ["#22c55e", "#f59e42", "#3b82f6", "#a855f7", "#ef4444", "#64748b"];

export function CategoryBreakdown() {
  const [data, setData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    let productsUnsub: (() => void) | null = null;
    const unsub = onSnapshot(collection(db, "product_categories"), (catSnap) => {
      const categories: { id: string; name?: string }[] = catSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { name?: string }) }));
      if (productsUnsub) productsUnsub();
      productsUnsub = onSnapshot(collection(db, "products"), (prodSnap) => {
        const byCat: Record<string, number> = {};
        prodSnap.docs.forEach(doc => {
          const p = doc.data();
          byCat[p.category_id] = (byCat[p.category_id] || 0) + 1;
        });
        const arr = categories.map(cat => ({
          name: cat.name || cat.id,
          value: byCat[cat.id] || 0,
        })).filter(c => c.value > 0);
        setData(arr);
      });
    });
    return () => {
      unsub();
      if (productsUnsub) productsUnsub();
    };
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Listings by Category</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 