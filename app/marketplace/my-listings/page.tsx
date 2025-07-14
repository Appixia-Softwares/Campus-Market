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

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId))
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast({
        title: "Product deleted",
        description: "Your product has been removed from the marketplace",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
    setDeleteProductId(null)
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <Link href="/marketplace/sell">
          <Button>Add New Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No products listed yet</h3>
          <p className="text-muted-foreground mb-6">Start selling by creating your first product listing</p>
          <Link href="/marketplace/sell">
            <Button>Create Your First Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.product_images?.[0]?.url || "/placeholder.svg?height=300&width=300"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="bg-background/50 hover:bg-background/80">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleProductStatus(product.id, product.status)}>
                        {product.status === "active" ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/marketplace/edit/${product.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProductId(product.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  <span>{formatDistanceToNow(formatDate(product.created_at), { addSuffix: true })}</span>
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

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Link href={`/marketplace/products/${product.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View
                  </Button>
                </Link>
                <Link href={`/marketplace/edit/${product.id}`} className="flex-1">
                  <Button className="w-full">Edit</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && handleDeleteProduct(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ProtectedMyListingsPage() {
  return <ProtectedRoute><MyListingsPage /></ProtectedRoute>;
}
