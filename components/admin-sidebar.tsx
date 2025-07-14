"use client";
import { LayoutDashboard, Users, ShoppingBag, Home, Settings } from "lucide-react";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import Link from "next/link";

export default function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="w-full flex flex-col h-full bg-white dark:bg-gray-950 border-r shadow-md">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 px-6 py-6 border-b mb-2">
        <img src="/placeholder-logo.svg" alt="Campus Market Admin" className="h-8 w-8" />
        <span className="font-bold text-lg tracking-tight text-primary">Admin Panel</span>
      </div>
      {/* Section Heading */}
      <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</div>
      <SidebarGroupContent className="flex-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin/dashboard"} tooltip="Dashboard">
              <Link href="/admin/dashboard" legacyBehavior>
                <a className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-150 group ${pathname === "/admin/dashboard" ? "bg-primary/10 border-l-4 border-primary text-primary" : "hover:bg-muted/60 text-gray-700 dark:text-gray-200"}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </a>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin/users"} tooltip="Users">
              <Link href="/admin/users" legacyBehavior>
                <a className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-150 group ${pathname === "/admin/users" ? "bg-primary/10 border-l-4 border-primary text-primary" : "hover:bg-muted/60 text-gray-700 dark:text-gray-200"}`}>
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </a>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin/products"} tooltip="Products">
              <Link href="/admin/products" legacyBehavior>
                <a className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-150 group ${pathname === "/admin/products" ? "bg-primary/10 border-l-4 border-primary text-primary" : "hover:bg-muted/60 text-gray-700 dark:text-gray-200"}`}>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Products</span>
                </a>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin/orders"} tooltip="Orders">
              <Link href="/admin/orders" legacyBehavior>
                <a className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-150 group ${pathname === "/admin/orders" ? "bg-primary/10 border-l-4 border-primary text-primary" : "hover:bg-muted/60 text-gray-700 dark:text-gray-200"}`}>
                  <Home className="h-4 w-4" />
                  <span>Orders</span>
                </a>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
      {/* Settings Section */}
      <div className="px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Settings</div>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/admin/settings"} tooltip="Settings">
            <Link href="/admin/settings" legacyBehavior>
              <a className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-150 group ${pathname === "/admin/settings" ? "bg-primary/10 border-l-4 border-primary text-primary" : "hover:bg-muted/60 text-gray-700 dark:text-gray-200"}`}>
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* Optionally, add a user profile/logout at the bottom in the future */}
    </aside>
  );
} 