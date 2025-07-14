"use client"

import { useState, useEffect, useCallback } from "react"
import { SearchFilters } from "./components/search-filters"
import { ProductGrid } from "./components/product-grid"
import { QuickActions } from "./components/quick-actions"
import { TrendingProducts } from "./components/trending-products"
import { RecentlyViewed } from "./components/recently-viewed"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, MapPin, TrendingUp, Grid, List, Star, GraduationCap, Laptop, Flag, Package } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc, startAfter } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Timestamp } from "firebase/firestore"

interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
}

interface University {
  id: string
  name: string
  location: string
  type: string
  is_active: boolean
}

interface Filters {
  query?: string
  category?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  university?: string
  location?: string
  deliveryAvailable?: boolean
}

interface ProductImage {
  id: string
  url: string
  is_primary: boolean
  product_id: string
}

interface Product {
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
  created_at: Timestamp
  category_id: string
  university_id: string
  seller_id: string
  product_images: {
    id: string
    url: string
    is_primary: boolean
    product_id: string
  }[]
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
  product_categories: {
    id: string
    name: string
    description: string | null
    icon: string
  }
  universities: {
    id: string
    name: string
    location: string
    type: string
  }
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({})
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("all")
  const [totalProducts, setTotalProducts] = useState(0)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  // Fetch initial data only once on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        console.log("Debug - Starting initial data fetch")
        
        // Fetch categories and universities in parallel
        const [categoriesData, universitiesData] = await Promise.all([
          fetchCategories(),
          fetchUniversities()
        ])
        
        // Set initial filters with default values
        const initialFilters = {
          status: "active",
          sortBy: "created_at"
        }
        
        // Fetch products with initial filters
        await fetchProducts(initialFilters)
        
        console.log("Debug - Initial data fetch completed")
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast.error("Failed to load marketplace data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, []) // Empty dependency array means this runs once on mount

  // Fetch recently viewed products when user changes
  useEffect(() => {
    if (user) {
      fetchRecentlyViewed()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      console.log("Debug - Fetching categories from Firebase...")
      const categoriesRef = collection(db, 'product_categories')
      const categoriesQuery = query(
        categoriesRef,
        where('is_active', '==', true),
        orderBy('sort_order', 'asc')
      )
      
      const snapshot = await getDocs(categoriesQuery)
      console.log("Debug - Categories count:", snapshot.size)
      
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      
      setCategories(categoriesData)
      return categoriesData
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
      return []
    }
  }

  const fetchUniversities = async () => {
    try {
      console.log("Debug - Fetching universities from Firebase...")
      const universitiesRef = collection(db, 'universities')
      const universitiesQuery = query(
        universitiesRef,
        where('is_active', '==', true)
      )
      
      const snapshot = await getDocs(universitiesQuery)
      console.log("Debug - Universities count:", snapshot.size)
      
      const universitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as University[]
      
      // Sort universities by name in memory
      universitiesData.sort((a, b) => a.name.localeCompare(b.name))
      setUniversities(universitiesData)
      return universitiesData
    } catch (error) {
      console.error("Error fetching universities:", error)
      toast.error("Failed to load universities")
      return []
    }
  }

  const fetchProducts = async (newFilters: Filters = {}) => {
    try {
      console.log("Debug - Starting fetchProducts")
      setIsLoading(true)
      
      // Build query constraints
      const productsRef = collection(db, 'products')
      let queryConstraints: any[] = []

      // Start with a simple query to test
      try {
        console.log("Debug - Testing basic query")
        const basicQuery = query(productsRef, limit(1))
        const basicSnapshot = await getDocs(basicQuery)
        console.log("Debug - Basic query result:", {
          empty: basicSnapshot.empty,
          size: basicSnapshot.size,
          exists: basicSnapshot.docs.length > 0
        })
      } catch (basicError) {
        console.error("Error with basic query:", basicError)
      }

      // Now build the full query
      queryConstraints.push(where('status', '==', 'active'))

      // Add filter constraints
      if (newFilters.category) {
        queryConstraints.push(where('category_id', '==', newFilters.category))
      }
      if (newFilters.university) {
        queryConstraints.push(where('university_id', '==', newFilters.university))
      }
      if (newFilters.minPrice) {
        queryConstraints.push(where('price', '>=', newFilters.minPrice))
      }
      if (newFilters.maxPrice) {
        queryConstraints.push(where('price', '<=', newFilters.maxPrice))
      }
      if (newFilters.condition) {
        queryConstraints.push(where('condition', '==', newFilters.condition))
      }
      if (newFilters.deliveryAvailable) {
        queryConstraints.push(where('delivery_available', '==', true))
      }

      // Add pagination
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc))
      }
      queryConstraints.push(limit(20))

      console.log("Debug - Full query constraints:", queryConstraints.map(constraint => {
        if (constraint.type === 'where') {
          return `where(${constraint.fieldPath}, ${constraint.opStr}, ${JSON.stringify(constraint.value)})`
        } else if (constraint.type === 'limit') {
          return `limit(${constraint.limit})`
        }
        return constraint
      }))

      // Execute query
      const productsQuery = query(productsRef, ...queryConstraints)
      console.log("Debug - Executing full products query...")
      
      try {
        const snapshot = await getDocs(productsQuery)
        console.log("Debug - Full query snapshot:", {
          empty: snapshot.empty,
          size: snapshot.size,
          docs: snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }))
        })

        if (snapshot.empty) {
          console.log("Debug - No products found with current filters")
          setProducts([])
          setLastDoc(null)
          setHasMore(false)
          setTotalProducts(0)
          return
        }

        // Process products
        console.log("Debug - Processing products...")
        const productsWithImages = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            try {
              const productData = docSnapshot.data()
              // Defensive: Only fetch related docs if the ID exists
              const imagesQuery = query(
                collection(db, 'product_images'),
                where('product_id', '==', docSnapshot.id)
              )
              const imagesSnapshot = await getDocs(imagesQuery)
              const images = imagesSnapshot.docs.map(img => ({
                id: img.id,
                ...img.data()
              }))

              // Get seller info
              const sellerRef = productData.seller_id ? doc(db, 'users', productData.seller_id) : null;
              const sellerDoc = sellerRef ? await getDoc(sellerRef) : null;
              const sellerDocData = sellerDoc && sellerDoc.exists() ? sellerDoc.data() : null;
              const sellerData = sellerDocData ? {
                id: sellerDoc.id,
                ...sellerDocData
              } : null;

              // Get category info
              const categoryRef = productData.category_id ? doc(db, 'product_categories', productData.category_id) : null;
              const categoryDoc = categoryRef ? await getDoc(categoryRef) : null;
              const categoryDocData = categoryDoc && categoryDoc.exists() ? categoryDoc.data() : null;
              const categoryData = categoryDocData ? {
                id: categoryDoc.id,
                ...categoryDocData
              } : {
                id: "",
                name: "Uncategorized",
                description: "",
                icon: ""
              };

              // Get university info
              const universityRef = productData.university_id ? doc(db, 'universities', productData.university_id) : null;
              const universityDoc = universityRef ? await getDoc(universityRef) : null;
              const universityDocData = universityDoc && universityDoc.exists() ? universityDoc.data() : null;
              const universityData = universityDocData ? {
                id: universityDoc.id,
                ...universityDocData
              } : {
                id: "",
                name: "Unknown University",
                location: "",
                type: ""
              };

              // Create the product object with all related data
              const product = {
                id: docSnapshot.id,
                ...productData,
                product_images: images,
                users: sellerData,
                product_categories: categoryData,
                universities: universityData
              } as Product

              return product
            } catch (productError) {
              console.error("Error processing product:", docSnapshot.id, productError)
              return null
            }
          })
        )

        // Filter out any null products and update state
        const validProducts = productsWithImages.filter((product): product is Product => product !== null)
        console.log("Debug - Valid products count:", validProducts.length)
        setProducts(validProducts)
        setLastDoc(snapshot.docs[snapshot.docs.length - 1])
        setHasMore(snapshot.docs.length === 20)
        setTotalProducts(validProducts.length)
      } catch (queryError: any) {
        console.error("Error executing full query:", queryError)
        console.error("Error details:", {
          code: queryError.code,
          message: queryError.message,
          stack: queryError.stack
        })
        
        toast.error("Failed to load products")
        setProducts([])
        setTotalProducts(0)
      }
    } catch (error: any) {
      console.error("Error in fetchProducts:", error)
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      toast.error("Failed to load products")
      setProducts([])
      setTotalProducts(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Update products when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      console.log("Debug - Filters changed, fetching products with new filters:", filters)
      fetchProducts(filters)
    }
  }, [filters])

  const fetchRecentlyViewed = async () => {
    if (!user) return

    try {
      console.log("Debug - Fetching recently viewed products...")
      const viewsRef = collection(db, 'user_product_views')
      const viewsQuery = query(
        viewsRef,
        where('user_id', '==', user.id),
        limit(10)
      )
      const snapshot = await getDocs(viewsQuery)
      console.log("Debug - Recently viewed count:", snapshot.size)

      let viewedProducts = await Promise.all(
        snapshot.docs.map(async (viewDoc) => {
          const viewData = viewDoc.data()
          const productDoc = await getDoc(doc(db, 'products', viewData.product_id))
          if (productDoc.exists()) {
            const productData = productDoc.data()
            return {
              id: productDoc.id,
              ...productData,
              viewed_at: viewData.viewed_at || null
            }
          }
          return null
        })
      )
      viewedProducts = viewedProducts.filter((item): item is NonNullable<typeof item> => Boolean(item));
      viewedProducts.sort((a, b) => {
        const aItem = a!;
        const bItem = b!;
        if (!aItem.viewed_at || !bItem.viewed_at) return 0;
        const aMillis = aItem.viewed_at.toMillis();
        const bMillis = bItem.viewed_at.toMillis();
        return bMillis - aMillis;
      });
      setRecentlyViewed(viewedProducts);
    } catch (error) {
      console.error("Error fetching recently viewed:", error)
      toast.error("Failed to load recently viewed products")
    }
  }

  const handleSearch = useCallback((newFilters: Filters) => {
    console.log("Debug - Search triggered with filters:", newFilters)
    setFilters(newFilters)
  }, [])

  const handleTabChange = (tab: string) => {
    console.log("Debug - Tab changed to:", tab)
    setActiveTab(tab)
    const tabFilters = { ...filters }

    switch (tab) {
      case "trending":
        tabFilters.sortBy = "popular"
        break
      case "nearby":
        if (user?.university_id) {
          tabFilters.university = user.university_id
        }
        break
      case "delivery":
        tabFilters.deliveryAvailable = true
        break
      default:
        // Remove tab-specific filters
        delete tabFilters.sortBy
        delete tabFilters.university
        delete tabFilters.deliveryAvailable
    }

    setFilters(tabFilters)
  }

  const getFilteredProductsCount = () => {
    return products.length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-xl p-10 shadow-xl overflow-hidden mb-10">
        {/* Badges */}
        <div className="flex gap-3 mb-6">
          <span className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full text-sm font-medium">
            <Flag className="h-4 w-4 text-green-900" /> Made for Zimbabwe
          </span>
          <span className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full text-sm font-medium">
            <Package className="h-4 w-4 text-green-900" /> {products.length} Products Available
          </span>
        </div>
        {/* Main Content */}
        <h1 className="text-5xl font-extrabold text-black drop-shadow-lg mb-4">
          Campus Market
        </h1>
        <p className="text-lg text-black/80 mb-8 max-w-xl">
          Buy and sell with fellow students across Zimbabwe's universities, colleges, and polytechnics
        </p>
        {/* Buttons */}
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-900 transition">
            <Plus className="h-5 w-5" /> List an Item
          </button>
          <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-900 transition">
            <Package className="h-5 w-5" /> Browse Products
          </button>
        </div>
        {/* Decorative Icons */}
        <GraduationCap className="absolute right-16 top-10 w-32 h-32 text-black/10" />
        <Laptop className="absolute left-1/2 bottom-0 w-16 h-16 text-black/10" />
      </div>

      <div className="container py-12 space-y-10">
        {/* Quick Actions */}
        <QuickActions />

        {/* Search and Filters */}
        <Card className="shadow-xl border-0 bg-card/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-8">
            <SearchFilters onSearch={handleSearch} categories={categories} universities={universities} />
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        )}

        {/* No Products State */}
        {!isLoading && products.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold">No Products Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new listings.
            </p>
          </div>
        )}

        {/* Products Content */}
        {!isLoading && products.length > 0 && (
          <>
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-4 bg-card/90 backdrop-blur-sm shadow-lg">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
                  >
                    <Grid className="h-4 w-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trending" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger 
                    value="nearby" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Nearby
                  </TabsTrigger>
                  <TabsTrigger 
                    value="delivery" 
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    Delivery
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="transition-all duration-200"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="transition-all duration-200"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <TabsContent value="all" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <ProductGrid
                    products={products}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    onProductUpdate={fetchProducts}
                  />
                </TabsContent>

                <TabsContent value="trending" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <TrendingProducts products={products} isLoading={isLoading} viewMode={viewMode} />
                </TabsContent>

                <TabsContent value="nearby" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <ProductGrid
                    products={products}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    onProductUpdate={fetchProducts}
                    showDistance={true}
                  />
                </TabsContent>

                <TabsContent value="delivery" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <ProductGrid
                    products={products}
                    isLoading={isLoading}
                    viewMode={viewMode}
                    onProductUpdate={fetchProducts}
                    showDelivery={true}
                  />
                </TabsContent>
              </div>
            </Tabs>

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
              <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <RecentlyViewed products={recentlyViewed} />
              </div>
            )}

            {/* Results Summary */}
            <div className="text-center text-muted-foreground bg-card/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <p className="flex items-center justify-center gap-2">
                <span>Showing {getFilteredProductsCount()} of {totalProducts} products</span>
                {filters.university && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span>Filtered by university</span>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

