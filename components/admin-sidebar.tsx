"use client";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  Settings,
  BookOpen,
  Home,
  Shield,
  Database,
  Folder,
  AlertTriangle,
  Building,
} from "lucide-react";
import Link from "next/link";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenu, SidebarSeparator } from "@/components/ui/sidebar";

export default function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Dashboard">
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/users"} tooltip="Users">
          <Link href="/admin/users">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/products"} tooltip="Products">
          <Link href="/admin/products">
            <ShoppingBag className="h-4 w-4" />
            <span>Products</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/orders"} tooltip="Orders">
          <Link href="/admin/orders">
            <ShoppingCart className="h-4 w-4" />
            <span>Orders</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/reports"} tooltip="Reports">
          <Link href="/admin/reports">
            <AlertTriangle className="h-4 w-4" />
            <span>Reports</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/categories"} tooltip="Categories">
          <Link href="/admin/categories">
            <Folder className="h-4 w-4" />
            <span>Categories</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/accommodation"} tooltip="Accommodation">
          <Link href="/admin/accommodation">
            <Building className="h-4 w-4" />
            <span>Accommodation</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/analytics"} tooltip="Analytics">
          <Link href="/admin/analytics">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/messages"} tooltip="Messages">
          <Link href="/admin/messages">
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/settings"} tooltip="Settings">
          <Link href="/admin/settings">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/feedback"} tooltip="Feedback & Support">
          <Link href="/admin/feedback">
            <BookOpen className="h-4 w-4" />
            <span>Feedback</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/admins"} tooltip="Admins & Roles">
          <Link href="/admin/admins">
            <Shield className="h-4 w-4" />
            <span>Admins</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/marketing"} tooltip="Marketing & Promotions">
          <Link href="/admin/marketing">
            <Home className="h-4 w-4" />
            <span>Marketing</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarSeparator />
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/admin/database"} tooltip="Database Tools">
          <Link href="/admin/database">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
} 