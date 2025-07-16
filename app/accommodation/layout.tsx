"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { DashboardHeader } from "@/components/dashboard-header"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"

export default function AccommodationLayout({ children }: { children: ReactNode }) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
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
            <div className="flex h-screen w-screen overflow-hidden">
              {/* Desktop sidebar */}
              <div className={`hidden md:block transition-all duration-300 h-full w-64 flex-shrink-0 bg-background border-r`}>
                <DashboardSidebar />
              </div>
              
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
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