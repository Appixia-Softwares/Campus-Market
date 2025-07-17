"use client"

import type React from "react"
import { useState } from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import BottomNavigation from "@/components/BottomNavigation"
import { AuthProvider } from "@/lib/auth-context"
import QueryProvider from "@/providers/query-provider"
import { SessionProvider } from "@/providers/session-provider"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useEffect } from "react"
import { db } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth();
  const [hasListings, setHasListings] = useState<boolean | null>(null)
  const router = useRouter();
  const pathname = usePathname();

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

  // Redirect users with no listings to /marketplace
  useEffect(() => {
    if (user && hasListings === false) {
      if (pathname !== "/marketplace" && pathname !== "/marketplace/sell") {
        router.replace("/marketplace");
      }
    }
  }, [user, hasListings, pathname, router]);

  return (
    <ProtectedRoute>
       <SessionProvider>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex h-screen w-screen overflow-hidden">
              {/* Desktop sidebar */}
              <div className={`hidden md:block transition-all duration-300 h-full w-64 flex-shrink-0 bg-background border-r`}>
                {user && hasListings !== false && <DashboardSidebar />}
              </div>
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                  {/* Sidebar */}
                  <div className="relative w-64 h-full bg-background border-r shadow-lg">
                    {user && hasListings !== false && <DashboardSidebar />}
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
            <BottomNavigation userId={user?.id} hasListings={hasListings === null ? undefined : !!hasListings} />
            
            {/* Toast notifications */}
            <Toaster />
            <SonnerToaster />
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </SessionProvider>
    </ProtectedRoute>
  )
}
