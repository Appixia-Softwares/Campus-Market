"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Star, Sparkles, ThumbsUp, Wrench, Flame, MapPin, Calendar, DollarSign, Gem, Filter, X, Search, Truck } from "lucide-react";
import { CATEGORY_META } from "@/lib/category-config";
import ZIM_UNIVERSITIES from "@/utils/schools_data";
import { motion, AnimatePresence } from "framer-motion"

interface SearchFiltersProps {
  onSearch: (filters: any) => void
  categories: { id: string; name: string; icon: string }[]
  universities: { id: string; name: string; location: string; type: string }[]
}

export function SearchFilters({ onSearch, categories, universities }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    query: "",
    category: "all",
    condition: "all",
    minPrice: 0,
    maxPrice: 1000,
    sortBy: "newest",
    university: "all",
    location: "all",
    deliveryAvailable: false,
    priceNegotiable: false,
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const CONDITIONS = [
    { value: "New", label: "New", description: "Brand new, never used", icon: <Sparkles className="h-4 w-4 text-primary" /> },
    { value: "Like New", label: "Like New", description: "Barely used, excellent condition", icon: <Star className="h-4 w-4 text-yellow-500" /> },
    { value: "Good", label: "Good", description: "Used but in good condition", icon: <ThumbsUp className="h-4 w-4 text-green-500" /> },
    { value: "Fair", label: "Fair", description: "Shows wear but still functional", icon: <Wrench className="h-4 w-4 text-muted-foreground" /> },
    { value: "Poor", label: "Poor", description: "Heavy wear, may need repairs", icon: <Wrench className="h-4 w-4 text-destructive" /> },
  ]

  const SORT_OPTIONS = [
    { value: "newest", label: "Newest First", icon: <Sparkles className="h-4 w-4" /> },
    { value: "oldest", label: "Oldest First", icon: <Calendar className="h-4 w-4" /> },
    { value: "price_asc", label: "Price: Low to High", icon: <DollarSign className="h-4 w-4" /> },
    { value: "price_desc", label: "Price: High to Low", icon: <Gem className="h-4 w-4" /> },
    { value: "popular", label: "Most Popular", icon: <Flame className="h-4 w-4" /> },
    { value: "nearest", label: "Nearest First", icon: <MapPin className="h-4 w-4" /> },
  ]

  const handleSearch = () => {
    const apiFilters = {
      ...filters,
      category: filters.category === "all" ? "" : filters.category,
      condition: filters.condition === "all" ? "" : filters.condition,
      university: filters.university === "all" ? "" : filters.university,
      location: filters.location === "all" ? "" : filters.location,
    }
    onSearch(apiFilters)
    updateActiveFilters()
  }

  const updateActiveFilters = () => {
    const active: string[] = []
    if (filters.query) active.push(`Search: "${filters.query}"`)
    if (filters.category !== "all") {
      const category = categories.find((c) => c.id === filters.category)
      if (category) active.push(`Category: ${category.name}`)
    }
    if (filters.condition !== "all") active.push(`Condition: ${filters.condition}`)
    if (filters.university !== "all") {
      const university = universities.find((u) => u.id === filters.university)
      if (university) active.push(`University: ${university.name}`)
    }
    if (filters.minPrice > 0 || filters.maxPrice < 1000) {
      active.push(`Price: $${filters.minPrice} - $${filters.maxPrice}`)
    }
    if (filters.deliveryAvailable) active.push("Delivery Available")
    if (filters.priceNegotiable) active.push("Price Negotiable")

    setActiveFilters(active)
  }

  const resetFilters = () => {
    const resetState = {
      query: "",
      category: "all",
      condition: "all",
      minPrice: 0,
      maxPrice: 1000,
      sortBy: "newest",
      university: "all",
      location: "all",
      deliveryAvailable: false,
      priceNegotiable: false,
    }
    setFilters(resetState)
    setActiveFilters([])
    onSearch({})
  }

  const removeFilter = (filterToRemove: string) => {
    if (filterToRemove.startsWith("Search:")) {
      setFilters((prev) => ({ ...prev, query: "" }))
    } else if (filterToRemove.startsWith("Category:")) {
      setFilters((prev) => ({ ...prev, category: "all" }))
    } else if (filterToRemove.startsWith("Condition:")) {
      setFilters((prev) => ({ ...prev, condition: "all" }))
    } else if (filterToRemove.startsWith("University:")) {
      setFilters((prev) => ({ ...prev, university: "all" }))
    } else if (filterToRemove.startsWith("Price:")) {
      setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: 1000 }))
    } else if (filterToRemove === "Delivery Available") {
      setFilters((prev) => ({ ...prev, deliveryAvailable: false }))
    } else if (filterToRemove === "Price Negotiable") {
      setFilters((prev) => ({ ...prev, priceNegotiable: false }))
    }

    // Re-trigger search after filter removal
    setTimeout(handleSearch, 100)
  }

  const getLocationsByUniversity = () => {
    if (filters.university === "all") return []
    const university = universities.find((u) => u.id === filters.university)
    return university ? [university.location] : []
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for textbooks, electronics, furniture..."
            className="pl-10 h-12 text-lg"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 px-6 flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
        <Button onClick={handleSearch} className="h-12 px-8">
          Search
        </Button>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                {filter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 border-dashed border-muted">
              <CardContent className="p-6 space-y-6">
                {/* Quick Filters */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Quick Filters
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="delivery"
                        checked={filters.deliveryAvailable}
                        onCheckedChange={(checked) => setFilters({ ...filters, deliveryAvailable: checked })}
                      />
                      <Label htmlFor="delivery" className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery Available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="negotiable"
                        checked={filters.priceNegotiable}
                        onCheckedChange={(checked) => setFilters({ ...filters, priceNegotiable: checked })}
                      />
                      <Label htmlFor="negotiable" className="flex items-center gap-1">
                        💬 Price Negotiable
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Category and University */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORY_META.map(cat => (
                          <SelectItem key={cat.key} value={cat.key}>
                            {cat.icon && <cat.icon className="h-4 w-4 mr-1 inline" />} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      University/Institution
                    </Label>
                    <Select
                      value={filters.university}
                      onValueChange={(value) => setFilters({ ...filters, university: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Universities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Universities</SelectItem>
                        {ZIM_UNIVERSITIES.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            <MapPin className="h-4 w-4 mr-1 inline" /> {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Condition and Sort */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Condition</Label>
                    <Select
                      value={filters.condition}
                      onValueChange={(value) => setFilters({ ...filters, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Condition</SelectItem>
                        {CONDITIONS.map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            <div className="flex items-center gap-2">
                              <span>{condition.icon}</span>
                              <div>
                                <div className="font-medium">{condition.label}</div>
                                <div className="text-xs text-muted-foreground">{condition.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Sort By
                    </Label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Price Range (USD)</Label>
                  <div className="px-3">
                    <Slider
                      value={[filters.minPrice, filters.maxPrice]}
                      max={1000}
                      step={5}
                      onValueChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>${filters.minPrice}</span>
                      <span>${filters.maxPrice}+</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={handleSearch} className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
