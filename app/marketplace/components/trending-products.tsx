"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, Heart, MessageSquare } from "lucide-react"
import { ProductGrid } from "./product-grid"

interface TrendingProductsProps {
  products: any[]
  isLoading: boolean
  viewMode: "grid" | "list"
}

export function TrendingProducts({ products, isLoading, viewMode }: TrendingProductsProps) {
  // Sort products by engagement (views + likes + messages)
  const trendingProducts = products
    .map((product) => ({
      ...product,
      engagement: (product.views || 0) + (product.likes || 0) + (product.messages_count || 0),
    }))
    .sort((a, b) => b.engagement - a.engagement)

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Now
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              🔥 Hot Items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {trendingProducts.slice(0, 10).reduce((sum, p) => sum + (p.views || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Eye className="h-4 w-4" />
                Total Views
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {trendingProducts.slice(0, 10).reduce((sum, p) => sum + (p.likes || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="h-4 w-4" />
                Total Likes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trendingProducts.slice(0, 10).reduce((sum, p) => sum + (p.messages_count || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Total Messages
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductGrid products={trendingProducts} isLoading={isLoading} viewMode={viewMode} />
    </div>
  )
}
