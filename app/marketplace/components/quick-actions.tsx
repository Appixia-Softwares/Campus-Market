"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Heart, MessageSquare, TrendingUp, BookOpen, Laptop, Home, Dumbbell, Rocket, Flame } from "lucide-react";
import { CATEGORY_META } from "@/lib/category-config";
import Link from "next/link"
import { motion } from "framer-motion"

// Use CATEGORY_META for dynamic popular categories (first 4 as example)
const QUICK_CATEGORIES = CATEGORY_META.slice(0, 4).map(cat => ({
  name: cat.label,
  icon: cat.icon,
  color: "bg-primary",
  href: `/marketplace?category=${encodeURIComponent(cat.key)}`,
}));

const QUICK_ACTIONS = [
  {
    name: "List Item",
    icon: Plus,
    href: "/marketplace/listings/new",
    color: "bg-primary",
    description: "Sell your items",
  },
  {
    name: "My Favorites",
    icon: Heart,
    href: "/marketplace/favorites",
    color: "bg-red-500",
    description: "Saved items",
  },
  {
    name: "Messages",
    icon: MessageSquare,
    href: "/messages",
    color: "bg-blue-500",
    description: "Chat with sellers",
  },
  {
    name: "Trending",
    icon: TrendingUp,
    href: "/marketplace?tab=trending",
    color: "bg-yellow-500",
    description: "Popular items",
  },
]

export function QuickActions() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Rocket className="h-3 w-3" /> Get Started
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={action.href} aria-label={action.name}>
                  <Card className="hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-300 group cursor-pointer border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div
                        className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-medium mb-1">{action.name}</h4>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Categories */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Popular Categories</h3>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" /> Hot
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href} aria-label={category.name}>
                  <Card className="hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-300 group cursor-pointer border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div
                        className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                      >
                        {category.icon && <category.icon className="h-6 w-6 text-white" />}
                      </div>
                      <h4 className="font-medium">{category.name}</h4>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
