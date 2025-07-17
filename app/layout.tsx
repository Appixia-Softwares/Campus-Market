import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./ClientLayout"

// Font setup
const inter = Inter({ subsets: ["latin"] })

// Export metadata for the app
export const metadata: Metadata = {
  title: "Campus Market - Student Marketplace",
  description: "Buy and sell items within your campus community",
  keywords: ["campus", "marketplace", "students", "buy", "sell", "university"],
  authors: [{ name: "Campus Market Team" }],
  creator: "Campus Market",
  publisher: "Campus Market",
  formatDetection: {
    email: false, // must be boolean
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.campusmarket.co.zw/"),
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

// Root layout (server component)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* All client-side providers and effects are in ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
