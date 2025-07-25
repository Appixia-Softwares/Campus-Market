'use client';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const [sections, setSections] = useState<{ id: string, title: string, content: string }[]>([]);
  const router = useRouter();
  // TODO: Replace with real admin check
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  useEffect(() => {
    const q = query(collection(db, "privacyPolicySections"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, snap => {
      setSections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
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
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-muted-foreground">No privacy policy sections available yet.</p>
          ) : (
            sections.map(section => (
              <div key={section.id} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  {isAdmin && (
                    <button
                      className="text-xs text-primary underline ml-2"
                      onClick={() => router.push(`/admin/privacy-policy?edit=${section.id}`)}
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="mb-4">{section.content}</p>
              </div>
            ))
          )}
          <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
          <p>
            If you have questions or concerns about your privacy, please contact us at:<br />
            <b>Email:</b> <a href="mailto:support@campusmarket.co.zw" className="text-primary underline">support@campusmarket.co.zw</a><br />
            <b>Help Center:</b> <a href="/help-center" className="text-primary underline">https://www.campusmarket.co.zw/help-center</a><br />
            <b>Feedback:</b> <a href="/contact#feedback" className="text-primary underline">Give Feedback</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 