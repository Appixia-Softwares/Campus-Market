"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BookOpen, Eye, EyeOff, Lock, Mail, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/lib/auth-service";
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { handleFirebaseError } from "@/lib/firebase-error"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  // Check for success message from signup
  useEffect(() => {
    const message = searchParams.get("message")
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (!user.email_verified) {
        router.push("/verification");
      } else {
        const redirectTo = searchParams.get("redirectTo") || "/dashboard";
        router.push(redirectTo);
      }
    }
  }, [user, router, searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast({ title: "Email is required", variant: "destructive" })
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" })
      return false
    }
    if (!formData.password) {
      toast({ title: "Password is required", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      // Use modular Firebase Auth signIn helper
      await signIn(formData.email, formData.password);
      // Refresh user data and redirect
      await refreshUser();
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      toast({ title: "Signed in successfully!", variant: "default" })
      router.push(redirectTo);
    } catch (error: any) {
      const friendly = handleFirebaseError(error)
      toast({ title: friendly.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
        <div className="container flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="text-xl font-bold">Campus Marketplace</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">Sign in to your Campus Marketplace account</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show success message as toast only */}
              {successMessage && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Show error as toast only */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {/* Google sign-in and divider removed as per requirements */}
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  Create account
                </Link>
              </div>
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
