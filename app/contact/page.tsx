'use client';
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "contactMessages"), {
        name,
        email,
        message,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      alert("Failed to send message. Please try again.");
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
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Have a question, suggestion, or need help? Fill out the form below or email us at <a href="mailto:support@campusmarket.co.zw" className="text-primary underline">support@campusmarket.co.zw</a>.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
            <input
              className="border rounded px-3 py-2"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={submitting}
            />
            <input
              type="email"
              className="border rounded px-3 py-2"
              placeholder="Your Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
            <textarea
              className="border rounded px-3 py-2 min-h-[80px]"
              placeholder="Your Message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              disabled={submitting}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-white font-semibold"
              disabled={submitting || !name.trim() || !email.trim() || !message.trim()}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
            {success && <span className="text-green-600 text-sm mt-1">Thank you for contacting us! We'll get back to you soon.</span>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 