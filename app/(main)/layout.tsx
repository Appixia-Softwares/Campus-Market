import type React from "react"
import { SiteHeader } from "@/components/site-header"
import { PageTransition } from "@/components/ui/page-transition"
import BottomNavigation from "@/components/BottomNavigation"
import AnnouncementBanner from '@/components/AnnouncementBanner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // TODO: Replace with actual user ID from auth context or session
  const userId = "CURRENT_USER_ID";
  return (
    <>
      <AnnouncementBanner userId={userId} />
      {children}
      {/* Show bottom navigation only on mobile */}
      {/* <BottomNavigation userId={userId} /> */}
    </>
  )
}
