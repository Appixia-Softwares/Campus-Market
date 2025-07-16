"use client"

import type React from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState, useEffect } from "react"
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user } = useAuth();
  const [hasListings, setHasListings] = useState<boolean | null>(null)

  // Redirect mobile users to /marketplace as the first screen
  useEffect(() => {
    if (typeof window !== "undefined" && isMobile && window.location.pathname !== "/marketplace") {
      router.replace("/marketplace");
    }
  }, [isMobile, router]);

  // Check for user listings (products or accommodations)
  useEffect(() => {
    if (!user) {
      setHasListings(null)
      return
    }
    let cancelled = false
    async function checkListings() {
      // Check products
      const productsSnap = await getDocs(query(collection(db, "products"), where("seller_id", "==", user.id)))
      // Check accommodations
      const accomSnap = await getDocs(query(collection(db, "accommodations"), where("seller.id", "==", user.id)))
      if (!cancelled) {
        setHasListings(productsSnap.size > 0 || accomSnap.size > 0)
      }
    }
    checkListings()
    return () => { cancelled = true }
  }, [user])

  if (flagsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading feature flags...</div>;
  }
  if (!featureFlags.marketplace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold mb-2">Marketplace Disabled</h2>
        <p className="text-muted-foreground">The marketplace is currently unavailable. Please check back later.</p>
      </div>
    );
  }
  return (
    <SessionProvider>
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen w-screen overflow-hidden">
            {/* Desktop sidebar */}
            {user && hasListings !== false && (
              <div className={`hidden md:block transition-all duration-300 h-full w-64 flex-shrink-0 bg-background border-r`}>
                <DashboardSidebar />
              </div>
            )}
            {/* Mobile sidebar overlay */}
            {sidebarOpen && user && hasListings !== false && (
              <div className="fixed inset-0 z-50 flex md:hidden">
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                {/* Sidebar */}
                <div className="relative w-64 h-full bg-background border-r shadow-lg">
                  <DashboardSidebar />
                </div>
              </div>
            )}
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header - Static in layout flow */}
              <div className="flex-shrink-0 bg-background border-b">
                <DashboardHeader />
              </div>
              {/* Main content - Takes remaining space with top margin for fixed header */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background mt-16">
                {children}
              </main>
            </div>
          </div>
          {/* Bottom Navigation for mobile */}
          <BottomNavigation />
          {/* Toast notifications */}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  </SessionProvider>
  )
}
