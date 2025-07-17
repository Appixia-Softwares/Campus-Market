'use client'
import React, { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

// ClientLayout: wraps all client-side providers and effects
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Visitor logging effect
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

  return (
    <SessionProvider>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            {/* Show bottom navigation only on mobile */}
            <Analytics/>
            <SpeedInsights/>
            <BottomNavigation />
            <Toaster />
            <SonnerToaster />
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </SessionProvider>
  );
} 