"use client"

import type React from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState } from "react"
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
            <div className="flex min-h-screen w-full overflow-hidden">
              {/* Sidebar for md+ */}
              <div className="hidden md:block transition-all duration-300 h-full w-64 flex-shrink-0">
                <DashboardSidebar />
              </div>
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto overflow-x-auto p-2 md:p-6 bg-background">
                  {children}
                </main>
              </div>
            </div>
            <BottomNavigation />
            <Toaster />
            <SonnerToaster />
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
