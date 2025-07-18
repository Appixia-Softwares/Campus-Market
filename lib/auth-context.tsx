"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, signIn, signUp, signOut, getCurrentUser, onAuthStateChanged, updateProfile } from "./auth-service"
import { useToast } from "@/components/ui/use-toast"
import { onSnapshot, doc as firestoreDoc } from 'firebase/firestore';
import { db } from './firebase';

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Check for existing session and subscribe to auth changes
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setLoading(true)
        setError(null)
        const currentUser = await getCurrentUser()
        if (mounted) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        if (mounted) {
          setError(error instanceof Error ? error.message : "Failed to check authentication status")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const subscription = onAuthStateChanged((user) => {
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    })

    // Real-time listener for user status (banned/suspended)
    let userStatusUnsub: (() => void) | null = null;
    if (user && user.id) {
      const userDocRef = firestoreDoc(db, 'users', user.id);
      userStatusUnsub = onSnapshot(userDocRef, (snap) => {
        const data = snap.data();
        if (data && (data.status === 'banned' || data.status === 'suspended')) {
          setUser(null);
          signOut();
          toast({
            title: 'Access Restricted',
            description: data.status === 'banned' ? 'Your account has been banned.' : 'Your account is suspended.',
            variant: 'destructive',
          });
        }
      });
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (userStatusUnsub) userStatusUnsub();
    }
  }, [user])

  const refreshUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error refreshing user:", error)
      setError(error instanceof Error ? error.message : "Failed to refresh user data")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const { user } = await signIn(email, password)
      setUser(user)
      toast({
        title: "Success",
        description: "Signed in successfully",
      })
    } catch (error) {
      console.error("Error signing in:", error)
      const message = error instanceof Error ? error.message : "Failed to sign in"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)
      const { user } = await signUp(email, password, userData)
      setUser(user)
      toast({
        title: "Success",
        description: "Account created successfully",
      })
    } catch (error) {
      console.error("Error signing up:", error)
      const message = error instanceof Error ? error.message : "Failed to create account"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      setError(null)
      await signOut()
      setUser(null)
      toast({
        title: "Success",
        description: "Signed out successfully",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      const message = error instanceof Error ? error.message : "Failed to sign out"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error("No user logged in")
    try {
      setLoading(true)
      setError(null)
      await updateProfile(user.id, data)
      setUser({ ...user, ...data })
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      const message = error instanceof Error ? error.message : "Failed to update profile"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
