"use client"

import { useEffect, useState } from "react"
import { ArrowRight, ShoppingBag, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore"
// No Product type import; use 'any' for products

export function ProductShowcase() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('is_sold', '==', false),
          orderBy('created_at', 'desc'),
          limit(6)
        )

        const snapshot = await getDocs(productsQuery)
        // Fetch category for each product
        const products = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let category = null;
          if (data.category_id) {
            const catRef = doc(db, 'product_categories', data.category_id);
            const catDoc = await getDoc(catRef);
            if (catDoc.exists()) {
              category = { name: catDoc.data().name };
            }
          }
          return { id: docSnap.id, ...data, product_categories: category };
        }));
        setProducts(products)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">
            <span className="text-gradient">Student Marketplace</span>
          </h3>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">
          <span className="text-gradient">Student Marketplace</span>
        </h3>
        <Link href="/marketplace">
          <Button variant="ghost" className="gap-2 group">
            {totalCount > 0 ? `View all ${totalCount} products` : "Browse marketplace"}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">No products yet</h4>
              <p className="text-muted-foreground">
                Be the first to list a product on our marketplace! Students will be able to buy textbooks, electronics,
                and more.
              </p>
            </div>
            <Link href="/signup">
              <Button className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Start selling
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 px-2 sm:px-0">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold line-clamp-1 text-sm">{product.title}</h4>
                    {product.users.verified && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.product_categories?.name || 'Uncategorized'}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-green-600">ZWL {product.price.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {product.condition}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">by {product.users.full_name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
