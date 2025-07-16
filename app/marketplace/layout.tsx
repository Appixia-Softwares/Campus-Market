"use client"

import type React from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState } from "react"
import { useFeatureFlags } from "@/hooks/use-feature-flags";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
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
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Sidebar for md+ */}
      <div className="hidden md:block transition-all duration-300 h-full w-64 flex-shrink-0">
        <DashboardSidebar />
      </div>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-2 left-2 z-30">
        <button onClick={() => setSidebarOpen((open) => !open)} className="p-2 rounded bg-primary text-primary-foreground shadow">
          {sidebarOpen ? 'Close' : 'Menu'}
        </button>
      </div>
      {/* Sidebar drawer for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-background shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <DashboardSidebar />
          </div>
        </div>
      )}
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto overflow-x-auto p-2 md:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
