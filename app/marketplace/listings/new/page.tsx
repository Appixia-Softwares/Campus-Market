"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Check,
  Package,
  FileText,
  Camera,
  DollarSign,
  Eye,
  MapPin,
  Truck,
  Phone,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  Wrench,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { collection, query, where, orderBy, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadFileToStorage } from '@/lib/firebase'
import { CATEGORY_META } from "@/lib/category-config";
import { getUniversities } from "@/lib/get-universities";

interface Category {
  id: string
  name: string
  description: string | null
  icon: string
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

const STEPS = [
  { id: 1, title: "Basic Info", icon: Package, description: "Product title and category" },
  { id: 2, title: "Description", icon: FileText, description: "Detailed description" },
  { id: 3, title: "Photos", icon: Camera, description: "Upload product images" },
  { id: 4, title: "Pricing & Location", icon: DollarSign, description: "Set price and pickup details" },
  { id: 5, title: "Review", icon: Eye, description: "Review and publish" },
]

const CONDITIONS = [
  { value: "New", label: "New", description: "Brand new, never used", icon: Sparkles },
  { value: "Like New", label: "Like New", description: "Barely used, excellent condition", icon: ThumbsUp },
  { value: "Good", label: "Good", description: "Used but in good condition", icon: Check },
  { value: "Fair", label: "Fair", description: "Shows wear but still functional", icon: Package },
  { value: "Poor", label: "Poor", description: "Heavy wear, may need repairs", icon: Wrench },
]

export default function NewListingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    original_price: "",
    condition: "",
    category_id: "",
    brand: "",
    model: "",
    pickup_location: "",
    delivery_available: false,
    delivery_fee: "",
    price_negotiable: false,
    university_id: user?.university_id || "",
    whatsapp_contact: true
  })

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchCategories(),
          loadUniversities()
        ])
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast.error("Failed to load initial data")
      }
    }
    fetchInitialData()
  }, [])

  const loadUniversities = async () => {
    try {
      const unis = await getUniversities();
      setUniversities(unis.filter((u: University) => u.is_active !== false));
    } catch (error) {
      console.error("Error loading universities:", error);
      toast.error("Failed to load universities");
    }
  }

  const fetchCategories = async () => {
    try {
      console.log("Debug - Fetching categories from Firebase...")
      const categoriesRef = collection(db, 'product_categories')
      const categoriesQuery = query(
        categoriesRef,
        where('is_active', '==', true)
      )
      
      const snapshot = await getDocs(categoriesQuery)
      console.log("Debug - Categories count:", snapshot.size)
      
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      
      // Sort categories by sort_order in memory
      categoriesData.sort((a, b) => a.sort_order - b.sort_order)
      
      console.log("Debug - Sorted categories:", categoriesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
    }
  }

  // Image upload with drag and drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > 10) {
        toast.error("Maximum 10 images allowed")
        return
      }

      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB.`)
          return false
        }
        return true
      })

      setImages((prev) => [...prev, ...validFiles])
    },
    [images],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
  })

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const [removed] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, removed)
      return newImages
    })
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.category_id && formData.condition
      case 2:
        return formData.description.length >= 20
      case 3:
        return images.length > 0
      case 4:
        return formData.price && Number.parseFloat(formData.price) > 0 && formData.pickup_location
      default:
        return true
    }
  }

  const submitListing = async () => {
    if (!user) {
      toast.error("Please log in to create a listing")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Create product
      const productRef = await addDoc(collection(db, 'products'), {
        title: formData.title,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        original_price: formData.original_price ? Number.parseFloat(formData.original_price) : null,
        category_id: formData.category_id,
        condition: formData.condition as any,
        seller_id: user.id,
        brand: formData.brand || null,
        model: formData.model || null,
        pickup_location: formData.pickup_location,
        delivery_available: formData.delivery_available,
        delivery_fee: formData.delivery_fee ? Number.parseFloat(formData.delivery_fee) : 0,
        university_id: formData.university_id || user.university_id,
        price_negotiable: formData.price_negotiable,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        status: "active",
      });
      const productId = productRef.id;

      // Upload images with progress
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`
          const publicUrl = await uploadFileToStorage(fileName, file)
          await addDoc(collection(db, 'product_images'), {
            product_id: productId,
            url: publicUrl,
            is_primary: i === 0,
          })
          setUploadProgress(((i + 1) / images.length) * 100)
        }
      }

      toast.success("Product listed successfully!")
      router.push(`/marketplace/products/${productId}`)
    } catch (error) {
      console.error("Error creating listing:", error)
      toast.error("Failed to create listing")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  // Helper to get category meta by id
  function getCategoryMetaById(id: string) {
    // Try to match by id to the loaded categories, then by name to CATEGORY_META
    const cat = categories.find(c => c.id === id);
    if (!cat) return undefined;
    return CATEGORY_META.find(meta => meta.label === cat.name || meta.key === cat.name?.toLowerCase());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">List Your Product</h1>
            <p className="text-muted-foreground">Create a listing to sell your item to fellow students</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="mb-6" />

            {/* Step indicators */}
            <div className="flex justify-between">
              {STEPS.map((step) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = step.id < currentStep

                return (
                  <div key={step.id} className="flex flex-col items-center text-center">
                    <motion.div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                        ${
                          isCompleted
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : isActive
                              ? "bg-primary/10 text-primary border-2 border-primary shadow-md"
                              : "bg-muted text-muted-foreground"
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </motion.div>
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
              {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., iPhone 13 Pro Max 256GB - Like New"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Be specific and descriptive. Include brand, model, and key features.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => {
                            const meta = CATEGORY_META.find(cat => cat.label === category.name || cat.key === category.name?.toLowerCase());
                            const Icon = meta?.icon || Package;
                            return (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-5 w-5" />
                                  {category.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map((condition) => {
                            const Icon = condition.icon;
                            return (
                              <SelectItem key={condition.value} value={condition.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{condition.label}</div>
                                    <div className="text-xs text-muted-foreground">{condition.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="brand">Brand (Optional)</Label>
                      <Input
                        id="brand"
                        placeholder="e.g., Apple, Samsung, Dell"
                        value={formData.brand}
                        onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="model">Model (Optional)</Label>
                      <Input
                        id="model"
                        placeholder="e.g., iPhone 13 Pro Max, Galaxy S21"
                        value={formData.model}
                        onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Description */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="description">Product Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your product in detail. Include features, condition, reason for selling, what's included, etc."
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={8}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimum 20 characters required</span>
                      <span className={formData.description.length < 20 ? "text-red-500" : "text-green-500"}>
                        {formData.description.length} characters
                      </span>
                    </div>
                  </div>

                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">💡 Tips for a great description:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Be honest about any defects or wear</li>
                        <li>• Mention original accessories or packaging included</li>
                        <li>• Explain why you're selling</li>
                        <li>• Add purchase date if recent</li>
                        <li>• Include dimensions or specifications if relevant</li>
                        <li>• Mention if you're open to negotiations</li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label>Product Photos * (Max 10)</Label>
                    <div
                      {...getRootProps()}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mt-2
                        ${
                          isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50"
                        }
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">{isDragActive ? "Drop images here" : "Upload Photos"}</p>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop or click to select images (JPEG, PNG, WebP)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB per image</p>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div>
                      <Label>Uploaded Images ({images.length}/10)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(image) || "/placeholder.svg"}
                              alt={`Upload ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {index === 0 && <Badge className="absolute bottom-2 left-2 text-xs">Primary</Badge>}
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              {index > 0 && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => moveImage(index, index - 1)}
                                >
                                  ←
                                </Button>
                              )}
                              {index < images.length - 1 && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => moveImage(index, index + 1)}
                                >
                                  →
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">📸 Photo tips:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Use good lighting and clear focus</li>
                        <li>• Show the item from multiple angles</li>
                        <li>• Include close-ups of any defects or wear</li>
                        <li>• First photo will be the main image</li>
                        <li>• Include original packaging if available</li>
                        <li>• Take photos in a clean, uncluttered space</li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: Pricing & Location */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="price">Selling Price (USD) *</Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8"
                          value={formData.price}
                          onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="original_price">Original Price (Optional)</Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8"
                          value={formData.original_price}
                          onChange={(e) => setFormData((prev) => ({ ...prev, original_price: e.target.value }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Show buyers how much they're saving</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="price_negotiable"
                      checked={formData.price_negotiable}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, price_negotiable: checked }))}
                    />
                    <Label htmlFor="price_negotiable" className="flex items-center gap-2">
                      💬 Price is negotiable
                    </Label>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="pickup_location">Pickup Location *</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="pickup_location"
                        placeholder="e.g., UZ Main Campus, Library Building"
                        className="pl-10"
                        value={formData.pickup_location}
                        onChange={(e) => setFormData((prev) => ({ ...prev, pickup_location: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Specify where buyers can collect the item</p>
                  </div>

                  <div>
                    <Label htmlFor="university">University/Institution</Label>
                    <Select
                      value={formData.university_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, university_id: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select your institution" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.id} value={university.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{university.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {university.location} • {university.type}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="delivery_available"
                        checked={formData.delivery_available}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, delivery_available: checked }))}
                      />
                      <Label htmlFor="delivery_available" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Delivery available
                      </Label>
                    </div>

                    {formData.delivery_available && (
                      <div>
                        <Label htmlFor="delivery_fee">Delivery Fee (USD)</Label>
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="delivery_fee"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            value={formData.delivery_fee}
                            onChange={(e) => setFormData((prev) => ({ ...prev, delivery_fee: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="whatsapp_contact"
                      checked={formData.whatsapp_contact}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, whatsapp_contact: checked }))}
                    />
                    <Label htmlFor="whatsapp_contact" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      Allow WhatsApp contact
                    </Label>
                  </div>

                  <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">💰 Pricing tips:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Research similar items to price competitively</li>
                        <li>• Consider the item's age and condition</li>
                        <li>• Leave room for negotiation if you're flexible</li>
                        <li>• Be realistic about depreciation</li>
                        <li>• Factor in delivery costs if offering delivery</li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Review Your Listing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Basic Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Title:</span>
                              <span className="font-medium">{formData.title}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Category:</span>
                              <span className="flex items-center gap-2">
                                {(() => {
                                  const meta = getCategoryMetaById(formData.category_id);
                                  const Icon = meta?.icon || Package;
                                  return <Icon className="h-4 w-4" />;
                                })()}
                                {categories.find((c) => c.id === formData.category_id)?.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Condition:</span>
                              <Badge variant="secondary">{formData.condition}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-bold text-primary">${formData.price}</span>
                            </div>
                            {formData.original_price && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Original Price:</span>
                                <span className="line-through text-muted-foreground">${formData.original_price}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Images ({images.length})</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {images.slice(0, 6).map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(image) || "/placeholder.svg"}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full aspect-square object-cover rounded"
                                />
                                {index === 0 && <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>}
                              </div>
                            ))}
                            {images.length > 6 && (
                              <div className="w-full aspect-square bg-muted rounded flex items-center justify-center text-xs">
                                +{images.length - 6} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{formData.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Location & Delivery</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {formData.pickup_location}
                            </div>
                            {formData.delivery_available && (
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Delivery available (${formData.delivery_fee || "0"})
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Contact Options</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Campus Market messaging
                            </div>
                            {formData.whatsapp_contact && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-600" />
                                WhatsApp contact
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <div className="text-sm">
                          <p className="font-medium">Before you publish:</p>
                          <ul className="text-xs mt-1 space-y-1">
                            <li>✓ All information is accurate and complete</li>
                            <li>✓ Photos clearly show the item's condition</li>
                            <li>✓ Price is fair and competitive</li>
                            <li>✓ Description is honest and detailed</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} disabled={!canProceed()} className="flex items-center gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submitListing} disabled={isSubmitting || !canProceed()} className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Publish Listing
                </>
              )}
            </Button>
          )}
        </div>

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Uploading images...</span>
              </div>
              <Progress value={uploadProgress} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
