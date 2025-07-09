"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { createProduct, createProductImages, Product } from "@/lib/firebase-service"
import { ProtectedRoute } from '@/components/protected-route'
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, writeBatch, doc } from "firebase/firestore"
import { getCategories, getLocations } from "@/lib/firebase-service"
import { useAuth } from "@/lib/auth-context"

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Please enter a valid price"),
  original_price: z.string().optional(),
  category_id: z.string().min(1, "Please select a category"),
  condition: z.string().min(1, "Please select the condition"),
  brand: z.string().optional(),
  model: z.string().optional(),
  year_purchased: z.string().optional(),
  location_id: z.string().min(1, "Please select a location"),
  tags: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  images: z.array(z.string())
    .min(1, "Please upload at least one image")
    .max(8, "You can upload up to 8 images")
    .refine(
      (images) => images.length >= 1,
      "At least one image is required"
    ),
})

const conditions = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
]

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
  product_count: number;
  created_at: {
    seconds: number;
    nanoseconds: number;
  };
  updated_at: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Location {
  id: string;
  name: string;
  city: string;
  province: string | null;
  country: string;
  is_university_area: boolean;
  university_id: string | null;
  university?: {
    id: string;
    name: string;
  } | null;
}

// Default categories if none exist
const defaultCategories = [
  {
    name: 'Textbooks',
    description: 'Academic books and study materials',
    icon: 'book',
    color: '#4CAF50',
    sort_order: 1,
    is_active: true
  },
  {
    name: 'Electronics',
    description: 'Laptops, phones, and other electronic devices',
    icon: 'laptop',
    color: '#2196F3',
    sort_order: 2,
    is_active: true
  },
  {
    name: 'Furniture',
    description: 'Dorm furniture and study desks',
    icon: 'chair',
    color: '#FF9800',
    sort_order: 3,
    is_active: true
  },
  {
    name: 'Clothing',
    description: 'University merchandise and casual wear',
    icon: 'tshirt',
    color: '#9C27B0',
    sort_order: 4,
    is_active: true
  }
];

export default function SellPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      original_price: "",
      category_id: "",
      condition: "",
      brand: "",
      model: "",
      year_purchased: "",
      location_id: "",
      tags: "",
      color: "",
      size: "",
      material: "",
      images: [],
    },
  })

  const progress = (step / 4) * 100

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      console.log("Debug - Starting form submission with values:", {
        ...values,
        images: values.images?.length || 0
      })

      if (!user) {
      toast({
          title: "Authentication Required",
          description: "Please sign in to create a listing",
        variant: "destructive",
      })
      return
    }

      // Show initial loading toast
      toast({
        title: "Processing",
        description: "Starting to create your listing...",
      })

      // Validate required fields
      const requiredFields = {
        title: !values.title,
        description: !values.description,
        price: !values.price,
        category_id: !values.category_id,
        condition: !values.condition,
        location_id: !values.location_id
      }
      
      console.log("Debug - Required fields validation:", requiredFields)

      if (Object.values(requiredFields).some(Boolean)) {
        console.error("Debug - Missing required fields:", requiredFields)
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Validate price is a positive number
      const price = parseFloat(values.price)
      console.log("Debug - Price validation:", { raw: values.price, parsed: price })
      
      if (isNaN(price) || price <= 0) {
        console.error("Debug - Invalid price:", { raw: values.price, parsed: price })
        toast({
          title: "Validation Error",
          description: "Please enter a valid price",
          variant: "destructive",
        })
        return
      }

      // Validate year_purchased if provided
      let yearPurchased = null
      if (values.year_purchased) {
        yearPurchased = parseInt(values.year_purchased)
        console.log("Debug - Year purchased validation:", { raw: values.year_purchased, parsed: yearPurchased })
        
        if (isNaN(yearPurchased) || yearPurchased < 1900 || yearPurchased > new Date().getFullYear()) {
          console.error("Debug - Invalid year purchased:", { raw: values.year_purchased, parsed: yearPurchased })
          toast({
            title: "Validation Error",
            description: "Please enter a valid year",
            variant: "destructive",
          })
          return
        }
      }

      // Validate original_price if provided
      let originalPrice = null
      if (values.original_price) {
        originalPrice = parseFloat(values.original_price)
        console.log("Debug - Original price validation:", { raw: values.original_price, parsed: originalPrice })
        
        if (isNaN(originalPrice) || originalPrice <= 0) {
          console.error("Debug - Invalid original price:", { raw: values.original_price, parsed: originalPrice })
          toast({
            title: "Validation Error",
            description: "Please enter a valid original price",
            variant: "destructive",
          })
          return
        }
      }

      console.log("Debug - User authenticated:", { userId: user.id })
      toast({
        title: "Processing",
        description: "Creating your product listing...",
      })

      // Parse tags from comma-separated string
      const tags = values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
      console.log("Debug - Parsed tags:", tags)
      
      // Parse specifications
      const specs = {
        color: values.color ? [values.color] : null,
        size: values.size ? [values.size] : null,
        material: values.material ? [values.material] : null,
      }
      console.log("Debug - Parsed specifications:", specs)

      // Create product in Firebase
      const newProduct: Omit<Product, 'id'> = {
        title: values.title,
        description: values.description,
        price: price,
        original_price: originalPrice,
        category_id: values.category_id,
        condition: values.condition,
        seller_id: user.id,
        status: 'active' as const,
        brand: values.brand || null,
        model: values.model || null,
        year_purchased: yearPurchased,
        location_id: values.location_id,
        tags: tags,
        specifications: specs,
        created_at: new Date(),
        updated_at: new Date(),
        images: [],
        seller: undefined,
        category: undefined
      }

      console.log("Debug - Creating product in Firebase:", newProduct)
      const productId = await createProduct(newProduct)

        // Create product images in Firebase
      const imageData = values.images.map((url, index) => ({
          product_id: productId,
        url: url,
        alt_text: values.title,
        is_primary: index === 0,
        sort_order: index
      }))

      console.log("Debug - Creating product images in Firebase:", imageData)
      await createProductImages(imageData)

      toast({
        title: "Success!",
        description: "Your product has been listed successfully.",
      })

      // Redirect to the product page
      router.push(`/marketplace/product/${productId}`)
    } catch (error: any) {
      console.error("Debug - Error creating product:", error)
        toast({
          title: "Error",
        description: error.message || "Failed to create product listing",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  // Function to seed categories if none exist
  const seedCategories = async () => {
      try {
      console.log("Debug - Checking if categories need to be seeded...")
      const categoriesRef = collection(db, 'product_categories')
      const categoriesSnapshot = await getDocs(categoriesRef)
      
      if (categoriesSnapshot.empty) {
        console.log("Debug - No categories found, seeding default categories...")
        const batch = writeBatch(db)
        
        for (const category of defaultCategories) {
          const docRef = doc(categoriesRef)
          batch.set(docRef, {
            ...category,
            created_at: new Date(),
            updated_at: new Date()
          })
        }
        
        await batch.commit()
        console.log("Debug - Categories seeded successfully")
        return true
      }

      console.log("Debug - Categories already exist, no seeding needed")
      return false
    } catch (error) {
      console.error("Debug - Error seeding categories:", error)
      return false
    }
  }

  // Fetch categories and locations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Debug - Starting to fetch data from Firebase")
        console.log("Debug - Firebase instance:", db ? "Initialized" : "Not initialized")
        
        // Fetch categories
        console.log("Debug - Fetching categories from Firebase...")
        const categoriesRef = collection(db, 'product_categories')
        const allCategoriesSnapshot = await getDocs(categoriesRef)
        console.log("Debug - All categories count:", allCategoriesSnapshot.size)
        
        // Process categories
        const categoriesData: Category[] = allCategoriesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            icon: data.icon || 'package',
            color: data.color || '#6B7280',
            sort_order: data.sort_order || 0,
            is_active: data.is_active ?? true,
            parent_id: data.parent_id || null,
            product_count: data.product_count || 0,
            created_at: data.created_at || { seconds: Date.now() / 1000, nanoseconds: 0 },
            updated_at: data.updated_at || { seconds: Date.now() / 1000, nanoseconds: 0 }
          }
        })
        
        categoriesData.sort((a, b) => a.sort_order - b.sort_order)
        setCategories(categoriesData)
        console.log("Debug - Categories state updated with", categoriesData.length, "categories")
        
        // Fetch locations with detailed debugging
        console.log("Debug - Starting location fetch process...")
        const locationsRef = collection(db, 'locations')
        console.log("Debug - Locations collection reference created:", locationsRef ? "Yes" : "No")
        
        // First try to get all locations without filters
        console.log("Debug - Attempting to fetch all locations first...")
        const allLocationsSnapshot = await getDocs(locationsRef)
        console.log("Debug - All locations count:", allLocationsSnapshot.size)
        
        if (allLocationsSnapshot.empty) {
          console.log("Debug - No locations found in collection")
        toast({
            title: "No Locations Found",
            description: "The locations collection is empty",
          variant: "destructive",
        })
          return
        }

        // Log each location document for debugging
        allLocationsSnapshot.forEach(doc => {
          console.log("Debug - Found location:", {
            id: doc.id,
            data: doc.data()
          })
        })
        
        // Process locations
        const locationsData: Location[] = allLocationsSnapshot.docs.map(doc => {
          const data = doc.data()
          console.log("Debug - Processing location document:", {
            id: doc.id,
            data: data
          })
          return {
            id: doc.id,
            name: data.name || '',
            city: data.city || '',
            province: data.province || null,
            country: data.country || '',
            is_university_area: data.is_university_area || false,
            university_id: data.university_id || null,
            university: data.university || null
          }
        })

        console.log("Debug - Processed locations data:", locationsData)
        
        if (locationsData.length === 0) {
          console.log("Debug - No locations after processing")
          toast({
            title: "Error",
            description: "Failed to process locations",
            variant: "destructive",
          })
          return
        }

        // Update locations state
        setLocations(locationsData)
        console.log("Debug - Locations state updated with", locationsData.length, "locations")
        
      } catch (error: any) {
        console.error("Debug - Error fetching data from Firebase:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
          name: error.name
        })
        toast({
          title: "Error Loading Data",
          description: `Failed to load data: ${error.message}`,
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  // Add debug logging for state changes
  useEffect(() => {
    console.log("Debug - Categories state updated:", categories)
  }, [categories])

  useEffect(() => {
    console.log("Debug - Locations state updated:", locations)
  }, [locations])

  return (
    <ProtectedRoute>
    <div className="container max-w-2xl py-8">
          <Card>
            <CardHeader>
          <CardTitle>List an Item for Sale</CardTitle>
          <CardDescription>Fill in the details about your item</CardDescription>
          <Progress value={progress} className="mt-4" />
            </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {step === 1 && (
                <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="What are you selling?" {...field} />
                        </FormControl>
                        <FormDescription>
                          Be specific and descriptive
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your item in detail..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include details about condition, features, and any flaws
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <FormField
                    control={form.control}
                    name="original_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Price (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormDescription>
                          The original price when you bought it
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories && categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem 
                                key={category.id} 
                                value={category.id}
                              >
                                <div className="flex items-center gap-2">
                                  {category.icon && (
                                    <span className="text-lg">{category.icon}</span>
                                  )}
                                  <span>{category.name}</span>
                                </div>
                            </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No categories available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {categories.length} categories available
                      </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {conditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Brand (Optional)</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Apple, Samsung" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Model (Optional)</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., iPhone 13, Galaxy S21" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year_purchased"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Year Purchased (Optional)</FormLabel>
                      <FormControl>
                          <Input type="number" placeholder="e.g., 2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                    <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                    </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {location.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                            {location.is_university_area ? (
                                  <>
                                    {location.university?.name || 'University Area'} - {location.city}
                                    {location.province && `, ${location.province}`}
                                  </>
                            ) : (
                                  <>
                                    {location.city}
                                    {location.province && `, ${location.province}`}
                                  </>
                            )}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select where your item is available for pickup
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., electronics, gaming, books (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add tags to help buyers find your item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                  <FormField
                    control={form.control}
                      name="color"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Color (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Black, Silver, Gold (comma-separated)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter one or more colors, separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Small, Medium, Large (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                            Enter one or more sizes, separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Metal, Glass, Plastic (comma-separated)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter one or more materials, separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Images</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            onRemove={(url) => {
                              field.onChange(field.value.filter((current) => current !== url))
                            }}
                              maxFiles={8}
                          />
                            <div className="text-sm text-muted-foreground">
                              <p>• Upload up to 8 high-quality images of your product</p>
                              <p>• First image will be the main display image</p>
                              <p>• Include images from different angles</p>
                              <p>• Show any defects or wear clearly</p>
                              <p>• Recommended size: 1000x1000 pixels</p>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Add multiple images to help buyers see your product better. The first image will be the main display image.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                          </div>
                        )}

              <div className="flex justify-between">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
                {step < 4 ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Next
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Listing"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
            </CardContent>
          </Card>
    </div>
    </ProtectedRoute>
  )
}
