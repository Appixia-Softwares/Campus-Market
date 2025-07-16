import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLORS = ["#22c55e", "#64748b"];

export function ActiveInactiveUsers() {
  const [data, setData] = useState([
    { name: "Active", value: 0 },
    { name: "Inactive", value: 0 },
  ]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const now = Date.now();
      let active = 0, inactive = 0;
      snap.docs.forEach(doc => {
        const u = doc.data();
        const last = u.last_login?.seconds
          ? u.last_login.seconds * 1000
          : u.last_login
            ? new Date(u.last_login).getTime()
            : null;
        if (last && now - last < 1000 * 60 * 60 * 24 * 30) {
          active++;
        } else {
          inactive++;
        }
      });
      setData([
        { name: "Active", value: active },
        { name: "Inactive", value: inactive },
      ]);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active vs Inactive Users</h2>
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