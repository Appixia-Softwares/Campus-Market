"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertTriangle, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";

interface Report {
  id: string;
  type: string;
  status: string;
  targetId: string;
  targetType: string;
  reason: string;
  details?: string;
  createdAt?: any;
  reporterId?: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "reports"),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        setReports(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "reports", id), { status });
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">View and manage user/listing reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Pending</Button>
          <Button variant={filter === "resolved" ? "default" : "outline"} onClick={() => setFilter("resolved")}>Resolved</Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No reports found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(report => (
            <Card key={report.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === "pending" ? "destructive" : "secondary"}>{report.status}</Badge>
                  <CardTitle className="text-lg font-semibold">{report.type}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(report.id, "resolved")} aria-label="Resolve"><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(report.id, "escalated")} aria-label="Escalate"><AlertTriangle className="h-4 w-4 text-yellow-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(report.id, "dismissed")} aria-label="Dismiss"><XCircle className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{report.reason}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">Target: {report.targetType} ({report.targetId})</div>
                <div className="text-xs text-muted-foreground mt-1">Reported: {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : "-"}</div>
                {report.details && <div className="mt-2 text-sm">{report.details}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 