'use client';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<{ id: string, question: string, answer: string }[]>([]);

  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, snap => {
      setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
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
          <CardTitle>Frequently Asked Questions (FAQs)</CardTitle>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <p className="text-muted-foreground">No FAQs available yet.</p>
          ) : (
            faqs.map(faq => (
              <div key={faq.id} className="mb-6">
                <h2 className="text-lg font-semibold mb-2">{faq.question}</h2>
                <p className="mb-4">{faq.answer}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
} 