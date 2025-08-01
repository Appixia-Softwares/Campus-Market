"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Eye, Heart, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { collection, query, where, getDocs, deleteDoc, updateDoc, doc, orderBy, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ProtectedRoute } from "@/components/protected-route"
import DeleteListingButton from "@/components/DeleteListingButton"

const formatDate = (date: any) => {
  if (!date) return 'Unknown date'
  if (date.toDate) return date.toDate()
  return new Date(date)
}

interface Product {
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
  } | null
  product_images: {
    url: string
  }[]
}

interface CategoryData {
  name: string;
  description?: string;
  icon?: string;
}

interface ProductData {
  category_id: string;
  title: string;
  description: string | null;
  price: number;
  condition: string;
  status: string;
  views: number;
  likes: number;
  created_at: string;
}

function MyListingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchMyProducts()
    }
  }, [user])

  const fetchMyProducts = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch products
      const productsQuery = query(
        collection(db, 'products'),
        where('seller_id', '==', user.id)
      )
      const productsSnapshot = await getDocs(productsQuery)
      
      const productsData = await Promise.all(
        productsSnapshot.docs
          .sort((a, b) => {
            const dateA = a.data().created_at?.toDate?.() || new Date(a.data().created_at)
            const dateB = b.data().created_at?.toDate?.() || new Date(b.data().created_at)
            return dateB.getTime() - dateA.getTime()
          })
          .map(async (productDoc) => {
          const productData = productDoc.data() as ProductData
          
          // Fetch category
          const categoryRef = doc(db, 'product_categories', productData.category_id)
          const categoryDoc = await getDoc(categoryRef)
          const categoryData = categoryDoc.exists() ? categoryDoc.data() as CategoryData : null
          
          // Fetch images
          const imagesQuery = query(
            collection(db, 'product_images'),
            where('product_id', '==', productDoc.id)
          )
          const imagesSnapshot = await getDocs(imagesQuery)
          const images = imagesSnapshot.docs.map(img => ({
            url: img.data().url
          }))

          return {
            id: productDoc.id,
            ...productData,
            product_categories: categoryData ? { name: categoryData.name } : null,
            product_images: images
          } as Product
        })
      )

      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load your listings. Please try again.",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSuccess = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "draft" : "active"

    try {
      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, { status: newStatus })
      
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)))
      toast({
        title: "Status updated",
        description: `Product ${newStatus === "active" ? "published" : "unpublished"}`,
      })
    } catch (error) {
      console.error("Error updating product status:", error)
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        {/* Responsive grid: smaller gap on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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
        <h1 className="text-3xl font-bold">My Listings</h1>
        <p className="text-muted-foreground">Manage your product listings ({products.length})</p>
      </div>
      {/* Responsive grid: smaller gap on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={product.product_images?.[0]?.url || "/placeholder.svg?height=300&width=300"}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Action buttons: full-width and touch-friendly on mobile */}
              <div className="absolute top-2 right-2 w-full flex flex-col gap-2 items-end">
                <Link href={`/marketplace/my-listings/edit/${product.id}`}>
                  <Button variant="ghost" size="icon" className="w-10 h-10 sm:w-auto sm:h-auto">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <DeleteListingButton
                  listingId={product.id}
                  listingType="product"
                  userId={user?.id || ""}
                  onSuccess={() => handleDeleteSuccess(product.id)}
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 sm:w-auto sm:h-auto"
                />
              </div>
              <Badge
                variant={product.status === "active" ? "default" : product.status === "sold" ? "destructive" : "secondary"}
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
                <span>{
  product.created_at && !isNaN(new Date(product.created_at).getTime())
    ? formatDistanceToNow(new Date(product.created_at)) + ' ago'
    : '-'
}</span>
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
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Dialogs: render as bottom sheets on mobile if possible (not shown here, but add if needed) */}
    </div>
  )
}

export default function ProtectedMyListingsPage() {
  return <ProtectedRoute><MyListingsPage /></ProtectedRoute>;
}
