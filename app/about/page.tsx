'use client';
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AboutPage() {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        message: feedback,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setFeedback("");
    } catch (err) {
      alert("Failed to send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Link href="/" className="inline-flex items-center gap-2 mb-4 text-primary hover:underline text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>About Campus Market</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-lg">
            <b>Campus Market</b> is a world-class, student-focused marketplace designed to empower university communities. Our mission is to make buying, selling, and connecting on campus safe, easy, and accessible for everyone.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Our Vision</h2>
          <p>
            To be the leading digital marketplace for students, fostering trust, convenience, and opportunity across campuses.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">What We Offer</h2>
          <ul className="list-disc ml-6 mb-4">
            <li>Safe and secure transactions for students and staff</li>
            <li>Real-time listings for products, accommodation, and services</li>
            <li>Community-driven features and support</li>
            <li>Modern, mobile-friendly experience</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6 mb-2">Our Story</h2>
          <p>
            Founded by students, for students, Campus Market was born out of the need for a trusted platform where campus communities can thrive. We are committed to continuous innovation and excellence.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-2">Our Team</h2>
          <ul className="list-disc ml-6 mb-4">
            <li>Praise Masunga – Chief Executive Officer</li>
            <li>Agripa Karuru – Chief Technology Officer</li>
            <li>John A Daka – Chief Operations Officer</li>
            <li>Lorraine Tsinya – Chief Marketing Officer</li>
            <li>Tafadzwa  – Chief Admin & Legal Officer</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
          <p>
            Have questions or feedback? Reach out at <a href="mailto:support@campusmarket.co.zw" className="text-primary underline">support@campusmarket.co.zw</a>
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">Send Us Feedback</h2>
          <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-2 mt-2">
            <textarea
              className="border rounded px-3 py-2 min-h-[80px]"
              placeholder="Your feedback helps us improve..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
              disabled={submitting}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-white font-semibold"
              disabled={submitting || !feedback.trim()}
            >
              {submitting ? "Sending..." : "Send Feedback"}
            </button>
            {success && <span className="text-green-600 text-sm mt-1">Thank you for your feedback!</span>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 