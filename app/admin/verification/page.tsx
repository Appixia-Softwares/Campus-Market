"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, XCircle, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";

interface Verification {
  id: string;
  userId: string;
  status: string;
  documentUrl?: string;
  createdAt?: any;
}

export default function AdminVerificationPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "verifications"),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Verification));
        setVerifications(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "verifications", id), { status });
  };

  const pending = verifications.filter(v => v.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verification Requests</h1>
          <p className="text-muted-foreground">Review and approve user verification requests</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No pending verifications.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pending.map(verify => (
            <Card key={verify.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pending</Badge>
                  <CardTitle className="text-lg font-semibold">User: {verify.userId}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(verify.id, "approved")} aria-label="Approve"><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleStatus(verify.id, "rejected")} aria-label="Reject"><XCircle className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Submitted: {verify.createdAt?.toDate ? verify.createdAt.toDate().toLocaleString() : "-"}</CardDescription>
                {verify.documentUrl && (
                  <a href={verify.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 text-primary underline"><FileText className="h-4 w-4" />View Document</a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 