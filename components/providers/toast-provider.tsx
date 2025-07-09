"use client"

import { createContext, useContext, ReactNode } from "react"
import { ToastContainer, useToast } from "@/components/ui/custom-toast"

const ToastContext = createContext<ReturnType<typeof useToast> | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}
