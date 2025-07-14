"use client"
import {
  Building,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  ShoppingBag,
  User,
  Users,
  GraduationCap,
  Home,
  Plus,
  Heart,
  BarChart3,
  Shield,
  Info,
  ArrowRight,
  Bed,
  MessageCircle,
  BarChart2,
  List,
  Star,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { User as UserType } from "@/lib/auth-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import AccommodationFormDialogContent from "./AccommodationFormDialogContent"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
}

interface UserProfile {
  full_name?: string
  avatar_url?: string
  university?: {
    name: string
    abbreviation: string
  }
  status?: string
  role?: string
  verified?: boolean
  phone_verified?: boolean
}

interface UserMetadata {
  full_name?: string
  avatar_url?: string
}

type AuthUser = UserType & {
  user_metadata: UserMetadata
}

function SidebarNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/marketplace", label: "Products", icon: ShoppingBag },
    { href: "/accommodation", label: "Accommodation", icon: Bed },
    { href: "/orders", label: "Orders", icon: List },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ]
  return (
    <aside className="w-full max-w-[260px] min-h-screen bg-white dark:bg-gray-950 border-r shadow-lg flex flex-col gap-4 p-4 rounded-r-2xl">
      {/* User avatar and dropdown */}
      <div className="flex items-center gap-3 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <Avatar src={user?.avatar_url || "/placeholder-user.jpg"} alt={user?.full_name || "User"} className="w-12 h-12 border shadow" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href="/profile"><User className="mr-2 w-4 h-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings"><Settings className="mr-2 w-4 h-4" />Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}><LogOut className="mr-2 w-4 h-4" />Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div>
          <div className="font-semibold text-lg">{user?.full_name || "User"}</div>
          <div className="text-xs text-muted-foreground">{user?.email || ""}</div>
                </div>
              </div>
      {/* Navigation links */}
      <nav className="flex flex-col gap-2">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-base ${pathname.startsWith(link.href) ? 'bg-primary/10 text-primary shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            tabIndex={0}
          >
            <link.icon className="w-5 h-5" />
            {link.label}
                </Link>
        ))}
      </nav>
      <div className="flex-1" />
      {/* Optional: Add stats, version, or help link here */}
    </aside>
  )
}
export default SidebarNav
