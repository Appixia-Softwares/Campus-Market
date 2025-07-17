'use client'
import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

// Logs a visit to Firestore when the user changes
export default function VisitorLogger() {
  const { user } = useAuth();
  useEffect(() => {
    async function logVisit() {
      try {
        await addDoc(collection(db, "visitors"), {
          userId: user?.id || null,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        // Optionally log error
      }
    }
    logVisit();
    // Only log once per mount
    // eslint-disable-next-line
  }, [user]);
  return null;
} 