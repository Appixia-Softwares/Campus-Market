// ProductShowcase.tsx
"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

// Mock data for products
const MOCK_PRODUCTS = [
  {
    id: "1",
    title: "Apple MacBook Pro 14”",
    price: 1200,
    condition: "New",
    image: "/placeholder.svg?height=200&width=200",
    seller: "Jane Doe",
    likes: 23,
  },
  {
    id: "2",
    title: "Samsung Galaxy S22 Ultra",
    price: 800,
    condition: "Used",
    image: "/placeholder.svg?height=200&width=200",
    seller: "John Smith",
    likes: 15,
  },
  {
    id: "3",
    title: "Textbooks Bundle (Engineering)",
    price: 60,
    condition: "Like New",
    image: "/placeholder.svg?height=200&width=200",
    seller: "Alice Brown",
    likes: 8,
  },
  {
    id: "4",
    title: "Mini Fridge",
    price: 100,
    condition: "Used",
    image: "/placeholder.svg?height=200&width=200",
    seller: "Bob Lee",
    likes: 12,
  },
  {
    id: "5",
    title: "Bluetooth Headphones",
    price: 40,
    condition: "New",
    image: "/placeholder.svg?height=200&width=200",
    seller: "Sarah Kim",
    likes: 19,
  },
  {
    id: "6",
    title: "Office Chair",
    price: 55,
    condition: "Used",
    image: "/placeholder.svg?height=200&width=200",
    seller: "David Green",
    likes: 7,
  },
]

export default function ProductShowcase() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
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
                src={product.image}
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
                by {product.seller}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{product.likes}</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/marketplace">View</Link>
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