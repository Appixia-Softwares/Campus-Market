"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const retryCount = useRef(0)

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return

    const trackPageView = async () => {
      try {
        // Only track if we have a valid path
        if (!pathname.startsWith('/')) return

        // Placeholder for analytics logic
        console.log("Analytics: Page view tracked", { pathname, searchParams, user })

        // Reset retry count on success
        retryCount.current = 0
      } catch (error) {
        console.warn("Analytics error:", error)
        
        // Retry logic
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1
          setTimeout(trackPageView, RETRY_DELAY * retryCount.current)
        }
      }
    }

    trackPageView()
  }, [pathname, searchParams, user])

  return null
}
