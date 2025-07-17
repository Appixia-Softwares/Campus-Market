"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/"); // Redirect non-admins to home (or a 403 page)
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-8 text-center text-muted-foreground">Checking admin access...</div>;
  }

  if (user.role !== "admin") {
    return null; // Or show a 403 message
  }

  return <>{children}</>;
} 