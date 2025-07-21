'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Plus, MessageSquare, User } from "lucide-react"
import NotificationsPanel from './NotificationsPanel';
import PushNotificationPrompt from './PushNotificationPrompt';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const navItems = [
  { href: "/marketplace", label: "Marketplace", icon: Search },
  { href: "/accommodation", label: "Accommodation", icon: Home },
  { href: "/marketplace/sell", label: "Sell", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

const minimalNavItems = [
  { href: "/marketplace", label: "Marketplace", icon: Search },
  { href: "/marketplace/sell", label: "Sell", icon: Plus },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/logout", label: "Logout", icon: User }, // We'll handle logout click
];

// Accept hasListings as a prop (optional, fallback to always show Sell)
export default function BottomNavigation({ userId, hasListings }: { userId?: string, hasListings?: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return () => unsub();
  }, [userId]);

  const pathname = usePathname() || ""

  // Hide on landing, login, signup, forgot-password, reset-password, and verification pages
  const hideOnRoutes = [
    "/", // landing
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verification"
  ];
  // Also hide on any /auth/* route (for future-proofing)
  if (
    hideOnRoutes.includes(pathname) ||
    hideOnRoutes.some(route => pathname.startsWith(route + "/")) ||
    pathname.startsWith("/auth/")
  ) {
    return null;
  }
  const highlightSell = hasListings === false;

  // Minimal nav for users with no listings
  if (hasListings === false) {
    return (
      <nav className="fixed bottom-0 w-full bg-background/80 backdrop-blur-lg text-foreground shadow-lg border-t border-border z-50 flex justify-between items-center px-2 py-1 md:hidden safe-area-inset-bottom">
        {minimalNavItems.map(({ href, label, icon: Icon }, idx) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          if (label === "Sell") {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`relative z-10 -mt-6 flex flex-col items-center justify-center`}
              >
                <span className={`flex items-center justify-center rounded-full bg-primary shadow-lg transition-transform duration-200 h-14 w-14 border-4 border-background ${active ? 'scale-110' : 'scale-100'} ring-4 ring-green-400 animate-pulse`}> 
                  <Icon className="h-8 w-8 text-white" />
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5 shadow font-bold">New</span>
                </span>
                <span className={`mt-1 text-xs font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              </Link>
            )
          }
          if (label === "Logout") {
            return (
              <button
                key={label}
                aria-label="Logout"
                onClick={() => {
                  // Remove user session and redirect to login
                  window.location.href = "/login";
                }}
                className="flex flex-col items-center justify-center flex-1 h-full transition text-xs font-medium group text-muted-foreground hover:text-destructive"
              >
                <User className="h-7 w-7 mb-0.5" />
                <span className="transition-all duration-200">Logout</span>
              </button>
            )
          }
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex flex-col items-center justify-center flex-1 h-full transition text-xs font-medium group ${active ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Icon className={`h-7 w-7 mb-0.5 transition-all duration-200 group-hover:scale-110 ${active ? "scale-110 text-primary" : "scale-100"}`} />
              <span className={`transition-all duration-200 ${active ? "font-bold text-primary" : ""}`}>{label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    // Enhanced nav: frosted glass, shadow, border, and safe-area
    <nav className="fixed bottom-0 w-full bg-background/80 backdrop-blur-lg text-foreground shadow-lg border-t border-border z-50 flex justify-between items-center px-2 py-1 md:hidden safe-area-inset-bottom">
      {navItems.map(({ href, label, icon: Icon }, idx) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        // Floating Action Button for 'Sell'
        if (label === "Sell") {
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`relative z-10 -mt-6 flex flex-col items-center justify-center`}
            >
              <span className={`flex items-center justify-center rounded-full bg-primary shadow-lg transition-transform duration-200 h-14 w-14 border-4 border-background ${active ? 'scale-110' : 'scale-100'} ${highlightSell ? 'ring-4 ring-green-400 animate-pulse' : ''}`}> 
                <Icon className="h-8 w-8 text-white" />
                {/* Badge for first-time sellers */}
                {highlightSell && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5 shadow font-bold">New</span>
                )}
              </span>
              <span className={`mt-1 text-xs font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </Link>
          )
        }
        // Standard nav item
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex flex-col items-center justify-center flex-1 h-full transition text-xs font-medium group ${active ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <Icon className={`h-7 w-7 mb-0.5 transition-all duration-200 group-hover:scale-110 ${active ? "scale-110 text-primary" : "scale-100"}`} />
            <span className={`transition-all duration-200 ${active ? "font-bold text-primary" : ""}`}>{label}</span>
          </Link>
        )
      })}
      {/* Notification Bell - visually consistent and accessible */}
      <div className="relative flex flex-col items-center justify-center ml-2">
        <button onClick={() => setShowPanel((v) => !v)} className="relative focus:outline-none group">
          <span className="icon-bell h-7 w-7 block group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 shadow">{unreadCount}</span>
          )}
        </button>
        {showPanel && userId && (
          <div className="absolute right-0 bottom-10 z-50">
            <NotificationsPanel userId={userId} />
          </div>
        )}
      </div>
      {/* Push notification prompt */}
      {userId && <PushNotificationPrompt userId={userId} />}
    </nav>
  )
} 