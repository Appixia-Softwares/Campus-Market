"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertTriangle, XCircle, Mail } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { logAdminAction } from '@/lib/firebase-service';
import { useAuth } from '@/lib/auth-context';

interface Feedback {
  id: string;
  userId: string;
  message: string;
  status: string;
  createdAt?: any;
  reply?: string;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "feedback"),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
        setFeedback(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "feedback", id), { status });
    await logAdminAction({
      adminId: currentAdmin?.id || currentAdmin?.email || 'unknown',
      action: 'update_status',
      resource: 'feedback',
      resourceId: id,
      details: { status }
    });
  };

  const filtered = filter === "all" ? feedback : feedback.filter(f => f.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback & Support</h1>
          <p className="text-muted-foreground">View and manage user feedback and support tickets</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "open" ? "default" : "outline"} onClick={() => setFilter("open")}>Open</Button>
          <Button variant={filter === "closed" ? "default" : "outline"} onClick={() => setFilter("closed")}>Closed</Button>
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No feedback or support tickets found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ticket => (
            <Card key={ticket.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={ticket.status === "open" ? "destructive" : "secondary"}>{ticket.status}</Badge>
                  <CardTitle className="text-lg font-semibold">User: {ticket.userId}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(ticket.id, "closed")} aria-label="Close"><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(ticket.id, "escalated")} aria-label="Escalate"><AlertTriangle className="h-4 w-4 text-yellow-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(ticket.id, "deleted")} aria-label="Delete"><XCircle className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{ticket.message}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">Submitted: {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : "-"}</div>
                {ticket.reply && <div className="mt-2 text-sm text-primary">Reply: {ticket.reply}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 