'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Plus, MessageSquare, User } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: Search },
  { href: "/marketplace/sell", label: "Sell", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

export default function BottomNavigation() {
  const pathname = usePathname() || ""
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-border flex justify-around items-center h-16 md:hidden shadow-lg">
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
    </nav>
  )
} 