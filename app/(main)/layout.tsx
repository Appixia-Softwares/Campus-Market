import type React from "react"
import { SiteHeader } from "@/components/site-header"
import { PageTransition } from "@/components/ui/page-transition"
import BottomNavigation from "@/components/BottomNavigation"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Show bottom navigation only on mobile */}
      <BottomNavigation />
    </>
  )
}
