'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'

// List of public routes that don't require authentication
const publicRoutes = [
  '/',                    // Homepage
  '/login',
  '/register',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/auth/callback',       // Auth callback route
  '/terms',              // Terms of service
  '/privacy',            // Privacy policy
  '/marketplace',        // Public marketplace view
  '/about',              // About page
  '/contact',            // Contact page
  '/faq',                // FAQ page
  '/universities'        // Universities listing
]

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'landlord' | 'user'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading, error } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Authentication Error</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    )
  }

  // Show children if:
  // 1. It's a public route
  // 2. User is authenticated and has required role
  // 3. User is authenticated and no role is required
  return user ? <>{children}</> : null
}
