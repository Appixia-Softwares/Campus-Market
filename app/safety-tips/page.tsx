'use client';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function SafetyTipsPage() {
  const [tips, setTips] = useState<{ id: string, title: string, content: string }[]>([]);

  useEffect(() => {
    const q = query(collection(db, "safetyTips"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, snap => {
      setTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Link href="/" className="inline-flex items-center gap-2 mb-4 text-primary hover:underline text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Safety Tips</CardTitle>
        </CardHeader>
        <CardContent>
          {tips.length === 0 ? (
            <p className="text-muted-foreground">No safety tips available yet.</p>
          ) : (
            tips.map(tip => (
              <div key={tip.id} className="mb-6">
                <h2 className="text-lg font-semibold mb-2">{tip.title}</h2>
                <p className="mb-4">{tip.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
} 