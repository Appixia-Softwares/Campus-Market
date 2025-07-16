"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { useFeatureFlags } from "@/hooks/use-feature-flags";

export default function AccommodationLayout({ children }: { children: ReactNode }) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
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
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden">
     
      {/* Desktop sidebar */}
      <div className={`hidden md:block transition-all duration-300 h-full ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 ${collapsed ? '' : 'bg-background border-r'}`}>
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
        {/* Optionally add a header here if needed */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
} 