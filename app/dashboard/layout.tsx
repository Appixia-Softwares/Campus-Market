"use client"

import type React from "react"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import BottomNavigation from "@/components/BottomNavigation"
import { AuthProvider } from "@/lib/auth-context"
import QueryProvider from "@/providers/query-provider"
import { SessionProvider } from "@/providers/session-provider"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  )
}
