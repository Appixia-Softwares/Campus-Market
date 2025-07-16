import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLORS = ["#22c55e", "#ef4444"];

export function TransactionSuccessRate() {
  const [data, setData] = useState([
    { name: "Completed", value: 0 },
    { name: "Cancelled", value: 0 },
  ]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      let completed = 0, cancelled = 0;
      snap.docs.forEach(doc => {
        const o = doc.data();
        if (o.status === "completed") completed++;
        else if (o.status === "cancelled") cancelled++;
      });
      setData([
        { name: "Completed", value: completed },
        { name: "Cancelled", value: cancelled },
      ]);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Transaction Success Rate</h2>
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