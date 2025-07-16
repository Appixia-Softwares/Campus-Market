import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function UserGrowthChart() {
  const [data, setData] = useState<{ date: string, count: number }[]>([]);

  useEffect(() => {
    // Listen to users and aggregate by day
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map(doc => doc.data());
      const byDay: Record<string, number> = {};
      users.forEach(u => {
        const d = u.created_at?.seconds
          ? new Date(u.created_at.seconds * 1000)
          : new Date(u.created_at);
        const key = d.toISOString().slice(0, 10);
        byDay[key] = (byDay[key] || 0) + 1;
      });
      const arr = Object.entries(byDay).map(([date, count]) => ({ date, count }));
      arr.sort((a, b) => a.date.localeCompare(b.date));
      setData(arr);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">User Growth</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 