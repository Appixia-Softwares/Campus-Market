"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface RecentlyViewedProps {
  products: any[]
}

export function RecentlyViewed({ products }: RecentlyViewedProps) {
  // Filter out any null/undefined or incomplete products
  const validProducts = (products || []).filter(
    (p) => p && p.id && typeof p.price === "number" && p.title
  );
  // Deduplicate by id
  const uniqueProducts = Array.from(new Map(validProducts.map(p => [p.id, p])).values());
  if (uniqueProducts.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Recently Viewed
            <Badge variant="secondary">{uniqueProducts.length} items</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace/history">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {uniqueProducts.slice(0, 6).map((product, index) => (
            <motion.div
              key={typeof product.id === 'string' || typeof product.id === 'number' ? product.id : `recently-viewed-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/marketplace/products/${product.id}`}>
                <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-3">
                    <div className="aspect-square overflow-hidden rounded-md mb-2">
                      <img
                        src={product.product_images?.[0]?.url || "/placeholder.svg?height=150&width=150"}
                        alt={product.title || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.title || 'Untitled'}</h4>
                    <p className="text-sm font-bold text-primary">
                      {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
