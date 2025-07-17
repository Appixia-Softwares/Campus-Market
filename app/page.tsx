
"use client"
import { useEffect, useState } from "react"
import { ArrowRight, BookOpen, MessageCircle, ShoppingBag, Users, TrendingUp, Shield, Star } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import FeatureCard from "@/components/feature-card"
import HeroSection from "@/components/hero-section"
import HowItWorks from "@/components/how-it-works"
import VerificationSection from "@/components/verification-section"
import PwaFeatures from "@/components/pwa-features"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { getUniversities } from "@/lib/get-universities";
import AccommodationShowcase from "@/components/accommodation-showcase"
import ProductShowcase from "@/components/ProductShowcase"
import Footer from "@/components/Footer";

interface Stats {
  totalProducts: number
  totalAccommodations: number
  totalUsers: number
  totalUniversities: number
  totalOrders: number
  totalReviews: number
  averageRating: number
}

interface FeaturedProduct {
  id: string
  title: string
  price: number
  condition: string
  image_url: string
  seller_name: string
  university_name: string
  likes: number
  views: number
}

interface University {
  id: string
  name: string
  short_name: string
  student_count: number
  location: string
  type?: string;
}

interface ProductData {
  title: string
  price: number
  condition: string
  likes: number
  views: number
}

interface SellerData {
  full_name: string
}

interface UniversityData {
  name: string
}

interface ImageData {
  url: string
}

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalAccommodations: 0,
    totalUsers: 0,
    totalUniversities: 0,
    totalOrders: 0,
    totalReviews: 0,
    averageRating: 0,
  })
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [allUniversitiesCount, setAllUniversitiesCount] = useState(0);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch statistics
        const [
          productsCount,
          accommodationsCount,
          usersCount,
          universitiesCount,
          ordersCount,
          reviewsCount
        ] = await Promise.all([
          getCountFromServer(collection(db, 'products')),
          getCountFromServer(collection(db, 'accommodations')),
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'universities')),
          getCountFromServer(collection(db, 'orders')),
          getCountFromServer(collection(db, 'reviews'))
        ])

        // Calculate average rating
        const reviewsQuery = query(collection(db, 'reviews'))
        const reviewsData = await getDocs(reviewsQuery)
        const reviews = reviewsData.docs.map(doc => doc.data())
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
          : 0

        setStats({
          totalProducts: productsCount.data().count,
          totalAccommodations: accommodationsCount.data().count,
          totalUsers: usersCount.data().count,
          totalUniversities: universitiesCount.data().count,
          totalOrders: ordersCount.data().count,
          totalReviews: reviewsCount.data().count,
          averageRating: Math.round(averageRating * 10) / 10,
        })

        // Fetch featured products
        const featuredProductsQuery = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          where('featured', '==', true),
          limit(6)
        )
        const featuredProductsData = await getDocs(featuredProductsQuery)
        
        const products = await Promise.all(
          featuredProductsData.docs.map(async (doc) => {
            const productData = doc.data() as ProductData
            
            // Fetch related data from subcollections
            const sellerQuery = query(collection(db, `products/${doc.id}/seller`))
            const universityQuery = query(collection(db, `products/${doc.id}/university`))
            const imagesQuery = query(collection(db, `products/${doc.id}/images`))
            
            const [sellerData, universityData, imagesData] = await Promise.all([
              getDocs(sellerQuery),
              getDocs(universityQuery),
              getDocs(imagesQuery)
            ])
            
            const seller = sellerData.docs[0]?.data() as SellerData
            const university = universityData.docs[0]?.data() as UniversityData
            const image = imagesData.docs[0]?.data() as ImageData
            
            return {
              id: doc.id,
              title: productData.title,
              price: productData.price,
              condition: productData.condition,
              image_url: image?.url || "/placeholder.svg?height=200&width=200",
              seller_name: seller?.full_name || 'Unknown Seller',
              university_name: university?.name || 'Unknown University',
              likes: productData.likes || 0,
              views: productData.views || 0,
            } as FeaturedProduct
          })
        )
        
        setFeaturedProducts(products)

        // Fetch universities
        const BEST_UNI_IDS = [
          "uz", 
          "nust", 
          "cut", 
          "msu",
          "cuz", 
          "hit", 
          "zou", 
          "lsu", 
          "gzu" , 
          "chu"
        ];
        const universitiesList = (await getUniversities()).map((u: any) => ({
          id: u.id,
          name: u.name,
          short_name: u.short_name,
          student_count: u.student_count,
          location: u.location,
          type: u.type,
        }));
        setAllUniversitiesCount(universitiesList.filter((u) => u.type === "university").length);
        const filteredUnis = universitiesList
          .filter((u) => u.type === "university" && BEST_UNI_IDS.includes(u.id))
          .sort((a, b) => (b.student_count || 0) - (a.student_count || 0));
        setUniversities(filteredUnis);
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/signup")
    }
  }

  const handleExploreMarketplace = () => {
    if (user) {
      router.push("/marketplace")
    } else {
      router.push("/login")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="text-xl font-bold">Campus Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300"
                >
                  Dashboard
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/marketplace")}
                  className="relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10">Marketplace</span>
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="relative overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative z-10">Sign up</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="animate-fadeIn">
          <HeroSection stats={stats} />
        </div>

        {/* Live Stats Section */}
        <section className="container py-12 md:py-16 animate-slideUp">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20"></div>
              <CardContent className="relative p-6 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{stats.totalProducts.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Active Products</div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20"></div>
              <CardContent className="relative p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20"></div>
              <CardContent className="relative p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{stats.totalOrders.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Successful Orders</div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20"></div>
              <CardContent className="relative p-6 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">{stats.averageRating}/5</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="container py-12 md:py-16 animate-slideUp">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center mb-12">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-4xl">
                <span className="text-gradient">Featured Products</span>
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Discover the most popular items from students across Zimbabwe
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 animate-fadeIn">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <img
                      src={product.image_url || "/placeholder.svg"}
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
                      by {product.seller_name} • {product.university_name}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{product.likes} likes</span>
                      <span>{product.views} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button onClick={handleExploreMarketplace} size="lg" className="gap-2">
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* Airbnb-like Products (Student Accommodation) Section */}
        {/* This section showcases accommodation listings in an Airbnb style using mock data. */}
        <section className="container py-12 md:py-16 animate-slideUp">
          <AccommodationShowcase />
        </section>

        {/* Marketplace Products Section */}
        {/* This section showcases trending products in a modern, modular grid using mock data. */}
        <section className="container py-12 md:py-16 animate-slideUp">
          <ProductShowcase />
        </section>

        {/* Universities Section */}
        {universities.length > 0 && (
          <section className="bg-gradient-to-b from-green-50/50 to-white dark:from-green-950/10 dark:to-background py-16 animate-slideUp">
            <div className="container">
              <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center mb-12">
                <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-4xl">
                  <span className="text-gradient">Trusted by Students Across Zimbabwe</span>
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                  Join thousands of students from top universities
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {universities.map((university) => (
                  <Card key={university.id} className="text-center p-6 hover:shadow-md transition-shadow animate-fadeIn">
                    <h3 className="font-semibold text-lg mb-2">{university.short_name || university.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{university.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {university.student_count ? `${university.student_count.toLocaleString()} students` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{university.location}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="container py-12 md:py-24 animate-slideUp">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              <span className="text-gradient">Platform Features</span>
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Designed specifically for Zimbabwean university students
            </p>
          </div>

          <div className="mx-auto mt-16 grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <FeatureCard
              icon={<ShoppingBag className="h-10 w-10" />}
              title="Student Marketplace"
              description={`Buy and sell textbooks, electronics, clothing, and more directly from other students. ${stats.totalProducts}+ items available.`}
            />
            <FeatureCard
              icon={<MessageCircle className="h-10 w-10" />}
              title="In-App Messaging"
              description="Chat directly with sellers to negotiate and arrange meetups safely."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10" />}
              title="Verified Students"
              description="Student ID verification ensures you're dealing with real university students."
            />
            <FeatureCard
              icon={<BookOpen className="h-10 w-10" />}
              title="University Network"
              description={`Connect with students from ${allUniversitiesCount} universities across Zimbabwe.`}
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Campus Community"
              description="Build connections within your university and discover local opportunities."
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10" />}
              title="Smart Analytics"
              description="Track your sales, views, and engagement with detailed insights."
            />
          </div>
        </section>

        {/* How It Works */}
        <div className="animate-slideUp">
          <HowItWorks />
        </div>

        {/* Verification Section */}
        <div className="animate-slideUp">
          <VerificationSection />
        </div>

        {/* PWA Features */}
        <div className="animate-slideUp">
          <PwaFeatures />
        </div>

        {/* Testimonials */}
        <div className="animate-slideUp">
          <TestimonialCarousel />
        </div>

        {/* CTA Section */}
        <section className="bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background py-16 relative overflow-hidden animate-fadeIn">
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-green-500/10 w-32 h-32 blur-3xl"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.2 + Math.random() * 0.3,
                }}
              />
            ))}
          </div>

          <div className="container flex flex-col items-center justify-center gap-6 text-center relative z-10">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              <span className="text-gradient">Ready to join Campus Marketplace?</span>
            </h2>
            <p className="max-w-[85%] text-lg text-muted-foreground">
              Join {stats.totalUsers.toLocaleString()}+ students from {allUniversitiesCount} universities and start
              exploring the marketplace.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button onClick={handleGetStarted} size="lg" className="gap-2 relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10">{user ? "Go to Dashboard" : "Sign up now"}</span>
                <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button onClick={handleExploreMarketplace} variant="outline" size="lg" className="gradient-border">
                Explore marketplace
              </Button>
            </div>
          </div>
        </section>
      </main>

     
      <Footer />
    </div>
  )
}
