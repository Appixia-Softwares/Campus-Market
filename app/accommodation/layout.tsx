"use client"

import type { ReactNode } from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { DashboardHeader } from "@/components/dashboard-header"
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"

export default function AccommodationLayout({ children }: { children: ReactNode }) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth();
  const [hasListings, setHasListings] = useState<boolean | null>(null)

  // Check for user listings (products or accommodations)
  useEffect(() => {
    if (!user) {
      setHasListings(null)
      return
    }
    let cancelled = false
    async function checkListings() {
      // Check products
      if (!user) return;
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
  
  if (!featureFlags.accommodation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold mb-2">Accommodation Disabled</h2>
        <p className="text-muted-foreground">The accommodation feature is currently unavailable. Please check back later.</p>
      </div>
    );
  }

  return (
    <SessionProvider>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex flex-col min-h-screen w-screen overflow-hidden">
              <div className="flex flex-1 h-full flex-col md:flex-row">
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
                {/* Main Content Area - Responsive padding and spacing */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Header - Sticky for mobile */}
                  <div className="flex-shrink-0 bg-background border-b sticky top-0 z-30">
                    <DashboardHeader />
                  </div>
                  {/* Main content - Responsive padding for mobile */}
                  <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-background mt-2 md:mt-4 pb-24 md:pb-0"> {/* pb-24 ensures content is not hidden behind bottom nav on mobile */}
                    {children}
                  </main>
                </div>
              </div>
              <Footer />
            </div>
            {/* Bottom Navigation for mobile */}
            <BottomNavigation userId={user?.id} hasListings={hasListings === null ? undefined : hasListings} />
            {/* Toast notifications */}
            <Toaster />
            <SonnerToaster />
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </SessionProvider>
  )
}