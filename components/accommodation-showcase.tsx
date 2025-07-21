"use client"

import { motion } from "framer-motion"
import { ArrowRight, MapPin, Users, Wifi, Tv, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getRecentAccommodations } from "@/services/accommodation"

// Fetch and display real accommodation data
export default function AccommodationShowcase() {
  const [accommodations, setAccommodations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAccommodations() {
      setIsLoading(true)
      try {
        const data = await getRecentAccommodations()
        setAccommodations(data.slice(0, 4))
      } catch (e) {
        setAccommodations([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchAccommodations()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6 pt-12">
      <div className="flex items-center justify-between">
        <motion.h3
          className="text-2xl font-bold relative"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-gradient">Student Accommodation</span>
          <motion.div
            className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-green-600 to-green-300 rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          />
        </motion.h3>
        <Link href="/accommodation">
          <Button variant="ghost" className="gap-2 group">
            View all
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 px-2 sm:px-0"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <motion.div key={i} variants={item} className="card-hover-effect">
              <Card className="h-full overflow-hidden transition-all border-green-100 dark:border-green-900 relative animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardHeader className="p-4 pb-0 relative">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          accommodations.map((accommodation, index) => (
            <motion.div
              key={accommodation.id}
              variants={item}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="card-hover-effect"
            >
              <Card className="h-full overflow-hidden transition-all border-green-100 dark:border-green-900 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/30 dark:to-transparent opacity-60 z-0"></div>
                <div className="aspect-video overflow-hidden image-hover-zoom relative">
                  <img
                    src={accommodation.images && accommodation.images.length > 0 ? accommodation.images[0] : "/placeholder.svg?height=200&width=300"}
                    alt={accommodation.title || accommodation.name || "Accommodation"}
                    className="h-full w-full object-cover"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <span className="text-white font-medium">View Details</span>
                  </motion.div>
                  {/* Price tag */}
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-md text-sm font-bold shadow-lg">
                    ${accommodation.price}
                  </div>
                </div>
                <CardHeader className="p-4 pb-0 relative">
                  <div className="flex justify-between">
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">{accommodation.type || accommodation.propertyType || "Type"}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{accommodation.rating ?? "-"}</span>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-1 text-lg mt-2">{accommodation.title || accommodation.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="mr-1 h-3.5 w-3.5 text-green-500" />
                    {accommodation.location || accommodation.address}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 relative">
                  <p className="font-bold text-green-600 dark:text-green-400">${accommodation.price}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(accommodation.amenities || []).map((feature: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full"
                      >
                        {feature === "Wifi" && <Wifi className="mr-1 h-3 w-3" />}
                        {feature === "TV" && <Tv className="mr-1 h-3 w-3" />}
                        {feature === "Shared" && <Users className="mr-1 h-3 w-3" />}
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300"
                    asChild
                  >
                    <Link href={`/accommodation/${accommodation.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}
