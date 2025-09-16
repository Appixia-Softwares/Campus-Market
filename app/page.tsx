
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
import CountdownTimer from "@/components/countdown-timer"
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
  const [showCountdown, setShowCountdown] = useState(false)
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
    setShowCountdown(true)
  }

  const handleExploreMarketplace = () => {
    setShowCountdown(true)
  }

  const handleDashboard = () => {
    setShowCountdown(true)
  }

  const handleMarketplace = () => {
    setShowCountdown(true)
  }

  const handleLogin = () => {
    setShowCountdown(true)
  }

  const handleSignup = () => {
    setShowCountdown(true)
  }

  return (
    <div className="flex min-h-screen flex-col px-2 sm:px-0">
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
                  onClick={handleDashboard}
                  className="border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300"
                >
                  Dashboard
                </Button>
                <Button
                  size="sm"
                  onClick={handleMarketplace}
                  className="relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10">Marketplace</span>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogin}
                  className="border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300"
                >
                  Log in
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSignup}
                  className="relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10">Sign up</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="animate-fadeIn">
          <HeroSection stats={stats} onMarketplaceClick={handleExploreMarketplace} />
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

      {/* Footer */}
      <Footer />

      {/* Countdown Timer Modal */}
      {showCountdown && (
        <CountdownTimer onClose={() => setShowCountdown(false)} />
      )}
    </div>
  )
}
