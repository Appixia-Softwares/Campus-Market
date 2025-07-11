// Environment variables with defaults for development
export const env = {
  // Optional variables with defaults
  VERCEL_URL: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000",
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000",
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === "true" || false,
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === "true" || false,

  // App configuration
  APP_NAME: "CampusMarket Zimbabwe",
  APP_DESCRIPTION: "Student marketplace for Zimbabwe universities",

  // Feature flags
  FEATURES: {
    analytics: process.env.ENABLE_ANALYTICS === "true",
    notifications: process.env.ENABLE_NOTIFICATIONS === "true",
    realtime: true,
    messaging: true,
  },
} as const

// Validate required environment variables
export function validateEnv() {
  // Firebase configuration is handled in lib/firebase.ts
  console.log("✅ Environment variables validated")
  console.log("🔧 App configuration:", {
    name: env.APP_NAME,
    url: env.VERCEL_URL,
    features: env.FEATURES,
  })
}

// Call validation on import
if (typeof window === "undefined") {
  // Only validate on server side to avoid client-side errors
  try {
    validateEnv()
  } catch (error) {
    console.error("❌ Environment validation failed:", error)
  }
}
