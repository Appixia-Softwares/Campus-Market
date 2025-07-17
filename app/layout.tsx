"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"
import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Visitor logging effect
  useEffect(() => {
    async function logVisit() {
      try {
        await addDoc(collection(db, "visitors"), {
          userId: null, // Assuming no user is logged in for visitor logging
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        // Optionally log error
      }
    }
    logVisit();
    // Only log once per mount
    // eslint-disable-next-line
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <AuthProvider>
          <QueryProvider>

            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              {/* Show bottom navigation only on mobile */}
              <BottomNavigation />
              <Toaster />
              <SonnerToaster />
            </ThemeProvider>
            </QueryProvider>

          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
