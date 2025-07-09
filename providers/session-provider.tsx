"use client"

import type React from "react"
import { createContext, useContext } from "react"

const SessionContext = createContext(undefined)

export function SessionProvider({ children }) {
  return <SessionContext.Provider value={{}}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
