"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Database, Users, MapPin, Home, Package } from "lucide-react"

interface DatabaseStats {
  universities: number
  locations: number
  accommodation_types: number
  product_categories: number
  users: number
}

export function DatabaseStatus() {
  return <div>Database status not available</div>;
}
