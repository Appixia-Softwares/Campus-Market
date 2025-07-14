import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SessionProvider } from '@/providers/session-provider'
import QueryProvider from "@/providers/query-provider"
import BottomNavigation from "@/components/BottomNavigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Campus Market - Student Marketplace",
  description: "Buy and sell items within your campus community",
  keywords: ["campus", "marketplace", "students", "buy", "sell", "university"],
  authors: [{ name: "Campus Market Team" }],
  creator: "Campus Market",
  publisher: "Campus Market",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Campus Market - Student Marketplace",
    description: "Buy and sell items within your campus community",
    url: "/",
    siteName: "Campus Market",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Market - Student Marketplace",
    description: "Buy and sell items within your campus community",
    creator: "@campusmarket",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <AuthProvider>
          <QueryProvider>

            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              {/* Show bottom navigation only on mobile */}
              <BottomNavigation />
              <Toaster />
              <SonnerToaster />
            </ThemeProvider>
            </QueryProvider>

          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
