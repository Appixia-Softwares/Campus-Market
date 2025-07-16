"use client"

import type React from "react"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useFeatureFlags } from "@/hooks/use-feature-flags";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { featureFlags, loading: flagsLoading } = useFeatureFlags();
  if (flagsLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading feature flags...</div>;
  }
  if (!featureFlags.messaging) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold mb-2">Messaging Disabled</h2>
        <p className="text-muted-foreground">The messaging feature is currently unavailable. Please check back later.</p>
      </div>
    );
  }
  return <>{children}</>;
}
