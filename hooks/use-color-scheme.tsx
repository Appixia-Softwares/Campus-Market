"use client"

import { useTheme } from "next-themes"

export function useColorScheme() {
  const { theme } = useTheme()
  return theme as "light" | "dark" | undefined
}
