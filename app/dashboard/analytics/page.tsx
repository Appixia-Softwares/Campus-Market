"use client"

import { DollarSign, ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AnalyticsPage() {
  const [accomStats, setAccomStats] = useState({
    total: 0,
    bookings: 0,
    revenue: 0,
    occupancy: 0,
  })
  useEffect(() => {
    async function fetchAccomStats() {
      // Fetch total accommodation listings
      const accomSnap = await getDocs(collection(db, 'accommodations'))
      const total = accomSnap.size
      // Fetch bookings (mocked for now)
      const bookingsSnap = await getDocs(collection(db, 'accommodation_bookings'))
      const bookings = bookingsSnap.size
      // Revenue and occupancy (mocked)
      setAccomStats({
        total,
        bookings,
        revenue: bookings * 100, // mock $100 per booking
        occupancy: total > 0 ? Math.round((bookings / total) * 100) : 0,
      })
    }
    fetchAccomStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track the performance of your listings and marketplace activity
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accommodations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accomStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accomStats.bookings}</div>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${accomStats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Mocked Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accomStats.occupancy}%</div>
            <p className="text-xs text-muted-foreground">Occupancy Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
