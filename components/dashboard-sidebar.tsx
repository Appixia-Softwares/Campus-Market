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
  CheckCircle2,
  Info,
  ArrowRight,
  ShoppingCart,
  ChevronLeft,
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
import { doc, getDoc, collection, query, where, onSnapshot, getDocs, deleteDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { User as UserType } from "@/lib/auth-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import AccommodationFormDialogContent from "./AccommodationFormDialogContent"
import { TooltipTrigger } from "@/components/ui/tooltip"
import { Tooltip, TooltipContent } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"

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
  const [hasListings, setHasListings] = useState<boolean | null>(null)
  const router = useRouter();
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [showAccommodationForm, setShowAccommodationForm] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  // Check for user listings (products or accommodations)
  useEffect(() => {
    if (!user) {
      setHasListings(null);
      return;
    }
    let cancelled = false;
    async function checkListings() {
      // Check products
      const productsSnap = await getDocs(query(collection(db, "products"), where("seller_id", "==", user!.id)))
      // Check accommodations
      const accomSnap = await getDocs(query(collection(db, "accommodations"), where("seller.id", "==", user!.id)))
      if (!cancelled) {
        setHasListings(productsSnap.size > 0 || accomSnap.size > 0)
      }
    }
    checkListings()
    return () => { cancelled = true }
  }, [user])

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

  // Real-time unread messages count
  useEffect(() => {
    if (!user?.id) return;
    // Listen to all conversations for this user and count unread messages
    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", user.id),
      where("read", "==", false),
      where("sender_id", "!=", user.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadMessages(snap.size);
    });
    return () => unsub();
  }, [user?.id]);

  // Real-time pending orders count
  useEffect(() => {
    if (!user?.id) return;
    // Listen to orders where the user is the buyer and status is 'pending'
    const q = query(
      collection(db, "orders"),
      where("buyer.id", "==", user.id),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingOrders(snap.size);
    });
    return () => unsub();
  }, [user?.id]);

  // Only return null after all hooks
  if (!user || hasListings === false) return null;
  if (hasListings === null) return null;

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
      {/* Responsive wrapper: sidebar hidden on mobile, visible on md+ */}
      <div className="flex">
        <div className={`fixed md:sticky top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-gray-950 shadow-xl flex flex-col ${sidebarWidth} overflow-hidden ${sidebarBorder}`}
          aria-expanded={true}
          aria-label="Sidebar navigation"
        >
          <Sidebar className="h-full flex flex-col justify-between">
            <SidebarHeader>
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  {/* CampusMarket Logo/Icon */}
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
                          <CheckCircle2 className="h-4 w-4 mr-1 text-white" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
            </SidebarHeader>
            <SidebarContent id="sidebar-content" className="flex-1 overflow-y-auto pb-4">
              <SidebarMenu>
                {/* 🟢 DASHBOARD GROUP */}
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" /> Dashboard
                </div>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                        <Link href="/dashboard" className="sidebar-link">
                          <Home className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Dashboard</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/marketplace/my-listings" || pathname.startsWith("/marketplace/my-listings")}>
                        <Link href="/marketplace/my-listings" className="sidebar-link">
                          <ShoppingBag className="h-4 w-4" />
                          <span>My Listings</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>My Listings</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/marketplace/favorites" || pathname.startsWith("/marketplace/favorites")}>
                        <Link href="/marketplace/favorites" className="sidebar-link">
                          <Heart className="h-4 w-4" />
                          <span>Favorites</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Favorites</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/analytics" || pathname.startsWith("/analytics")}>
                        <Link href="/analytics" className="sidebar-link">
                          <BarChart3 className="h-4 w-4" />
                          <span>Analytics</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Analytics</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <Separator className="my-2" />
                {/* 🛒 MARKETPLACE GROUP */}
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" /> Marketplace
                </div>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/marketplace" || pathname.startsWith("/marketplace")}>
                        <Link href="/marketplace" className="sidebar-link">
                          <Search className="h-4 w-4" />
                          <span>Browse Products</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Browse Products</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  {/* Sell Product: Opens dialog with two options */}
                  <Tooltip>
                    <SidebarMenuButton isActive={pathname === "/sell"} onClick={() => setSellDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      <span>Sell Product</span>
                    </SidebarMenuButton>
                  </Tooltip>
                  {/* Sell/Accommodation Dialog */}
                  <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
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
                      {/* Show options or accommodation form based on state */}
                      {!showAccommodationForm ? (
                        <div className="mt-6">
                          <div className="grid grid-cols-1 gap-4">
                            {/* Product Option Row */}
                            <button
                              className="group w-full rounded-lg border border-primary/30 bg-background hover:bg-primary/5 transition flex items-center px-4 py-3 shadow-sm hover:shadow-md focus:outline-none"
                              onClick={() => {
                                setSellDialogOpen(false);
                                router.push("/sell"); // Route to /sell
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
                                <Building className="h-4 w-4" />
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
                        // Accommodation form dialog content
                        <AccommodationFormDialogContent onSuccess={() => { setSellDialogOpen(false); setShowAccommodationForm(false); }} />
                      )}
                    </DialogContent>
                  </Dialog>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/orders" || pathname.startsWith("/orders")}>
                        <Link href="/orders" className="sidebar-link">
                          <ShoppingCart className="h-4 w-4" />
                          <span>Orders</span>
                          {pendingOrders > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">{pendingOrders > 9 ? "9+" : pendingOrders}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Orders</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                {/* Only render the Accommodation group if pathname starts with '/accommodation' */}
                {pathname.startsWith("/accommodation") && (
                  <>
                    <Separator className="my-2" />
                    {/* 🏠 ACCOMMODATION GROUP */}
                    <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" /> Accommodation
                    </div>
                    <SidebarMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={pathname === "/accommodation" || pathname.startsWith("/accommodation")}> 
                            <Link href="/accommodation" className="sidebar-link">
                              <Building className="h-4 w-4" />
                              <span>Accommodation</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>Accommodation</TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      {/* Add Accommodation: Only opens dialog, no navigation */}
                      <Tooltip>
                        <Dialog>
                          <DialogTrigger asChild>
                            <SidebarMenuButton>
                              <Building className="h-4 w-4" />
                              <span>Add Accommodation</span>
                            </SidebarMenuButton>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogTitle className="sr-only">Add Accommodation</DialogTitle>
                            <AccommodationFormDialogContent />
                          </DialogContent>
                        </Dialog>
                      </Tooltip>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={pathname === "/accommodation/my-bookings"}>
                            <Link href="/accommodation/my-bookings" className="sidebar-link">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>My Bookings</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>My Bookings</TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={pathname === "/accommodation/manage-bookings"}>
                            <Link href="/accommodation/manage-bookings" className="sidebar-link">
                              <Users className="h-4 w-4" />
                              <span>Manage Bookings</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>Manage Bookings</TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  </>
                )}
                <Separator className="my-2" />
                {/* 👥 COMMUNITY GROUP */}
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Community
                </div>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/community" || pathname.startsWith("/community")}>
                        <Link href="/community" className="sidebar-link">
                          <Users className="h-4 w-4" />
                          <span>Community</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Community</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/messages" || pathname.startsWith("/messages")}>
                        <Link href="/messages" className="sidebar-link">
                          <MessageSquare className="h-4 w-4" />
                          <span>Messages</span>
                          {unreadMessages > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Messages</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/verification" || pathname.startsWith("/verification")}>
                        <Link href="/verification" className="sidebar-link">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Verification</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Verification</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <Separator className="my-2" />
                {/* 👤 ACCOUNT GROUP */}
                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Account
                </div>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/profile" || pathname.startsWith("/profile")}>
                        <Link href="/profile" className="sidebar-link">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Profile</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={pathname === "/settings" || pathname.startsWith("/settings")}>
                        <Link href="/settings" className="sidebar-link">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <SidebarMenuButton asChild tooltip="Logout" onClick={handleSignOut}>
                      <button className="sidebar-link transition-all hover:text-destructive w-full flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </SidebarMenuButton>
                  </Tooltip>
                </SidebarMenuItem>
                {/* Collapse button (optional, for future) */}
                <SidebarMenuItem>
                  <Tooltip>
                    <SidebarMenuButton asChild tooltip="Collapse Sidebar">
                      <button className="sidebar-link w-full flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        <span>Collapse</span>
                      </button>
                    </SidebarMenuButton>
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t bg-muted/30 shadow-inner p-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <SidebarMenuButton asChild isActive={pathname === "/profile" || pathname.startsWith("/profile")}>
                      <Link href="/profile" className="transition-all hover:text-primary flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <SidebarMenuButton asChild isActive={pathname === "/settings" || pathname.startsWith("/settings")}>
                      <Link href="/settings" className="transition-all hover:text-primary flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <SidebarMenuButton asChild tooltip="Logout" onClick={handleSignOut}>
                      <button className="transition-all hover:text-destructive w-full flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </SidebarMenuButton>
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        </div>
      </div>
    </SidebarProvider>
  )
}
