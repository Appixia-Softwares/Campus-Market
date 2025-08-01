"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MapPin, Clock, Eye, Truck, MessageCircle, Share2, MoreVertical, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Timestamp } from "firebase/firestore"
import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Laptop, Shirt, Home, Book, Dumbbell, Car, Baby, Apple, Watch, Camera, Gamepad2, PawPrint, Sparkles, Briefcase, Globe, Gift, Music, FlaskConical, Wrench, Gem, BedDouble, Bike, Tv, Phone, Wallet, ShoppingBag, Package, Cake } from "lucide-react";
// Import local university data
import ZIM_UNIVERSITIES from "@/utils/schools_data";
import { CATEGORY_META } from "@/lib/category-config";

interface ProductGridProps {
  products: any[]
  isLoading: boolean
  viewMode: "grid" | "list"
  onProductUpdate?: () => void
  showDistance?: boolean
  showDelivery?: boolean
}

const formatDate = (date: Timestamp | string | Date) => {
  if (date instanceof Timestamp) {
    return date.toDate()
  }
  if (typeof date === 'string') {
    return new Date(date)
  }
  return date
}

// 2. Create a mapping from category name to icon component
const categoryIconMap: Record<string, React.ElementType> = {
  Electronics: Laptop,
  Fashion: Shirt,
  "Home & Garden": Home,
  "Books & Media": Book,
  "Beauty & Personal Care": Sparkles,
  "Sports & Outdoors": Dumbbell,
  "Toys & Games": Gamepad2,
  Groceries: Apple,
  Automotive: Car,
  "Health & Wellness": FlaskConical,
  "Jewelry & Accessories": Gem,
  "Office & School": Briefcase,
  "Baby & Kids": Baby,
  "Pet Supplies": PawPrint,
  "Gifts & Occasions": Gift,
  "Music & Instruments": Music,
  Watches: Watch,
  Cameras: Camera,
  Gaming: Gamepad2,
  "Health & Beauty": Sparkles,
  "Travel & Luggage": Globe,
  Furniture: BedDouble,
  "Weddings & Events": Cake,
  "TV & Audio": Tv,
  "Phones & Tablets": Phone,
  "Bikes & Scooters": Bike,
  "Tools & DIY": Wrench,
  "Bags & Wallets": Wallet,
  Shoes: ShoppingBag,
};

// Helper to get university by id
function getUniversityById(id: string) {
  return ZIM_UNIVERSITIES.find(u => u.id === id);
}
// Helper to get category meta by id or name
function getCategoryMeta(keyOrName: string) {
  const key = keyOrName?.toLowerCase();
  return CATEGORY_META.find(cat => cat.key === key || cat.label.toLowerCase() === key);
}

export function ProductGrid({
  products,
  isLoading,
  viewMode,
  onProductUpdate,
  showDistance = false,
  showDelivery = false,
}: ProductGridProps) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState<string[]>([])

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error("Please log in to save favorites")
      return
    }
    setLoadingFavorites((prev) => [...prev, productId])
    try {
      const favRef = doc(db, 'user_favorites', `${user.id}_${productId}`)
      const favSnap = await getDoc(favRef)
      if (favSnap.exists()) {
        // Remove favorite
        await setDoc(favRef, {}, { merge: false }) // Or use deleteDoc if you want to delete
        setFavorites((prev) => prev.filter((id) => id !== productId))
        toast.success("Removed from favorites")
      } else {
        // Add favorite
        await setDoc(favRef, { user_id: user.id, product_id: productId })
        setFavorites((prev) => [...prev, productId])
        toast.success("Added to favorites")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Failed to update favorites")
    } finally {
      setLoadingFavorites((prev) => prev.filter((id) => id !== productId))
    }
  }

  const shareProduct = async (product: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/marketplace/products/${product.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this ${product.title} for $${product.price}`,
          url: url,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    }
  }

  const contactWhatsApp = (product: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.users?.whatsapp_number) {
      toast.error("WhatsApp number not available")
      return
    }

    const message = `Hi! I'm interested in your ${product.title} listed for $${product.price} on Campus Market.`
    const whatsappUrl = `https://wa.me/${product.users.whatsapp_number}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const startConversation = async (product: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error("Please log in to message sellers")
      return
    }
    if (product.seller_id === user.id) {
      toast.error("You cannot message yourself")
      return
    }
    try {
      // Check if conversation exists
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('product_id', '==', product.id),
        where('participants', 'array-contains', user.id)
      )
      const snapshot = await getDocs(conversationsQuery)
      let conversationId = null
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        if (data.participants.includes(product.seller_id)) {
          conversationId = docSnap.id
        }
      })
      if (conversationId) {
        window.location.href = `/messages/${conversationId}`
        return
      }
      // Create new conversation
      const newConversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.id, product.seller_id],
        product_id: product.id,
        created_at: new Date(),
      })
      window.location.href = `/messages/${newConversationRef.id}`
    } catch (error) {
      console.error("Error starting conversation:", error)
      toast.error("Failed to start conversation")
    }
  }

  if (isLoading) {
    return (
      <div
        className={`grid gap-6 ${
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        }`}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium mb-2">No Products Found</h3>
        <p className="text-muted-foreground mb-6">Try adjusting your search criteria or browse different categories</p>
        <Button onClick={() => window.location.reload()}>Clear Filters</Button>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {/* Responsive grid: gap and padding tuned for mobile */}
      <div
        className={`grid gap-3 sm:gap-4 md:gap-6 ${
          viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        } p-1 sm:p-0`}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {/* Card: ensure all buttons and overlays are touch-friendly */}
            <Link href={`/marketplace/products/${product.id}`} className="block h-full">
              <Card
                className={`overflow-hidden h-full group transition-all duration-300 ${
                  viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                } group-hover:shadow-2xl group-hover:scale-[1.03] ${product.featured ? "border-2 border-yellow-400" : ""}`}
              >
                <div
                  className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : "aspect-square"}`}
                >
                  <img
                    src={product.product_images?.[0]?.url || "/placeholder.svg?height=300&width=300"}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => toggleFavorite(product.id, e)}
                        disabled={loadingFavorites.includes(product.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => shareProduct(product, e)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.status === "sold" && <Badge variant="destructive">Sold</Badge>}
                    {product.featured && <Badge className="bg-yellow-500 text-yellow-900">Featured</Badge>}
                    {showDelivery && product.delivery_available && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery
                      </Badge>
                    )}
                  </div>

                  {/* University Badge */}
                  {(() => {
                    const sellerUniversityId = product.users?.university_id;
                    console.log('Seller university_id:', sellerUniversityId, 'Lookup result:', getUniversityById(sellerUniversityId));
                    const university = getUniversityById(sellerUniversityId);
                    return (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 flex items-center gap-1 px-3 py-1 rounded-full shadow-md">
                          <MapPin className="h-4 w-4 mr-1" />
                          {university ? university.name : "Unknown University"}
                        </Badge>
                      </div>
                    );
                  })()}

                  {/* Category Badge */}
                  {(() => {
                    const category = getCategoryMeta(product.category_id || product.category);
                    return (
                      <div className="absolute bottom-2 left-2 z-10">
                        <Badge variant="secondary" className="bg-primary/90 text-primary-foreground flex items-center gap-1 px-3 py-1 rounded-full shadow-md">
                          {category?.icon && <category.icon className="h-4 w-4 mr-1" />} {category ? category.label : "Uncategorized"}
                      </Badge>
                    </div>
                    );
                  })()}
                </div>

                <div className="flex-1">
                  <CardContent className="p-4">
                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6 ring-2 ring-primary/20">
                        <AvatarImage src={product.users?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{product.users?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-primary font-medium">{product.users?.full_name}</span>
                      {product.users?.verified && (
                        <Badge variant="outline" className="text-xs px-1 border-green-400 text-green-600 bg-green-50 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => shareProduct(product, e)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => toggleFavorite(product.id, e)}>
                              <Heart className="h-4 w-4 mr-2" />
                              {favorites.includes(product.id) ? "Remove from" : "Add to"} Favorites
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {product.condition}
                        </Badge>
                      </div>

                      {viewMode === "list" && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      )}

                      {/* Category and Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {product.product_categories?.icon} {product.product_categories?.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {product.likes || 0}
                          </span>
                        </div>
                      </div>

                      {/* Time and Location */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(formatDate(product.created_at), { addSuffix: true })}
                        </span>
                        {showDistance && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Same campus
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={(e) => contactWhatsApp(product, e)}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                        </TooltipTrigger>
                        <TooltipContent>Contact seller on WhatsApp</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => startConversation(product, e)}
                      disabled={product.status === "sold" || product.seller_id === user?.id}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {product.status === "sold" ? "Sold" : "Message"}
                    </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send a message to the seller</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  )
}
