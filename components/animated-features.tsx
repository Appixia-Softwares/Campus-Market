"use client"

import { motion } from "framer-motion"
import { 
  ShoppingBag, 
  MessageCircle, 
  Shield, 
  BookOpen, 
  Users, 
  TrendingUp,
  Zap,
  Star,
  Clock,
  Gift
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: <ShoppingBag className="h-8 w-8" />,
    title: "Revolutionary Marketplace",
    description: "Buy & sell with zero fees, instant payments, and AI-powered recommendations",
    highlight: "Coming Sept 22, 2025",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <MessageCircle className="h-8 w-8" />,
    title: "Smart Messaging",
    description: "Built-in chat with auto-translation, smart scheduling, and safety features",
    highlight: "New Feature",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Verified Students Only",
    description: "University-verified profiles ensure safe, authentic transactions",
    highlight: "100% Secure",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "Campus Network",
    description: "Connect with students from 15+ universities across Zimbabwe",
    highlight: "Expanding",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Community First",
    description: "Join study groups, find roommates, and build lasting connections",
    highlight: "Social",
    color: "from-teal-500 to-blue-500"
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Smart Analytics",
    description: "Track your sales, optimize listings, and maximize your earnings",
    highlight: "Pro Tools",
    color: "from-indigo-500 to-purple-500"
  }
]

const stats = [
  { number: "2,847+", label: "Students Waiting", icon: <Users className="h-4 w-4" /> },
  { number: "15+", label: "Universities", icon: <BookOpen className="h-4 w-4" /> },
  { number: "0%", label: "Transaction Fees", icon: <Gift className="h-4 w-4" /> },
  { number: "24/7", label: "Support", icon: <Clock className="h-4 w-4" /> }
]

export default function AnimatedFeatures() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-200 dark:border-green-800 mb-6"
          >
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              Revolutionary Features Coming Soon
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Why Students Are Excited
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're building something that will completely transform how students buy, sell, and connect on campus. 
            <strong className="text-foreground"> Join the waitlist to be first in line!</strong>
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
                <CardContent className="p-8 relative">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  {/* Highlight badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${feature.color} text-white`}
                  >
                    {feature.highlight}
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    viewport={{ once: true }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-3xl p-8 border border-green-200 dark:border-green-800">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Star className="h-6 w-6 text-yellow-500" />
              <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                Don't Miss Out!
              </span>
            </motion.div>
            <h3 className="text-2xl font-bold mb-4">
              Join <span className="text-green-600 dark:text-green-400">2,847+ students</span> on the waitlist
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Be the first to experience the future of campus commerce. Early access, exclusive perks, and priority support await!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
