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
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardSidebarProps {
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

export default function DashboardSidebar({ isMobile }: DashboardSidebarProps) {
  const pathname = usePathname() || ""
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter();
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [showAccommodationForm, setShowAccommodationForm] = useState(false);

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
    if (user?.email) { verifiedCount++; details.push({ type: "Email", verified: true }) } else { details.push({ type: "Email", verified: false }) }
    if (profile.phone_verified) { verifiedCount++; details.push({ type: "Phone", verified: true }) } else { details.push({ type: "Phone", verified: false }) }
    if (profile.verified) { verifiedCount++; details.push({ type: "Student ID", verified: true }) } else { details.push({ type: "Student ID", verified: false }) }
    return { verified: verifiedCount === 3, count: verifiedCount, total: 3, details }
  }
  const verificationStatus = getVerificationStatus()
  const handleSignOut = async () => { try { await signOut() } catch (error) { console.error('Error signing out:', error) } }

  // Sidebar is always expanded
  const sidebarWidth = 'w-64';
  const sidebarBorder = 'border-r border-border';

  return (
    <SidebarProvider>
      <TooltipProvider>
        {/* Responsive wrapper: sidebar hidden on mobile, visible on md+ */}
        <div className="hidden md:flex">
          <div className={`fixed md:sticky top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-gray-950 shadow-xl flex flex-col ${sidebarWidth} overflow-hidden ${sidebarBorder}`}
            aria-expanded={true}
            aria-label="Sidebar navigation"
          >
            <Sidebar className="h-full flex flex-col justify-between">
              <SidebarHeader>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-6 w-6 text-primary animate-bounce-slow" />
                    <span className="font-bold text-xl tracking-tight">CampusMarket</span>
                  </div>
                </div>
                <div className="px-4 py-4 bg-muted/30 rounded-lg mx-2 mt-2 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary shadow">
                        <AvatarImage src={profile?.avatar_url || user?.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-2xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate">{getDisplayName()}</p>
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
                          <Badge variant="default" className="text-xs bg-green-600 animate-pulse">
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
              </SidebarHeader>
              <SidebarContent id="sidebar-content" className="flex-1 overflow-y-auto pb-4">
                <SidebarMenu>
                  {/* DASHBOARD GROUP */}
                  <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Dashboard</div>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                      <Link href="/dashboard" className="transition-all hover:text-primary flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <Separator className="my-2" />
                  {/* MARKETPLACE GROUP */}
                  <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Marketplace</div>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setShowAccommodationForm(true)}>
                      <Building className="h-5 w-5" />
                      <span>Add Accommodation</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/analytics"}>
                      <Link href="/analytics" className="transition-all hover:text-primary flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/orders"}>
                      <Link href="/orders" className="transition-all hover:text-primary flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Orders</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/marketplace" || pathname.startsWith("/marketplace/")}>
                      <Link href="/marketplace" className="transition-all hover:text-primary flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span>Browse Products</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Dialog open={sellDialogOpen} onOpenChange={(open) => { setSellDialogOpen(open); if (!open) setShowAccommodationForm(false); }}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton
                          isActive={pathname === "/marketplace/sell" || pathname.startsWith("/marketplace/sell")}
                          tooltip="Sell Product"
                          onClick={() => setSellDialogOpen(true)}
                        >
                          <div className="transition-all hover:text-primary flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>Sell Product</span>
                          </div>
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            What do you want to sell?
                          </DialogTitle>
                          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            Choose a category to get started. You can list products or accommodation for students.
                          </p>
                        </DialogHeader>
                        {!showAccommodationForm ? (
                          <div className="mt-6">
                            <div className="grid grid-cols-1 gap-4">
                              {/* Product Option Row */}
                              <button
                                className="group w-full rounded-lg border border-primary/30 bg-background hover:bg-primary/5 transition flex items-center px-4 py-3 shadow-sm hover:shadow-md focus:outline-none"
                                onClick={() => {
                                  setSellDialogOpen(false);
                                  router.push("/marketplace/sell");
                                }}
                              >
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mr-4">
                                  <ShoppingBag className="h-7 w-7 text-primary" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-semibold text-base">Product</div>
                                  <div className="text-xs text-muted-foreground">Sell books, electronics, clothing, and more</div>
                                </div>
                                <ArrowRight className="h-5 w-5 ml-4 text-muted-foreground group-hover:text-primary" />
                              </button>
                              {/* Accommodation Option Row */}
                              <button
                                className="group w-full rounded-lg border border-accent bg-background hover:bg-accent/10 transition flex items-center px-4 py-3 shadow-sm hover:shadow-md focus:outline-none"
                                onClick={() => setShowAccommodationForm(true)}
                              >
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mr-4">
                                  <Building className="h-7 w-7 text-accent" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-semibold text-base">Accommodation</div>
                                  <div className="text-xs text-muted-foreground">List a room, flat, or student housing</div>
                                </div>
                                <ArrowRight className="h-5 w-5 ml-4 text-muted-foreground group-hover:text-accent" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <AccommodationFormDialogContent onSuccess={() => { setSellDialogOpen(false); setShowAccommodationForm(false); }} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/marketplace/my-listings"}>
                      <Link href="/marketplace/my-listings" className="transition-all hover:text-primary flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span>My Listings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/marketplace/favorites"}>
                      <Link href="/marketplace/favorites" className="transition-all hover:text-primary flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>Favorites</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <Separator className="my-2" />
                  {/* COMMUNITY GROUP */}
                  <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Community</div>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/accommodation"}>
                      <Link href="/accommodation" className="transition-all hover:text-primary flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>Accommodation</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/community"}>
                      <Link href="/community" className="transition-all hover:text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Community</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/messages"}>
                      <Link href="/messages" className="transition-all hover:text-primary flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/verification"}>
                      <Link href="/verification" className="transition-all hover:text-primary flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Verification</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <Separator className="my-2" />
                  {/* ACCOUNT GROUP */}
                  <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Account</div>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/profile"}>
                      <Link href="/profile" className="transition-all hover:text-primary flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                      <Link href="/settings" className="transition-all hover:text-primary flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleSignOut}>
                      <button className="transition-all hover:text-destructive w-full flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="border-t bg-muted/30 shadow-inner p-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/profile"} tooltip="Profile">
                      <Link href="/profile" className="transition-all hover:text-primary flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                      <Link href="/settings" className="transition-all hover:text-primary flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Logout" onClick={handleSignOut}>
                      <button className="transition-all hover:text-destructive w-full flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <Dialog open={showAccommodationForm} onOpenChange={setShowAccommodationForm}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Accommodation</DialogTitle>
                  </DialogHeader>
                  <AccommodationFormDialogContent onSuccess={() => setShowAccommodationForm(false)} />
                </DialogContent>
              </Dialog>
            </Sidebar>
          </div>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  )
}
