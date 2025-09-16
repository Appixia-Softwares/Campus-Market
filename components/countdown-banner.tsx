"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, CheckCircle, AlertCircle, Sparkles, Rocket, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface CountdownBannerProps {
  onClose: () => void
}

export default function CountdownBanner({ onClose }: CountdownBannerProps) {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          source: 'countdown_banner'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to subscribe')
      }

      const data = await response.json()
      setIsSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white shadow-2xl border-b border-white/20"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Left side - Icon and text */}
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  }}
                  className="relative"
                >
                  <Rocket className="h-6 w-6" />
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "reverse" 
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-yellow-300" />
                  </motion.div>
                </motion.div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-bold text-sm sm:text-base">
                    🚀 Big Thing Coming!
                  </span>
                  <span className="text-xs sm:text-sm opacity-90">
                    Get notified when we launch on September 22nd
                  </span>
                </div>
              </div>

              {/* Right side - Email signup or success message */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isSubscribed ? (
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row items-center gap-2 w-full">
                    <div className="relative w-full sm:w-auto">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading || !email}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-200 w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 text-green-200"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">You're on the list!</span>
                  </motion.div>
                )}

                <Button
                  onClick={onClose}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 text-red-200 text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
