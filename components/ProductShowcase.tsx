// ProductShowcase.tsx
"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getProducts } from "@/lib/firebase-service"

export default function ProductShowcase() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real product data from Firestore (6 most recent active products)
  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true)
      try {
        const { products } = await getProducts({ status: "active", pageSize: 6 })
        setProducts(products)
      } catch (error) {
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="h-48 bg-muted" />
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center mb-12">
        <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-4xl">
          <span className="text-gradient">Popular Products</span>
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Shop trending items from students across Zimbabwe
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden group">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.images && product.images.length > 0 ? product.images[0].url : "/placeholder.svg?height=200&width=200"}
                alt={product.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
                {product.condition}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
              <div className="text-2xl font-bold text-green-600 mb-2">${product.price}</div>
              <div className="text-sm text-muted-foreground mb-2">
                by {product.seller?.full_name || "Unknown Seller"}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{product.views ?? 0}</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/marketplace/products/${product.id}`}>View</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="text-center mt-8">
        <Button asChild size="lg" className="gap-2">
          <Link href="/marketplace">
            View All Products
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
} 