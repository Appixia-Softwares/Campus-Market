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
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: Search },
  { href: "/marketplace/sell", label: "Sell", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

export default function BottomNavigation({ userId }) {
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
  return (
    <nav className="fixed bottom-0 w-full bg-white shadow z-50 flex justify-between items-center px-4 py-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={`flex flex-col items-center justify-center flex-1 h-full transition text-xs font-medium ${active ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <Icon className={`h-6 w-6 mb-1 ${active ? "stroke-2" : "stroke-1.5"}`} />
            <span>{label}</span>
          </Link>
        )
      })}
      <div className="relative">
        <button onClick={() => setShowPanel((v) => !v)} className="relative">
          <span className="icon-bell" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unreadCount}</span>
          )}
        </button>
        {showPanel && (
          <div className="absolute right-0 bottom-10 z-50">
            <NotificationsPanel userId={userId} />
          </div>
        )}
      </div>
      <PushNotificationPrompt userId={userId} />
    </nav>
  )
} 