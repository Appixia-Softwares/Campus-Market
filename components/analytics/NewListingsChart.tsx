import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function NewListingsChart() {
  const [data, setData] = useState<{ date: string, count: number }[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const products = snap.docs.map(doc => doc.data());
      const byDay: Record<string, number> = {};
      products.forEach(p => {
        let d: Date | null = null;
        if (p.created_at?.seconds) {
          d = new Date(p.created_at.seconds * 1000);
        } else if (p.created_at) {
          const tryDate = new Date(p.created_at);
          d = isNaN(tryDate.getTime()) ? null : tryDate;
        }
        if (d && !isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          byDay[key] = (byDay[key] || 0) + 1;
        }
      });
      const arr = Object.entries(byDay).map(([date, count]) => ({ date, count }));
      arr.sort((a, b) => a.date.localeCompare(b.date));
      setData(arr);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">New Listings Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 