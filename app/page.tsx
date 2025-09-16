"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, MessageCircle, ShoppingBag, Users, TrendingUp, Shield, Star, Rocket, Gift } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import FeatureCard from "@/components/feature-card"
import HeroSection from "@/components/hero-section"
import HowItWorks from "@/components/how-it-works"
import VerificationSection from "@/components/verification-section"
import PwaFeatures from "@/components/pwa-features"
import TestimonialCarousel from "@/components/testimonial-carousel"
import CountdownTimer from "@/components/countdown-timer"
import CountdownBanner from "@/components/countdown-banner"
import EmailSignupForm from "@/components/email-signup-form"
import AnimatedFeatures from "@/components/animated-features"
import AnimatedSocialProof from "@/components/animated-social-proof"
import EnhancedFooter from "@/components/enhanced-footer"
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
  const [showBanner, setShowBanner] = useState(true)
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
      {/* Countdown Banner */}
      {showBanner && (
        <CountdownBanner onClose={() => setShowBanner(false)} />
      )}

      {/* Navigation */}
      <header className={`sticky z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${showBanner ? 'top-16' : 'top-0'}`}>
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

        {/* Animated Features Section */}
        <AnimatedFeatures />

        {/* Social Proof Section */}
        <AnimatedSocialProof />

        {/* Email Signup Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background py-20 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-blue-500/10 w-32 h-32 blur-3xl"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.2 + Math.random() * 0.3,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>

          <div className="container flex flex-col items-center justify-center gap-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-200 dark:border-green-800"
              >
                <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Don't Miss the Launch!
                </span>
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Join 2,847+ Students
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Be the first to experience the future of campus commerce. Early access, exclusive perks, and priority support await!
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <EmailSignupForm />
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background py-20 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-green-500/10 w-32 h-32 blur-3xl"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.2 + Math.random() * 0.3,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 30 - 15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>

          <div className="container flex flex-col items-center justify-center gap-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-200 dark:border-green-800"
              >
                <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Last Chance to Join Early!
                </span>
              </motion.div>

              <h2 className="text-4xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ready for Something Amazing?
                </span>
            </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Join <strong className="text-green-600 dark:text-green-400">2,847+ students</strong> from 15+ universities who are already excited about the future of campus commerce. 
                <strong className="text-foreground"> Don't miss out on early access!</strong>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button onClick={handleGetStarted} size="lg" className="gap-2 relative overflow-hidden group px-8 py-4 text-lg">
                <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10">Join the Waitlist Now</span>
                <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button onClick={handleExploreMarketplace} variant="outline" size="lg" className="gradient-border px-8 py-4 text-lg">
                Learn More
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <EnhancedFooter />

      {/* Countdown Timer Modal */}
      {showCountdown && (
        <CountdownTimer onClose={() => setShowCountdown(false)} />
      )}
    </div>
  )
}