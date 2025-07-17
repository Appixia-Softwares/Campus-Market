"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, User, Menu, X, Home, Settings, Users, BarChart3, ShoppingCart, ShoppingBag, Heart, Building, MessageSquare, CheckCircle2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationsPanel from '@/components/notifications-panel';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DashboardHeaderProps {
  onMobileMenu?: () => void;
}

// Mobile Navigation Items - matching your sidebar structure
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, group: 'Dashboard' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Marketplace' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, group: 'Marketplace' },
  { name: 'Browse Products', href: '/marketplace', icon: Search, group: 'Marketplace' },
  { name: 'My Listings', href: '/marketplace/my-listings', icon: ShoppingBag, group: 'Marketplace' },
  { name: 'Favorites', href: '/marketplace/favorites', icon: Heart, group: 'Marketplace' },
  { name: 'Accommodation', href: '/accommodation', icon: Building, group: 'Community' },
  { name: 'Community', href: '/community', icon: Users, group: 'Community' },
  { name: 'Messages', href: '/messages', icon: MessageSquare, group: 'Community' },
  { name: 'Verification', href: '/verification', icon: CheckCircle2, group: 'Community' },
];

export function DashboardHeader({ onMobileMenu }: DashboardHeaderProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Mock search logic (replace with real API later)
  const mockData = [
    { title: "User Management", type: "Page", href: "/admin/settings" },
    { title: "Marketplace", type: "Feature", href: "/marketplace" },
    { title: "Accommodation", type: "Feature", href: "/accommodation" },
    { title: "Orders", type: "Page", href: "/orders" },
    { title: "Profile Settings", type: "Page", href: "/profile" },
    { title: "Analytics Dashboard", type: "Page", href: "/analytics" },
    { title: "Community", type: "Feature", href: "/community" },
    { title: "Messages", type: "Page", href: "/messages" },
  ];

  // Filter mock data as user types
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    setSearchResults(
      mockData.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
    return () => unsub();
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (onMobileMenu) {
      onMobileMenu();
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 animate-slideDown">
        {/* Hamburger for mobile */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={toggleMobileMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="flex flex-1 items-center gap-4 md:gap-6">
          {/* Search input triggers modal */}
          <form className="flex-1" onSubmit={e => { e.preventDefault(); setSearchOpen(true); }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search... (Ctrl+K)"
                className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3 cursor-pointer"
                onFocus={() => setSearchOpen(true)}
                readOnly
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              {user?.id && <NotificationsPanel userId={user.id} />}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url} alt={user?.email} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.full_name || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Modal (bottom sheet on mobile) */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg w-full p-0 rounded-t-2xl md:rounded-2xl md:bottom-auto md:top-1/4 md:translate-y-0 bottom-0 fixed md:relative animate-in fade-in slide-in-from-bottom-10 duration-200">
          <div className="p-4 border-b flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              className="flex-1 bg-transparent outline-none text-base px-2"
            />
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {searchQuery === "" && (
              <div className="p-4 text-muted-foreground text-sm">Start typing to search pages, features, or users.</div>
            )}
            {searchQuery !== "" && searchResults.length === 0 && (
              <div className="p-4 text-muted-foreground text-sm">No results found.</div>
            )}
            {searchResults.map((item, idx) => (
              <Button
                key={item.href + idx}
                variant="ghost"
                className="w-full justify-start px-4 py-3 rounded-none border-b text-left hover:bg-accent"
                onClick={() => {
                  setSearchOpen(false);
                  router.push(item.href);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.type}</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 left-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info in Mobile Menu */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar_url} alt={user?.email} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10"
              onClick={() => handleNavigation('/profile')}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}