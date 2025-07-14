"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Heart,
  MessageSquare,
  Share2,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  Flag,
  Phone,
  Truck,
  ShoppingCart,
  Clock,
  Shield,
  CheckCircle,
  Copy,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp, DocumentReference } from "firebase/firestore"
import { db } from "@/lib/firebase"
// Import local university data
import ZIM_UNIVERSITIES from "@/utils/schools_data";
import { CATEGORY_CONFIG, CategoryKey, CategoryField } from "@/lib/category-config";

interface ProductDetails {
  id: string
  title: string
  description: string | null
  price: number
  original_price: number | null
  condition: string
  status: string
  brand: string | null
  model: string | null
  pickup_location: string | null
  delivery_available: boolean
  delivery_fee: number
  price_negotiable: boolean
  views: number
  likes: number
  created_at: string
  product_categories: {
    name: string
    description: string | null
    icon: string
  }
  users: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    verified: boolean
    whatsapp_number: string | null
    university_id: string
    student_id: string | null
    year_of_study: number | null
    course: string | null
  }
  universities: {
    name: string
    location: string
    type: string
  }
  product_images: {
    id: string
    url: string
    is_primary: boolean
  }[]
}

interface SellerData {
  full_name: string;
  email: string;
  avatar_url: string | null;
  verified: boolean;
  whatsapp_number: string | null;
  university_id: string;
  student_id: string | null;
  year_of_study: number | null;
  course: string | null;
}

interface UniversityData {
  name: string;
  location: string;
  type: string;
}

interface ProductData {
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  condition: string;
  status: string;
  brand: string | null;
  model: string | null;
  pickup_location: string | null;
  delivery_available: boolean;
  delivery_fee: number;
  price_negotiable: boolean;
  views: number;
  likes: number;
  created_at: string;
  category_id: string;
}

const formatDate = (date: any) => {
  if (!date) return 'Unknown date'
  if (date.toDate) return date.toDate()
  return new Date(date)
}

// Helper to get university by id
function getUniversityById(id: string) {
  return ZIM_UNIVERSITIES.find(u => u.id === id);
}

// Helper to map display name to config key
function getCategoryKey(name: string): CategoryKey | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  const validKeys: CategoryKey[] = [
    "electronics", "fashion", "home & garden", "books & media", "beauty & personal care",
    "sports & outdoors", "toys & games", "groceries", "automotive", "health & wellness",
    "jewelry & accessories", "office & school", "baby & kids", "pet supplies", "gifts & occasions",
    "music & instruments", "watches", "cameras", "gaming", "health & beauty", "travel & luggage",
    "furniture", "weddings & events", "tv & audio", "phones & tablets", "bikes & scooters",
    "tools & diy", "bags & wallets", "shoes", "other"
  ];
  if (validKeys.includes(key as CategoryKey)) {
    return key as CategoryKey;
  }
  return undefined;
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [product, setProduct] = useState<ProductDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    pickup_location: "",
    pickup_time: "",
    notes: "",
    delivery_requested: false,
  })

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
      if (user) {
        checkIfFavorite(params.id as string)
        recordView(params.id as string)
      }
    }
  }, [params.id, user])

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true)
      console.log("Debug - Fetching product:", productId)
      
      // Get product document
      const productDoc = await getDoc(doc(db, 'products', productId))
      if (!productDoc.exists()) {
        throw new Error("Product not found")
      }
      
      const productData = productDoc.data() as ProductData
      
      // Get category data
      const categoryRef = doc(db, 'product_categories', productData.category_id)
      const categoryDoc = await getDoc(categoryRef)
      const categoryData = categoryDoc.exists() ? categoryDoc.data() : null
      
      // Get seller data
      const sellerRef = doc(db, 'users', productData.seller_id)
      const sellerDoc = await getDoc(sellerRef)
      const sellerData = sellerDoc.exists() ? sellerDoc.data() as SellerData : null
      
      // Get university data
      const universityRef = doc(db, 'universities', sellerData?.university_id || '')
      const universitySnapshot = await getDoc(universityRef)
      const universityData = universitySnapshot.exists() ? universitySnapshot.data() as UniversityData : null
      
      // Get product images
      const imagesQuery = query(
        collection(db, 'product_images'),
        where('product_id', '==', productId)
      )
      const imagesSnapshot = await getDocs(imagesQuery)
      const imagesData = imagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as { id: string; url: string; is_primary: boolean }[]

      const completeProductData: ProductDetails = {
        id: productDoc.id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        original_price: productData.original_price,
        condition: productData.condition,
        status: productData.status,
        brand: productData.brand,
        model: productData.model,
        pickup_location: productData.pickup_location,
        delivery_available: productData.delivery_available,
        delivery_fee: productData.delivery_fee,
        price_negotiable: productData.price_negotiable,
        views: productData.views,
        likes: productData.likes,
        created_at: productData.created_at,
        product_categories: categoryData ? {
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon
        } : {
          name: "Uncategorized",
          description: null,
          icon: "📦"
        },
        users: sellerData ? {
          id: sellerRef.id,
          full_name: sellerData.full_name,
          email: sellerData.email,
          avatar_url: sellerData.avatar_url,
          verified: sellerData.verified,
          whatsapp_number: sellerData.whatsapp_number,
          university_id: sellerData.university_id,
          student_id: sellerData.student_id,
          year_of_study: sellerData.year_of_study,
          course: sellerData.course
        } : {
          id: "",
          full_name: "Unknown Seller",
          email: "",
          avatar_url: null,
          verified: false,
          whatsapp_number: null,
          university_id: "",
          student_id: null,
          year_of_study: null,
          course: null
        },
        universities: universityData ? {
          name: universityData.name,
          location: universityData.location,
          type: universityData.type
        } : {
          name: "Unknown University",
          location: "Unknown",
          type: "Unknown"
        },
        product_images: imagesData.map(img => ({
          id: img.id,
          url: img.url as string,
          is_primary: img.is_primary as boolean
        }))
      }

      console.log("Debug - Complete product data:", completeProductData)
      setProduct(completeProductData)
      setOrderForm((prev) => ({ ...prev, pickup_location: String(completeProductData.pickup_location || "") }))

      // Fetch related products
      fetchRelatedProducts(completeProductData.product_categories.name, completeProductData.users.university_id, productId)
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error("Failed to load product details")
      router.push("/marketplace")
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (categoryName: string, universityId: string, excludeId: string) => {
    try {
      console.log("Debug - Fetching related products")
      const productsRef = collection(db, 'products')
      const productsQuery = query(
        productsRef,
        where('category_id', '==', categoryName),
        where('university_id', '==', universityId),
        where('status', '==', 'active')
      )
      
      const snapshot = await getDocs(productsQuery)
      const relatedProductsData = await Promise.all(
        snapshot.docs
          .filter(doc => doc.id !== excludeId)
          .slice(0, 4)
          .map(async (productDoc) => {
            const productData = productDoc.data() as ProductData
            
            // Get images
            const imagesQuery = query(
              collection(db, 'product_images'),
              where('product_id', '==', productDoc.id)
            )
            const imagesSnapshot = await getDocs(imagesQuery)
            const images = imagesSnapshot.docs.map(img => ({
              id: img.id,
              url: img.data().url as string,
              is_primary: img.data().is_primary as boolean
            }))
            
            // Get seller
            const sellerRef = doc(db, 'users', productData.seller_id)
            const sellerDoc = await getDoc(sellerRef)
            const sellerData = sellerDoc.exists() ? sellerDoc.data() as SellerData : null
            
            return {
              id: productDoc.id,
              ...productData,
              product_images: images,
              users: {
                full_name: sellerData?.full_name || "Unknown Seller"
              }
            }
          })
      )
      
      console.log("Debug - Related products:", relatedProductsData)
      setRelatedProducts(relatedProductsData)
    } catch (error) {
      console.error("Error fetching related products:", error)
    }
  }

  const recordView = async (productId: string) => {
    if (!user) return

    try {
      console.log("Debug - Recording view")
      // Record view in user_product_views collection
      await addDoc(collection(db, 'user_product_views'), {
          user_id: user.id,
          product_id: productId,
        viewed_at: serverTimestamp()
      })

      // Increment view count
      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, {
        views: increment(1)
      })
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }

  const checkIfFavorite = async (productId: string) => {
    if (!user) return

    try {
      console.log("Debug - Checking if favorite")
      const favoritesQuery = query(
        collection(db, 'user_favorites'),
        where('user_id', '==', user.id),
        where('product_id', '==', productId)
      )
      
      const snapshot = await getDocs(favoritesQuery)
      setIsFavorite(!snapshot.empty)
    } catch (error) {
      console.error("Error checking favorite:", error)
      setIsFavorite(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites")
      return
    }

    if (!product) return

    try {
      console.log("Debug - Toggling favorite")
      const favoritesQuery = query(
        collection(db, 'user_favorites'),
        where('user_id', '==', user.id),
        where('product_id', '==', product.id)
      )
      
      const snapshot = await getDocs(favoritesQuery)
      
      if (snapshot.empty) {
        // Add to favorites
        await addDoc(collection(db, 'user_favorites'), {
        user_id: user.id,
          product_id: product.id,
          created_at: serverTimestamp()
        })
        
        // Increment likes
        const productRef = doc(db, 'products', product.id)
        await updateDoc(productRef, {
          likes: increment(1)
        })
        
        setIsFavorite(true)
        setProduct(prev => prev ? { ...prev, likes: prev.likes + 1 } : null)
        toast.success("Added to favorites")
      } else {
        // Remove from favorites
        const favoriteDoc = snapshot.docs[0]
        await updateDoc(doc(db, 'user_favorites', favoriteDoc.id), {
          deleted_at: serverTimestamp()
        })
        
        // Decrement likes
        const productRef = doc(db, 'products', product.id)
        await updateDoc(productRef, {
          likes: increment(-1)
        })
        
        setIsFavorite(false)
        setProduct(prev => prev ? { ...prev, likes: prev.likes - 1 } : null)
        toast.success("Removed from favorites")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Failed to update favorites")
    }
  }

  const createOrder = async () => {
    if (!user || !product) {
      toast.error("Please log in to place an order")
      return
    }

    if (product.users.id === user.id) {
      toast.error("You cannot order your own product")
      return
    }

    try {
      console.log("Debug - Creating order")
      const totalAmount = product.price + (orderForm.delivery_requested ? product.delivery_fee : 0)

      // Create order
      const orderRef = await addDoc(collection(db, 'orders'), {
          buyer_id: user.id,
          seller_id: product.users.id,
          product_id: product.id,
          quantity: orderForm.quantity,
          total_amount: totalAmount,
          pickup_location: orderForm.pickup_location,
        pickup_time: orderForm.pickup_time ? new Date(orderForm.pickup_time) : null,
          notes: orderForm.notes,
          status: "pending",
        created_at: serverTimestamp()
        })

      // Send initial order message
      await addDoc(collection(db, 'order_messages'), {
        order_id: orderRef.id,
        sender_id: user.id,
        message: `Hi! I'd like to order your ${product.title}. ${orderForm.notes ? `Note: ${orderForm.notes}` : ""}`,
        created_at: serverTimestamp()
      })

      // Create notification for seller
      await addDoc(collection(db, 'notifications'), {
        user_id: product.users.id,
        title: "New Order Received",
        content: `${user.full_name} wants to buy your ${product.title}`,
        link: `/orders/${orderRef.id}`,
        type: "order",
        created_at: serverTimestamp(),
        read: false
      })

      toast.success("Order placed successfully!")
      setShowOrderDialog(false)
      router.push(`/orders/${orderRef.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to place order")
    }
  }

  const contactWhatsApp = () => {
    if (!product?.users?.whatsapp_number) {
      toast.error("WhatsApp number not available")
      return
    }

    const message = `Hi! I'm interested in your ${product.title} listed for $${product.price} on Campus Market. Is it still available?`
    const whatsappUrl = `https://wa.me/${product.users.whatsapp_number}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const startConversation = async () => {
    if (!user) {
      toast.error("Please log in to message sellers")
      return
    }

    if (!product) return

    if (product.users.id === user.id) {
      toast.error("You cannot message yourself")
      return
    }

    try {
      // Check if conversation exists
      const conversationsRef = collection(db, 'conversations')
      const conversationsQuery = query(
        conversationsRef,
        where('product_id', '==', product.id),
        where('participants', 'array-contains', user.id)
      )
      const conversationsSnapshot = await getDocs(conversationsQuery)

      if (!conversationsSnapshot.empty) {
        router.push(`/messages/${conversationsSnapshot.docs[0].id}`)
        return
      }

      // Create new conversation
      const conversationRef = await addDoc(collection(db, 'conversations'), {
          product_id: product.id,
        participants: [user.id, product.users.id],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
        })

      router.push(`/messages/${conversationRef.id}`)
    } catch (error) {
      console.error("Error starting conversation:", error)
      toast.error("Failed to start conversation")
    }
  }

  const shareProduct = async () => {
    const url = `${window.location.origin}/marketplace/products/${product?.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out this ${product?.title} for $${product?.price}`,
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

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const nextImage = () => {
    if (product?.product_images) {
      setCurrentImageIndex((prev) => (prev === product.product_images.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (product?.product_images) {
      setCurrentImageIndex((prev) => (prev === 0 ? product.product_images.length - 1 : prev - 1))
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images =
    product.product_images.length > 0
      ? product.product_images.sort((a, b) => (a.is_primary ? -1 : 1))
      : [{ id: "placeholder", url: "/placeholder.svg?height=400&width=400", is_primary: true }]

  const isOwner = user?.id === product.users.id
  const isSold = product.status === "sold"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 hover:bg-accent/50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={images[currentImageIndex]?.url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-lg backdrop-blur-sm"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-lg backdrop-blur-sm"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {isSold && (
                    <Badge variant="destructive" className="bg-destructive/90 backdrop-blur-sm">
                      Sold
                    </Badge>
                  )}
                  {product.delivery_available && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 backdrop-blur-sm">
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery Available
                    </Badge>
                  )}
                  {product.price_negotiable && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 backdrop-blur-sm">
                      💬 Negotiable
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {user ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-background/80 hover:bg-background shadow-lg backdrop-blur-sm"
                      onClick={toggleFavorite}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-background/80 hover:bg-background shadow-lg backdrop-blur-sm"
                      onClick={() => router.push('/login')}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-background/80 hover:bg-background shadow-lg backdrop-blur-sm"
                    onClick={shareProduct}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? "border-primary shadow-md ring-2 ring-primary/20" 
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Main Info */}
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {product.title}
                    </h1>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary">
                        {product.product_categories.icon} {product.product_categories.name}
                      </Badge>
                      <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                        {product.condition}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${product.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.original_price && product.original_price > product.price && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                        Save ${(product.original_price - product.price).toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{product.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{product.likes} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(formatDate(product.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const categoryKey = getCategoryKey(product.product_categories?.name);
                    if (!categoryKey) return <span className="text-muted-foreground">No extra details for this category.</span>;
                    return (CATEGORY_CONFIG as Record<CategoryKey, CategoryField[]>)[categoryKey as CategoryKey].map((field: CategoryField) => {
                      const value = (product as Record<string, any>)[field.name];
                      if (!value || ["title", "price", "description"].includes(field.name)) return null;
                      return (
                        <div key={field.name} className="flex flex-col">
                          <span className="font-medium text-muted-foreground">{field.label}</span>
                          <span className="text-base">{value}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                    <AvatarImage src={product.users.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {product.users.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{product.users.full_name}</h3>
                      {product.users.verified && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{product.universities.name}</span>
                        <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
                          {product.universities.type}
                        </Badge>
                      </div>
                      {product.users.course && (
                        <div className="flex items-center gap-2">
                          <span>📚 {product.users.course}</span>
                          {product.users.year_of_study && <span>• Year {product.users.year_of_study}</span>}
                        </div>
                      )}
                      {product.users.student_id && (
                        <div className="flex items-center gap-2">
                          <span>🆔 Student ID: {product.users.student_id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-primary/10"
                            onClick={() => copyToClipboard(product.users.student_id!, "Student ID")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* University Info */}
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  University
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <span className="font-medium">{
                    (product.universities && product.universities.name !== "Unknown University")
                      ? product.universities.name
                      : (getUniversityById(product.users.university_id)?.name || "Unknown University")
                  }</span>
                  <span className="text-muted-foreground">{
                    (product.universities && product.universities.name !== "Unknown University")
                      ? product.universities.location
                      : (getUniversityById(product.users.university_id)?.location || "Unknown")
                  }</span>
                  <Badge variant="secondary" className="w-fit mt-1">{
                    (product.universities && product.universities.name !== "Unknown University")
                      ? product.universities.type
                      : (getUniversityById(product.users.university_id)?.type || "Unknown")
                  }</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!isOwner && (
              <div className="grid grid-cols-1 gap-3">
                {product.users.whatsapp_number && (
                  <Button
                    onClick={contactWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors"
                    disabled={isSold}
                  >
                    <Phone className="h-4 w-4" />
                    Contact via WhatsApp
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {user ? (
                    <>
                      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors" 
                            disabled={isSold}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            {isSold ? "Sold Out" : "Place Order"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle>Place Order</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="quantity">Quantity</Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={orderForm.quantity}
                                onChange={(e) =>
                                  setOrderForm((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 1 }))
                                }
                                className="bg-background/50"
                              />
                            </div>

                            <div>
                              <Label htmlFor="pickup_location">Pickup Location</Label>
                              <Input
                                id="pickup_location"
                                value={orderForm.pickup_location}
                                onChange={(e) => setOrderForm((prev) => ({ ...prev, pickup_location: e.target.value }))}
                                placeholder="Where would you like to meet?"
                                className="bg-background/50"
                              />
                            </div>

                            <div>
                              <Label htmlFor="pickup_time">Preferred Pickup Time</Label>
                              <Input
                                id="pickup_time"
                                type="datetime-local"
                                value={orderForm.pickup_time}
                                onChange={(e) => setOrderForm((prev) => ({ ...prev, pickup_time: e.target.value }))}
                                className="bg-background/50"
                              />
                            </div>

                            {product.delivery_available && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="delivery_requested"
                                  checked={orderForm.delivery_requested}
                                  onChange={(e) =>
                                    setOrderForm((prev) => ({ ...prev, delivery_requested: e.target.checked }))
                                  }
                                  className="rounded border-primary/50"
                                />
                                <Label htmlFor="delivery_requested">
                                  Request delivery (+${product.delivery_fee.toFixed(2)})
                                </Label>
                              </div>
                            )}

                            <div>
                              <Label htmlFor="notes">Additional Notes</Label>
                              <Textarea
                                id="notes"
                                value={orderForm.notes}
                                onChange={(e) => setOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Any special requests or questions?"
                                className="bg-background/50"
                              />
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg backdrop-blur-sm">
                              <div className="flex justify-between items-center">
                                <span>Subtotal:</span>
                                <span>${(product.price * orderForm.quantity).toFixed(2)}</span>
                              </div>
                              {orderForm.delivery_requested && (
                                <div className="flex justify-between items-center">
                                  <span>Delivery:</span>
                                  <span>${product.delivery_fee.toFixed(2)}</span>
                                </div>
                              )}
                              <Separator className="my-2" />
                              <div className="flex justify-between items-center font-semibold">
                                <span>Total:</span>
                                <span>
                                  $
                                  {(
                                    product.price * orderForm.quantity +
                                    (orderForm.delivery_requested ? product.delivery_fee : 0)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <Button 
                              onClick={createOrder} 
                              className="w-full bg-primary hover:bg-primary/90 transition-colors"
                            >
                              Confirm Order
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="outline" 
                        onClick={startConversation} 
                        className="flex items-center gap-2 border-primary/50 hover:bg-primary/10 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => router.push('/login')} className="w-full bg-primary hover:bg-primary/90 transition-colors">
                        Sign in to order
                      </Button>
                      <Button onClick={() => router.push('/login')} className="flex items-center gap-2 border-primary/50 hover:bg-primary/10 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Report Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Flag className="h-4 w-4 mr-2" />
              Report this listing
            </Button>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12 space-y-8">
          {/* Description */}
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {product.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Category</h4>
                  <p className="flex items-center gap-2">
                    {(product.product_categories && product.product_categories.icon) ? product.product_categories.icon : null} {product.product_categories && product.product_categories.name ? product.product_categories.name : "Uncategorized"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Condition</h4>
                  <p>{product.condition}</p>
                </div>
                {product.brand && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Brand</h4>
                    <p>{product.brand}</p>
                  </div>
                )}
                {product.model && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Model</h4>
                    <p>{product.model}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Pickup Location</h4>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {product.pickup_location}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">University</h4>
                  <p>{
                    (product.universities && product.universities.name !== "Unknown University")
                      ? product.universities.name
                      : (getUniversityById(product.users.university_id)?.name || "Unknown University")
                  }</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle>Related Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <Link key={relatedProduct.id} href={`/marketplace/products/${relatedProduct.id}`}>
                      <Card className="hover:shadow-md transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm border-0">
                        <CardContent className="p-3">
                          <div className="aspect-square overflow-hidden rounded-md mb-2">
                            <img
                              src={
                                relatedProduct.product_images?.find((img: any) => img.is_primary)?.url ||
                                "/placeholder.svg?height=150&width=150" ||
                                "/placeholder.svg"
                              }
                              alt={relatedProduct.title}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">{relatedProduct.title}</h4>
                          <p className="text-sm font-bold text-primary">${relatedProduct.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{relatedProduct.users.full_name}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
