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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Shield,
  Copy,
  CheckCircle2,
  Star,
  StarHalf,
  ThumbsUp,
  ThumbsDown,
  Filter,
  TrendingUp,
  Award,
  Verified,
  Calendar,
  Package,
  Zap,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Import local university data
import ZIM_UNIVERSITIES from "@/utils/schools_data"
import { CATEGORY_CONFIG, type CategoryKey, type CategoryField } from "@/lib/category-config"
import { CATEGORY_META } from "@/lib/category-config";
import { LucideIcon } from "lucide-react";

// At the top, import the config (or copy the config if import is not possible):
// import categoryFieldConfig from "@/marketplace/sell/page";

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
  category_id: string // <-- add this line
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
  specifications?: Record<string, any>
  tags?: string[]
}

interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  title: string
  comment: string
  created_at: any
  helpful_count: number
  user: {
    full_name: string
    avatar_url: string | null
    verified: boolean
  }
}

interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution: { [key: number]: number }
}

interface SellerData {
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

interface UniversityData {
  name: string
  location: string
  type: string
}

interface ProductData {
  seller_id: string
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
  category_id: string
}

const formatDate = (date: any) => {
  if (!date) return "Unknown date"
  if (date.toDate) return date.toDate()
  return new Date(date)
}

// Helper to get university by id
function getUniversityById(id: string) {
  return ZIM_UNIVERSITIES.find((u) => u.id === id)
}

// Helper to map display name to config key
function getCategoryKey(name: string): CategoryKey | undefined {
  if (!name) return undefined
  const key = name.trim().toLowerCase()
  const validKeys: CategoryKey[] = [
    "electronics",
    "fashion",
    "home & garden",
    "books & media",
    "beauty & personal care",
    "sports & outdoors",
    "toys & games",
    "groceries",
    "automotive",
    "health & wellness",
    "jewelry & accessories",
    "office & school",
    "baby & kids",
    "pet supplies",
    "gifts & occasions",
    "music & instruments",
    "watches",
    "cameras",
    "gaming",
    "health & beauty",
    "travel & luggage",
    "furniture",
    "weddings & events",
    "tv & audio",
    "phones & tablets",
    "bikes & scooters",
    "tools & diy",
    "bags & wallets",
    "shoes",
    "other",
  ]
  if (validKeys.includes(key as CategoryKey)) {
    return key as CategoryKey
  }
  return undefined
}

// Helper to get category meta by category_id (handles capitalization)
function getCategoryMeta(category_id: string) {
  if (!category_id) return CATEGORY_META.find(cat => cat.key === 'other');
  const key = category_id.trim().toLowerCase();
  return CATEGORY_META.find(cat => cat.key === key || cat.label.toLowerCase() === key) || CATEGORY_META.find(cat => cat.key === 'other');
}

// Helper to get icon for a field (optional, fallback to generic icon)
function getFieldIcon(fieldName: string, categoryKey: string): LucideIcon | undefined {
  // Optionally, you can define a mapping for field icons per field name
  // For now, fallback to the category icon for all fields
  const meta = CATEGORY_META.find(cat => cat.key === categoryKey);
  return meta?.icon;
}

// Star Rating Component
const StarRating = ({
  rating,
  size = "sm",
  showValue = false,
  interactive = false,
  onRatingChange,
}: {
  rating: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const renderStar = (index: number) => {
    const starValue = index + 1
    const currentRating = interactive ? hoverRating || rating : rating
    const isFilled = currentRating >= starValue
    const isHalfFilled = currentRating >= starValue - 0.5 && currentRating < starValue

    return (
      <button
        key={index}
        type="button"
        className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-all duration-200`}
        onClick={() => interactive && onRatingChange?.(starValue)}
        onMouseEnter={() => interactive && setHoverRating(starValue)}
        onMouseLeave={() => interactive && setHoverRating(0)}
        disabled={!interactive}
      >
        {isFilled ? (
          <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
        ) : isHalfFilled ? (
          <StarHalf className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
        ) : (
          <Star className={`${sizeClasses[size]} text-gray-300`} />
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{[0, 1, 2, 3, 4].map(renderStar)}</div>
      {showValue && <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>}
    </div>
  )
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
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: {},
  })
  const [reviewFilter, setReviewFilter] = useState<string>("all")
  const [reviewSort, setReviewSort] = useState<string>("newest")
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    pickup_location: "",
    pickup_time: "",
    notes: "",
    delivery_requested: false,
  })
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    comment: "",
  })
  // Add state for editing and deleting reviews
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 0, title: '', comment: '' });
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
      fetchReviews(params.id as string)
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
      const productDoc = await getDoc(doc(db, "products", productId))
      if (!productDoc.exists()) {
        throw new Error("Product not found")
      }
      
      const productData = productDoc.data() as ProductData
      
      // Get category data
      const categoryRef = doc(db, "product_categories", productData.category_id)
      const categoryDoc = await getDoc(categoryRef)
      const categoryData = categoryDoc.exists() ? categoryDoc.data() : null
      
      // Get seller data
      const sellerRef = doc(db, "users", productData.seller_id)
      const sellerDoc = await getDoc(sellerRef)
      const sellerData = sellerDoc.exists() ? (sellerDoc.data() as SellerData) : null
      
      // Get university data
      const universityRef = doc(db, "universities", sellerData?.university_id || "")
      const universitySnapshot = await getDoc(universityRef)
      const universityData = universitySnapshot.exists() ? (universitySnapshot.data() as UniversityData) : null
      
      // Get product images
      const imagesQuery = query(collection(db, "product_images"), where("product_id", "==", productId))
      const imagesSnapshot = await getDocs(imagesQuery)
      const imagesData = imagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
        category_id: productData.category_id,
        product_categories: categoryData
          ? {
          name: categoryData.name,
          description: categoryData.description,
              icon: categoryData.icon,
            }
          : {
          name: "Uncategorized",
          description: null,
              icon: "📦",
        },
        users: sellerData
          ? {
          id: sellerRef.id,
          full_name: sellerData.full_name,
          email: sellerData.email,
          avatar_url: sellerData.avatar_url,
          verified: sellerData.verified,
          whatsapp_number: sellerData.whatsapp_number,
          university_id: sellerData.university_id,
          student_id: sellerData.student_id,
          year_of_study: sellerData.year_of_study,
              course: sellerData.course,
            }
          : {
          id: "",
          full_name: "Unknown Seller",
          email: "",
          avatar_url: null,
          verified: false,
          whatsapp_number: null,
          university_id: "",
          student_id: null,
          year_of_study: null,
              course: null,
        },
        universities: universityData
          ? {
          name: universityData.name,
          location: universityData.location,
              type: universityData.type,
            }
          : {
          name: "Unknown University",
          location: "Unknown",
              type: "Unknown",
        },
        product_images: imagesData.map((img) => ({
          id: img.id,
          url: img.url as string,
          is_primary: img.is_primary as boolean,
        })),
      }

      console.log("Debug - Complete product data:", completeProductData)
      setProduct(completeProductData)
      setOrderForm((prev) => ({ ...prev, pickup_location: String(completeProductData.pickup_location || "") }))

      // Fetch related products
      fetchRelatedProducts(
        completeProductData.product_categories.name,
        completeProductData.users.university_id,
        productId,
      )
    } catch (error) {
      console.error("Error fetching product:", error)
      toast.error("Failed to load product details")
      router.push("/marketplace")
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (productId: string) => {
    try {
      console.log("Debug - Fetching reviews for product:", productId)

      // Get reviews
      const reviewsQuery = query(
        collection(db, "product_reviews"),
        where("product_id", "==", productId),
        orderBy("created_at", "desc"),
      )
      const reviewsSnapshot = await getDocs(reviewsQuery)

      const reviewsData = await Promise.all(
        reviewsSnapshot.docs.map(async (reviewDoc) => {
          const reviewData = reviewDoc.data()

          // Get user data for each review
          const userRef = doc(db, "users", reviewData.user_id)
          const userDoc = await getDoc(userRef)
          const userData = userDoc.exists() ? userDoc.data() : null

          return {
            id: reviewDoc.id,
            ...reviewData,
            user: {
              full_name: userData?.full_name || "Anonymous",
              avatar_url: userData?.avatar_url || null,
              verified: userData?.verified || false,
            },
          } as Review
        }),
      )

      setReviews(reviewsData)

      // Calculate review statistics
      const stats = calculateReviewStats(reviewsData)
      setReviewStats(stats)
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const calculateReviewStats = (reviews: Review[]): ReviewStats => {
    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: {},
      }
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    const distribution: { [key: number]: number } = {}
    for (let i = 1; i <= 5; i++) {
      distribution[i] = reviews.filter((review) => review.rating === i).length
    }

    return {
      average_rating: averageRating,
      total_reviews: reviews.length,
      rating_distribution: distribution,
    }
  }

  const fetchRelatedProducts = async (categoryName: string, universityId: string, excludeId: string) => {
    try {
      console.log("Debug - Fetching related products")
      const productsRef = collection(db, "products")
      const productsQuery = query(
        productsRef,
        where("category_id", "==", categoryName),
        where("university_id", "==", universityId),
        where("status", "==", "active"),
        limit(4),
      )
      
      const snapshot = await getDocs(productsQuery)
      const relatedProductsData = await Promise.all(
        snapshot.docs
          .filter((doc) => doc.id !== excludeId)
          .slice(0, 4)
          .map(async (productDoc) => {
            const productData = productDoc.data() as ProductData
            
            // Get images
            const imagesQuery = query(collection(db, "product_images"), where("product_id", "==", productDoc.id))
            const imagesSnapshot = await getDocs(imagesQuery)
            const images = imagesSnapshot.docs.map((img) => ({
              id: img.id,
              url: img.data().url as string,
              is_primary: img.data().is_primary as boolean,
            }))
            
            // Get seller
            const sellerRef = doc(db, "users", productData.seller_id)
            const sellerDoc = await getDoc(sellerRef)
            const sellerData = sellerDoc.exists() ? (sellerDoc.data() as SellerData) : null
            
            return {
              id: productDoc.id,
              ...productData,
              product_images: images,
              users: {
                full_name: sellerData?.full_name || "Unknown Seller",
              },
              }
          }),
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
      await addDoc(collection(db, "user_product_views"), {
          user_id: user.id,
          product_id: productId,
        viewed_at: serverTimestamp(),
      })

      // Increment view count
      const productRef = doc(db, "products", productId)
      await updateDoc(productRef, {
        views: increment(1),
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
        collection(db, "user_favorites"),
        where("user_id", "==", user.id),
        where("product_id", "==", productId),
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
        collection(db, "user_favorites"),
        where("user_id", "==", user.id),
        where("product_id", "==", product.id),
      )
      
      const snapshot = await getDocs(favoritesQuery)
      
      if (snapshot.empty) {
        // Add to favorites
        await addDoc(collection(db, "user_favorites"), {
        user_id: user.id,
          product_id: product.id,
          created_at: serverTimestamp(),
        })
        
        // Increment likes
        const productRef = doc(db, "products", product.id)
        await updateDoc(productRef, {
          likes: increment(1),
        })
        
        setIsFavorite(true)
        setProduct((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null))
        toast.success("Added to favorites")
      } else {
        // Remove from favorites
        const favoriteDoc = snapshot.docs[0]
        await updateDoc(doc(db, "user_favorites", favoriteDoc.id), {
          deleted_at: serverTimestamp(),
        })
        
        // Decrement likes
        const productRef = doc(db, "products", product.id)
        await updateDoc(productRef, {
          likes: increment(-1),
        })
        
        setIsFavorite(false)
        setProduct((prev) => (prev ? { ...prev, likes: prev.likes - 1 } : null))
        toast.success("Removed from favorites")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Failed to update favorites")
    }
  }

  const submitReview = async () => {
    if (!user) {
      toast.error("Please log in to submit a review")
      return
    }
    if (!product) return
    if (product.users.id === user.id) {
      toast.error("You cannot review your own product")
      return
    }
    if (reviewForm.rating === 0) {
      toast.error("Please select a rating")
      return
    }
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      // Check if user already reviewed this product
      const existingReviewQuery = query(
        collection(db, "product_reviews"),
        where("user_id", "==", user.id),
        where("product_id", "==", product.id),
      )
      const existingReviewSnapshot = await getDocs(existingReviewQuery)

      if (!existingReviewSnapshot.empty) {
        toast.error("You have already reviewed this product")
        return
      }

      // Create review
      await addDoc(collection(db, "product_reviews"), {
        user_id: user.id,
        product_id: product.id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
        helpful_count: 0,
        created_at: serverTimestamp(),
      })

      // Create notification for seller
      await addDoc(collection(db, "notifications"), {
        user_id: product.users.id,
        title: "New Product Review",
        content: `${user.full_name} reviewed your ${product.title}`,
        link: `/marketplace/products/${product.id}`,
        type: "review",
        created_at: serverTimestamp(),
        read: false,
      })

      toast.success("Review submitted successfully!")
      setShowReviewDialog(false)
      setReviewForm({ rating: 0, title: "", comment: "" })

      // Refresh reviews
      fetchReviews(product.id)
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review")
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
      const orderRef = await addDoc(collection(db, "orders"), {
          buyer_id: user.id,
          seller_id: product.users.id,
          product_id: product.id,
          quantity: orderForm.quantity,
          total_amount: totalAmount,
          pickup_location: orderForm.pickup_location,
        pickup_time: orderForm.pickup_time ? new Date(orderForm.pickup_time) : null,
          notes: orderForm.notes,
          status: "pending",
        created_at: serverTimestamp(),
        })

      // Send initial order message
      await addDoc(collection(db, "order_messages"), {
        order_id: orderRef.id,
        sender_id: user.id,
        message: `Hi! I'd like to order your ${product.title}. ${orderForm.notes ? `Note: ${orderForm.notes}` : ""}`,
        created_at: serverTimestamp(),
      })

      // Create notification for seller
      await addDoc(collection(db, "notifications"), {
        user_id: product.users.id,
        title: "New Order Received",
        content: `${user.full_name} wants to buy your ${product.title}`,
        link: `/orders/${orderRef.id}`,
        type: "order",
        created_at: serverTimestamp(),
        read: false,
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
      const conversationsRef = collection(db, "conversations")
      const conversationsQuery = query(
        conversationsRef,
        where("product_id", "==", product.id),
        where("participants", "array-contains", user.id),
      )
      const conversationsSnapshot = await getDocs(conversationsQuery)

      if (!conversationsSnapshot.empty) {
        router.push(`/messages/${conversationsSnapshot.docs[0].id}`)
        return
      }

      // Create new conversation
      const conversationRef = await addDoc(collection(db, "conversations"), {
          product_id: product.id,
        participants: [user.id, product.users.id],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
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

  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === "all") return true
    return review.rating === Number.parseInt(reviewFilter)
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (reviewSort) {
      case "oldest":
        return formatDate(a.created_at).getTime() - formatDate(b.created_at).getTime()
      case "highest":
        return b.rating - a.rating
      case "lowest":
        return a.rating - b.rating
      case "helpful":
        return b.helpful_count - a.helpful_count
      default: // newest
        return formatDate(b.created_at).getTime() - formatDate(a.created_at).getTime()
    }
  })

  // Add edit and delete handlers
  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditForm({ rating: review.rating, title: review.title, comment: review.comment });
  };
  const handleEditFormChange = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditReviewSubmit = async (reviewId: string) => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const reviewRef = doc(db, 'product_reviews', reviewId);
      await updateDoc(reviewRef, {
        rating: editForm.rating,
        title: editForm.title,
        comment: editForm.comment,
      });
      setEditingReviewId(null);
      if (product) fetchReviews(product.id);
      toast.success('Review updated!');
    } catch (err) {
      setReviewError('Failed to update review.');
    } finally {
      setReviewLoading(false);
    }
  };
  const handleDeleteReview = async (reviewId: string) => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      await updateDoc(doc(db, 'product_reviews', reviewId), { deleted_at: serverTimestamp() });
      setDeletingReviewId(null);
      if (product) fetchReviews(product.id);
      toast.success('Review deleted!');
    } catch (err) {
      setReviewError('Failed to delete review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
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
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
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
      </div>
    )
  }

  const images =
    product.product_images.length > 0
      ? product.product_images.sort((a, b) => (a.is_primary ? -1 : 1))
      : [{ id: "placeholder", url: "/placeholder.svg?height=400&width=400", is_primary: true }]

  const isOwner = user?.id === product.users.id
  const isSold = product.status === "sold"

  // Use category_id if available, otherwise fallback to product_categories.name
  const category = getCategoryMeta(product?.category_id || product?.product_categories?.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 hover:bg-accent/50 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={images[currentImageIndex]?.url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />

                {/* Enhanced Navigation */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-xl backdrop-blur-sm border-0 hover:scale-110 transition-all duration-300"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-xl backdrop-blur-sm border-0 hover:scale-110 transition-all duration-300"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Enhanced Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {isSold && (
                    <Badge variant="destructive" className="bg-destructive/90 backdrop-blur-sm shadow-lg animate-pulse">
                      <Package className="h-3 w-3 mr-1" />
                      Sold
                    </Badge>
                  )}
                  {product.delivery_available && (
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-600 backdrop-blur-sm shadow-lg border-green-500/30"
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery Available
                    </Badge>
                  )}
                  {product.price_negotiable && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-500/20 text-blue-600 backdrop-blur-sm shadow-lg border-blue-500/30"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Negotiable
                    </Badge>
                  )}
                </div>

                {/* Enhanced Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {user ? (
                  <Button
                    variant="secondary"
                    size="icon"
                      className="bg-background/90 hover:bg-background shadow-xl backdrop-blur-sm border-0 hover:scale-110 transition-all duration-300"
                    onClick={toggleFavorite}
                  >
                      <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                      className="bg-background/90 hover:bg-background shadow-xl backdrop-blur-sm border-0 hover:scale-110 transition-all duration-300"
                      onClick={() => router.push("/login")}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-background/90 hover:bg-background shadow-xl backdrop-blur-sm border-0 hover:scale-110 transition-all duration-300"
                    onClick={shareProduct}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm shadow-lg">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            </Card>

            {/* Enhanced Thumbnail Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                      index === currentImageIndex 
                        ? "border-primary shadow-lg ring-4 ring-primary/20 scale-105"
                        : "border-transparent hover:border-primary/50 shadow-md"
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

          {/* Enhanced Product Details */}
          <div className="space-y-6">
            {/* Enhanced Main Info */}
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
                      {product.title}
                    </h1>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 text-sm"
                      >
                        {category?.icon && <category.icon className="h-4 w-4 mr-1" />} {category ? category.label : "Uncategorized"}
                      </Badge>
                      <Badge variant="outline" className="bg-background/50 backdrop-blur-sm px-3 py-1">
                        {product.condition}
                      </Badge>
                      {product.users.verified && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600 border-green-500/30 px-3 py-1"
                        >
                          <Verified className="h-3 w-3 mr-1" />
                          Verified Seller
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Rating Display */}
                  {reviewStats.total_reviews > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <StarRating rating={reviewStats.average_rating} size="md" showValue />
                      <span className="text-sm text-muted-foreground">
                        ({reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? "s" : ""})
                      </span>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                        <Award className="h-3 w-3 mr-1" />
                        {reviewStats.average_rating.toFixed(1)} stars
                      </Badge>
                    </div>
                  )}

                  {/* Enhanced Price Display */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xl text-muted-foreground line-through">
                          ${product.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.original_price && product.original_price > product.price && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-600 px-3 py-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Save ${(product.original_price - product.price).toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced Stats */}
                  <div className="flex items-center gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Eye className="h-4 w-4" />
                      <span>{product.views} views</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Heart className="h-4 w-4" />
                      <span>{product.likes} likes</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(formatDate(product.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Seller Info */}
            <Card className="bg-card/80 border-0 shadow-2xl rounded-xl mb-8">
  <CardHeader className="pb-2 border-b border-muted/30 flex flex-row items-center gap-3">
    <Shield className="h-6 w-6 text-primary" />
    <CardTitle className="text-xl font-bold tracking-tight">Seller Information</CardTitle>
  </CardHeader>
  <CardContent className="flex items-center gap-6 py-6">
    <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-lg">
      <AvatarImage src={product.users.avatar_url || undefined} />
      <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
        {product.users.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-3 mb-1">
        <h3 className="font-bold text-xl text-foreground">{product.users.full_name}</h3>
        {product.users.verified && (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-500/30 flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {product.users.university_id && product.users.university_id !== "" && (
          <>
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {product.universities && product.universities.name !== "Unknown University"
                ? product.universities.name
                : getUniversityById(product.users.university_id)?.name || "Unknown University"}
            </span>
            {product.universities && product.universities.type && product.universities.type !== "Unknown" && (
              <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
                {product.universities.type}
              </Badge>
            )}
          </>
        )}
        {product.users.course && (
          <>
            <span>•</span>
            <span>📚 {product.users.course}</span>
            {product.users.year_of_study && <span>• Year {product.users.year_of_study}</span>}
          </>
        )}
      </div>
    </div>
  </CardContent>
</Card>

            {/* Enhanced Action Buttons */}
            {!isOwner && (
              <div className="space-y-4">
                {product.users.whatsapp_number && (
                  <Button
                    onClick={contactWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-3 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                    disabled={isSold}
                  >
                    <Phone className="h-5 w-5" />
                    Contact via WhatsApp
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {user ? (
                    <>
                  <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                    <DialogTrigger asChild>
                      <Button 
                            className="flex items-center gap-3 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 py-6 text-lg font-semibold shadow-lg"
                        disabled={isSold}
                      >
                            <ShoppingCart className="h-5 w-5" />
                        {isSold ? "Sold Out" : "Place Order"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm">
                      <DialogHeader>
                            <DialogTitle className="text-xl">Place Order</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                              <Label htmlFor="quantity" className="text-sm font-medium">
                                Quantity
                              </Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={orderForm.quantity}
                            onChange={(e) =>
                              setOrderForm((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 1 }))
                            }
                                className="bg-background/50 mt-1"
                          />
                        </div>
                        <div>
                              <Label htmlFor="pickup_location" className="text-sm font-medium">
                                Pickup Location
                              </Label>
                          <Input
                            id="pickup_location"
                            value={orderForm.pickup_location}
                            onChange={(e) => setOrderForm((prev) => ({ ...prev, pickup_location: e.target.value }))}
                            placeholder="Where would you like to meet?"
                                className="bg-background/50 mt-1"
                          />
                        </div>
                        <div>
                              <Label htmlFor="pickup_time" className="text-sm font-medium">
                                Preferred Pickup Time
                              </Label>
                          <Input
                            id="pickup_time"
                            type="datetime-local"
                            value={orderForm.pickup_time}
                            onChange={(e) => setOrderForm((prev) => ({ ...prev, pickup_time: e.target.value }))}
                                className="bg-background/50 mt-1"
                          />
                        </div>
                        {product.delivery_available && (
                              <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                            <input
                              type="checkbox"
                              id="delivery_requested"
                              checked={orderForm.delivery_requested}
                              onChange={(e) =>
                                setOrderForm((prev) => ({ ...prev, delivery_requested: e.target.checked }))
                              }
                              className="rounded border-primary/50"
                            />
                                <Label htmlFor="delivery_requested" className="text-sm">
                              Request delivery (+${product.delivery_fee.toFixed(2)})
                            </Label>
                          </div>
                        )}
                        <div>
                              <Label htmlFor="notes" className="text-sm font-medium">
                                Additional Notes
                              </Label>
                          <Textarea
                            id="notes"
                            value={orderForm.notes}
                            onChange={(e) => setOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any special requests or questions?"
                                className="bg-background/50 mt-1"
                          />
                        </div>
                            <div className="bg-muted/50 p-4 rounded-lg backdrop-blur-sm">
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
                              <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total:</span>
                                <span className="text-primary">
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
                              className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 py-3 text-lg font-semibold"
                        >
                          Confirm Order
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    onClick={startConversation} 
                        className="flex items-center gap-3 border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 py-6 text-lg font-semibold shadow-lg bg-transparent"
                  >
                        <MessageSquare className="h-5 w-5" />
                    Message
                  </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => router.push("/login")}
                        className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 py-6 text-lg font-semibold shadow-lg"
                      >
                        Sign in to order
                      </Button>
                      <Button
                        onClick={() => router.push("/login")}
                        variant="outline"
                        className="border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 py-6 text-lg font-semibold shadow-lg"
                      >
                        <MessageSquare className="h-5 w-5 mr-2" />
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
              className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 bg-transparent"
            >
              <Flag className="h-4 w-4 mr-2" />
              Report this listing
            </Button>
          </div>
        </div>

        {/* Enhanced Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Reviews ({reviewStats.total_reviews})
              </TabsTrigger>
              <TabsTrigger
                value="related"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Related
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                  <CardTitle className="text-xl">Product Description</CardTitle>
            </CardHeader>
            <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-lg">
                {product.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
            </TabsContent>

            {/* Use CATEGORY_CONFIG for dynamic details rendering */}
            <TabsContent value="details" className="mt-6">
              <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
                  <CardTitle className="text-xl">Product Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const categoryKey = (product.category_id || "").toLowerCase() as keyof typeof CATEGORY_CONFIG;
                  const fields = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG["other"];
                  return fields.map((field: any) => {
                    // Always skip title, price, description (shown elsewhere)
                    if (["title", "price", "description"].includes(field.name)) return null;
                    // Try to get value from top-level, then from specifications, then from tags
                    let value = (product as any)[field.name];
                    if (value == null && product.specifications?.[field.name]) {
                      value = product.specifications?.[field.name];
                    }
                    if (value == null && field.name === "tags" && Array.isArray(product.tags)) {
                      value = product.tags?.join(", ");
                    }
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    const Icon = getFieldIcon(field.name, categoryKey);
                    return (
                      <div key={field.name} className="p-4 bg-muted/30 rounded-lg flex items-center gap-4">
                        {Icon && <Icon className="h-6 w-6 text-primary/70" />}
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            {field.label}
                          </h4>
                          <p className="text-lg text-foreground">
                            {Array.isArray(value) ? value.join(", ") : value}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                {/* Review Summary */}
                {reviewStats.total_reviews > 0 && (
                  <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                      <CardTitle className="text-xl">Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-primary mb-2">
                            {reviewStats.average_rating.toFixed(1)}
                          </div>
                          <StarRating rating={reviewStats.average_rating} size="lg" />
                          <p className="text-muted-foreground mt-2">
                            Based on {reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-3">
                              <span className="text-sm w-8">{rating} ★</span>
                              <Progress
                                value={
                                  ((reviewStats.rating_distribution[rating] || 0) / reviewStats.total_reviews) * 100
                                }
                                className="flex-1 h-2"
                              />
                              <span className="text-sm text-muted-foreground w-8">
                                {reviewStats.rating_distribution[rating] || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Write Review Button */}
                {user && !isOwner && !reviews.some(r => r.user_id === user.id) && (
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 py-6 text-lg font-semibold shadow-lg">
                        <Star className="h-5 w-5 mr-2" />
                        Write a Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle className="text-xl">Write a Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Rating</Label>
                          <div className="mt-2">
                            <StarRating
                              rating={reviewForm.rating}
                              size="lg"
                              interactive
                              onRatingChange={(rating) => setReviewForm((prev) => ({ ...prev, rating }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="review_title" className="text-sm font-medium">
                            Review Title
                          </Label>
                          <Input
                            id="review_title"
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Summarize your experience"
                            className="bg-background/50 mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="review_comment" className="text-sm font-medium">
                            Your Review
                          </Label>
                          <Textarea
                            id="review_comment"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                            placeholder="Share your thoughts about this product..."
                            className="bg-background/50 mt-1"
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={submitReview}
                          className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 py-3 text-lg font-semibold"
                          disabled={reviewForm.rating === 0 || !reviewForm.title.trim() || !reviewForm.comment.trim()}
                        >
                          Submit Review
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {/* Review List with edit/delete and highlight for user's own review */}
                <div className="space-y-4">
                  {reviewLoading && <div className="text-center text-muted-foreground">Loading reviews...</div>}
                  {reviewError && <div className="text-center text-destructive">{reviewError}</div>}
                  {!reviewLoading && sortedReviews.length === 0 && (
                    <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
                      <CardContent className="p-8 text-center">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                        <p className="text-muted-foreground">
                          Be the first to review this product and help other buyers make informed decisions.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {sortedReviews.map((review) => {
                    const isUserReview = user && review.user_id === user.id;
                    if (editingReviewId === review.id) {
                      // Edit form for user's review
                      return (
                        <Card key={review.id} className="bg-card/50 border-primary/50 border-2 shadow-xl">
                          <CardContent className="p-6">
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Rating</Label>
                              <StarRating
                                rating={editForm.rating}
                                size="lg"
                                interactive
                                onRatingChange={(rating) => handleEditFormChange('rating', rating)}
                              />
                            </div>
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Title</Label>
                              <Input
                                value={editForm.title}
                                onChange={(e) => handleEditFormChange('title', e.target.value)}
                              />
                            </div>
                            <div className="mb-3">
                              <Label className="text-sm font-medium">Comment</Label>
                              <Textarea
                                value={editForm.comment}
                                onChange={(e) => handleEditFormChange('comment', e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditReviewSubmit(review.id)}
                                disabled={reviewLoading}
                                className="bg-primary"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setEditingReviewId(null)}
                                disabled={reviewLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                            {reviewError && <div className="text-destructive mt-2">{reviewError}</div>}
                          </CardContent>
                        </Card>
                      );
                    }
                    if (deletingReviewId === review.id) {
                      // Confirm delete UI
                      return (
                        <Card key={review.id} className="bg-card/50 border-destructive/50 border-2 shadow-xl">
                          <CardContent className="p-6 text-center">
                            <p>Are you sure you want to delete your review?</p>
                            <div className="flex gap-2 justify-center mt-4">
                              <Button
                                onClick={() => handleDeleteReview(review.id)}
                                disabled={reviewLoading}
                                className="bg-destructive"
                              >
                                Delete
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setDeletingReviewId(null)}
                                disabled={reviewLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                            {reviewError && <div className="text-destructive mt-2">{reviewError}</div>}
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <Card
                        key={review.id}
                        className={`bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${isUserReview ? 'ring-2 ring-primary' : ''}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                              <AvatarImage src={review.user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {review.user.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">{review.user.full_name}</h4>
                                {review.user.verified && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-500/10 text-green-600 border-green-500/30"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(formatDate(review.created_at), { addSuffix: true })}
                                </span>
                                {isUserReview && <Badge className="ml-2 bg-primary/10 text-primary">Your Review</Badge>}
                              </div>
                              <div className="mb-3">
                                <StarRating rating={review.rating} size="sm" />
                              </div>
                              <h5 className="font-semibold mb-2">{review.title}</h5>
                              <p className="text-muted-foreground leading-relaxed mb-4">{review.comment}</p>
                              {isUserReview && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditReview(review)}
                                    className="text-primary border-primary/30"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeletingReviewId(review.id)}
                                    className="text-destructive border-destructive/30"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="related" className="mt-6">
              {relatedProducts.length > 0 ? (
                <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Related Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <Link key={relatedProduct.id} href={`/marketplace/products/${relatedProduct.id}`}>
                          <Card className="hover:shadow-xl transition-all duration-500 cursor-pointer bg-card/50 backdrop-blur-sm border-0 group">
                            <CardContent className="p-4">
                              <div className="aspect-square overflow-hidden rounded-lg mb-3">
                            <img
                              src={
                                relatedProduct.product_images?.find((img: any) => img.is_primary)?.url ||
                                    "/placeholder.svg?height=200&width=200" ||
                                "/placeholder.svg"
                              }
                              alt={relatedProduct.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                              <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                {relatedProduct.title}
                              </h4>
                              <p className="text-lg font-bold text-primary mb-1">${relatedProduct.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{relatedProduct.users.full_name}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No related products</h3>
                    <p className="text-muted-foreground">We couldn't find any similar products at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
