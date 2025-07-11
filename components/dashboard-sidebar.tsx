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

export default function DashboardSidebar({ collapsed, onToggle, isMobile }: DashboardSidebarProps) {
  const pathname = usePathname() || ""
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const actuallyCollapsed = isMobile ? false : collapsed

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      
      try {
        const profileDoc = await getDoc(doc(db, "users", user.id))
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user])

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("")
  }

  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name
    }
    if (user?.full_name) {
      return user.full_name
    }
    if (user?.email) {
      return user.email.split("@")[0]
    }
    return "User"
  }

  const getUserInitials = () => {
    const displayName = getDisplayName()
    return getInitials(displayName)
  }

  const getVerificationStatus = () => {
    if (!profile) return { verified: false, count: 0, total: 3, details: [] }

    const details = []
    let verifiedCount = 0

    // Email verification
    if (user?.email) {
      verifiedCount++
      details.push({ type: "Email", verified: true })
    } else {
      details.push({ type: "Email", verified: false })
    }

    // Phone verification
    if (profile.phone_verified) {
      verifiedCount++
      details.push({ type: "Phone", verified: true })
    } else {
      details.push({ type: "Phone", verified: false })
    }

    // Student ID verification
    if (profile.verified) {
      verifiedCount++
      details.push({ type: "Student ID", verified: true })
    } else {
      details.push({ type: "Student ID", verified: false })
    }

    return {
      verified: verifiedCount === 3,
      count: verifiedCount,
      total: 3,
      details,
    }
  }

  const verificationStatus = getVerificationStatus()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className={`flex items-center gap-2 px-4 py-2 ${actuallyCollapsed ? "justify-center px-2 py-2" : ""}`}>
            <Building className="h-6 w-6 text-primary animate-bounce-slow" />
            {!actuallyCollapsed && <span className="font-bold text-xl">CampusMarket</span>}
            <button
              onClick={onToggle}
              className={`ml-auto p-1 rounded hover:bg-muted transition ${actuallyCollapsed ? "" : ""}`}
              aria-label={actuallyCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-5 h-5 transition-transform ${actuallyCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
              </svg>
            </button>
          </div>

          {!actuallyCollapsed && (
            <div className="px-4 py-3 bg-muted/30 rounded-lg mx-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url || user?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {profile?.university && (
                    <div className="flex items-center gap-1 mt-1">
                      <GraduationCap className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.university.abbreviation || profile.university.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {profile?.status && (
                    <Badge variant={profile.status === "active" ? "default" : "secondary"} className="text-xs">
                      {profile.status}
                    </Badge>
                  )}
                  {profile?.role && profile.role !== "student" && (
                    <Badge variant="outline" className="text-xs">
                      {profile.role}
                    </Badge>
                  )}
                  {verificationStatus.verified && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {verificationStatus.verified ? (
                    <span className="text-green-600 font-medium">✓ Fully Verified</span>
                  ) : (
                    <span>
                      {verificationStatus.count}/{verificationStatus.total} verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard">
                <Link href="/dashboard" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Home className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Dashboard</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/analytics"} tooltip="Analytics">
                <Link href="/analytics" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <BarChart3 className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Analytics</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Separator className="my-2" />
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/marketplace" || pathname.startsWith("/marketplace/")} tooltip="Browse Marketplace">
                <Link href="/marketplace" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Search className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Browse Products</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/marketplace/sell" || pathname.startsWith("/marketplace/sell")} tooltip="Sell Product">
                <Link href="/marketplace/sell" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Plus className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Sell Product</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/marketplace/my-listings"} tooltip="My Listings">
                <Link href="/marketplace/my-listings" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <ShoppingBag className="h-4 w-4" />
                  {!actuallyCollapsed && <span>My Listings</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/marketplace/favorites"} tooltip="Favorites">
                <Link href="/marketplace/favorites" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Heart className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Favorites</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Separator className="my-2" />
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/accommodation"} tooltip="Accommodation">
                <Link href="/accommodation" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Building className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Accommodation</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Separator className="my-2" />
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/community"} tooltip="Community">
                <Link href="/community" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Users className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Community</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/messages"} tooltip="Messages">
                <Link href="/messages" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <MessageSquare className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Messages</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/verification"} tooltip="Verification">
                <Link href="/verification" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Shield className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Verification</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile">
                <Link href="/profile" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <User className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Profile</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                <Link href="/settings" className="transition-all hover:text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Settings className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Settings</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Logout" onClick={handleSignOut}>
                <button className="transition-all hover:text-destructive w-full flex items-center gap-2 justify-center md:justify-start">
                  <LogOut className="h-4 w-4" />
                  {!actuallyCollapsed && <span>Logout</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
