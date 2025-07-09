"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageSquare, Eye, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface FavoriteProduct {
  id: string
  created_at: string
  products: {
    id: string
    title: string
    description: string | null
    price: number
    condition: string
    status: string
    views: number
    likes: number
    created_at: string
    product_categories: {
      name: string
    }
    product_images: {
      url: string
    }[]
    users: {
      full_name: string
    }
  }
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          *,
          products (
            *,
            product_categories (name),
            product_images (url),
            users (full_name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setFavorites(data || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast({
        title: "Error",
        description: "Failed to load your favorites",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase.from("user_favorites").delete().eq("id", favoriteId)

      if (error) throw error

      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId))
      toast({
        title: "Removed from favorites",
        description: "The item has been removed from your favorites",
      })
    } catch (error) {
      console.error("Error removing favorite:", error)
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Favorites</h1>
          <p className="text-muted-foreground">Items you've saved for later</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Favorites</h1>
        <p className="text-muted-foreground">Items you've saved for later ({favorites.length})</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6">Start browsing and save items you're interested in</p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => {
            const product = favorite.products
            return (
              <Card key={favorite.id} className="overflow-hidden group hover:shadow-md transition-shadow duration-300">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.product_images?.[0]?.url || "/placeholder.svg?height=300&width=300"}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/50 hover:bg-background/80"
                      onClick={() => removeFavorite(favorite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge
                    variant={
                      product.status === "active" ? "default" : product.status === "sold" ? "destructive" : "secondary"
                    }
                    className="absolute top-2 left-2"
                  >
                    {product.status}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium line-clamp-1">{product.title}</h3>
                      <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {product.product_categories?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By {product.users?.full_name}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{product.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{product.likes}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Saved {formatDistanceToNow(new Date(favorite.created_at), { addSuffix: true })}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Link href={`/marketplace/products/${product.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button size="icon" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
