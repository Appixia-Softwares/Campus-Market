"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Home, MapPin, ImageIcon, X, User, Upload, Building, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const amenitiesList = [
  "Wifi",
  "Furnished",
  "Utilities Included",
  "Study Desk",
  "Kitchenette",
  "Security",
  "Laundry Room",
  "Parking",
  "Air Conditioning",
  "Heating",
  "Balcony",
  "Garden",
  "Gym Access",
  "Swimming Pool",
  "24/7 Security",
  "CCTV",
  "Elevator",
  "Wheelchair Accessible",
  "Pet Friendly",
  "Smoking Allowed",
]

const propertyTypes = ["studio", "apartment", "house", "room", "shared-room", "dormitory"]

interface FormData {
  title: string
  propertyType: string
  description: string
  longDescription: string
  address: string
  campusLocation: string
  price: string
  beds: string
  baths: string
  phone: string
  email: string
}

export default function AccommodationFormDialogContent({ onSuccess }: { onSuccess?: () => void }) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    propertyType: "",
    description: "",
    longDescription: "",
    address: "",
    campusLocation: "",
    price: "",
    beds: "",
    baths: "",
    phone: "",
    email: "",
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))
  }

  const handleImageUpload = () => {
    const newImage = `/placeholder.svg?height=200&width=300&text=Image${images.length + 1}`
    setImages((prev) => [...prev, newImage])
    toast({
      title: "Image Added",
      description: "Photo has been added to your listing.",
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "Image Removed",
      description: "Photo has been removed from your listing.",
    })
  }

  // Enhanced validation function
  const validateCurrentTab = (tab: string): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = []

    if (tab === "basic") {
      if (!formData.title.trim()) missingFields.push("Property Title")
      if (!formData.propertyType) missingFields.push("Property Type")
      if (!formData.description.trim()) missingFields.push("Short Description")
      if (!formData.longDescription.trim()) missingFields.push("Detailed Description")
      if (!formData.address.trim()) missingFields.push("Full Address")
      if (!formData.campusLocation) missingFields.push("Campus/Area")
    }

    if (tab === "details") {
      if (!formData.price.trim()) missingFields.push("Monthly Rent")
      if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
        missingFields.push("Valid Monthly Rent Amount")
      }
    }

    if (tab === "contact") {
      if (!formData.phone.trim()) missingFields.push("Phone Number")
      if (!formData.email.trim()) missingFields.push("Email Address")

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (formData.email && !emailRegex.test(formData.email)) {
        missingFields.push("Valid Email Address")
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    }
  }

  const handleNext = () => {
    console.log("Next button clicked, current tab:", currentTab)
    console.log("Current form data:", formData)

    const validation = validateCurrentTab(currentTab)
    console.log("Validation result:", validation)

    if (!validation.isValid) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill out: ${validation.missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    const tabs = ["basic", "details", "images", "contact"]
    const currentIndex = tabs.indexOf(currentTab)
    console.log("Current index:", currentIndex, "Next index:", currentIndex + 1)

    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1]
      console.log("Moving to next tab:", nextTab)
      setCurrentTab(nextTab)
      toast({
        title: "Progress Saved",
        description: `Moving to ${nextTab.replace("-", " ")} section.`,
      })
    }
  }

  const handlePrevious = () => {
    const tabs = ["basic", "details", "images", "contact"]
    const currentIndex = tabs.indexOf(currentTab)
    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all required tabs before submission
    const basicValidation = validateCurrentTab("basic")
    const detailsValidation = validateCurrentTab("details")
    const contactValidation = validateCurrentTab("contact")

    if (!basicValidation.isValid || !detailsValidation.isValid || !contactValidation.isValid) {
      const allMissingFields = [
        ...basicValidation.missingFields,
        ...detailsValidation.missingFields,
        ...contactValidation.missingFields,
      ]

      toast({
        title: "Form Incomplete",
        description: `Please fill out: ${allMissingFields.join(", ")}`,
        variant: "destructive",
      })
      setCurrentTab("basic")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Property Listed Successfully!",
        description: "Your accommodation has been added to our platform.",
      })

      // Reset form
      setFormData({
        title: "",
        propertyType: "",
        description: "",
        longDescription: "",
        address: "",
        campusLocation: "",
        price: "",
        beds: "",
        baths: "",
        phone: "",
        email: "",
      })
      setSelectedAmenities([])
      setImages([])
      setCurrentTab("basic")

      if (onSuccess) onSuccess()
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error listing your property. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to check if current tab is valid
  const isCurrentTabValid = () => {
    return validateCurrentTab(currentTab).isValid
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white relative"
            >
              Basic Info
              {!validateCurrentTab("basic").isValid && currentTab !== "basic" && (
                <AlertCircle className="h-4 w-4 text-red-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white relative"
            >
              Property Details
              {!validateCurrentTab("details").isValid && currentTab !== "details" && (
                <AlertCircle className="h-4 w-4 text-red-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Photos
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white relative"
            >
              Contact Info
              {!validateCurrentTab("contact").isValid && currentTab !== "contact" && (
                <AlertCircle className="h-4 w-4 text-red-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-green-800">
                  <Home className="h-5 w-5 mr-2" />
                  Basic Information
                  {!validateCurrentTab("basic").isValid && <AlertCircle className="h-5 w-5 ml-2 text-red-500" />}
                </CardTitle>
                <CardDescription>Tell us about your property and what makes it special</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-green-700 font-medium">
                      Property Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., Modern Studio Apartment"
                      className={`border-green-200 focus:border-green-500 ${
                        !formData.title.trim() ? "border-red-300 focus:border-red-500" : ""
                      }`}
                      required
                    />
                    {!formData.title.trim() && <p className="text-red-500 text-sm">Property title is required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-700 font-medium">Property Type *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => handleInputChange("propertyType", value)}
                    >
                      <SelectTrigger
                        className={`border-green-200 focus:border-green-500 ${
                          !formData.propertyType ? "border-red-300 focus:border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.propertyType && <p className="text-red-500 text-sm">Property type is required</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-green-700 font-medium">
                    Short Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    maxLength={200}
                    placeholder="Brief description of your property (max 200 characters)"
                    rows={3}
                    className={`border-green-200 focus:border-green-500 resize-none ${
                      !formData.description.trim() ? "border-red-300 focus:border-red-500" : ""
                    }`}
                    required
                  />
                  <div className="flex justify-between">
                    {!formData.description.trim() && (
                      <p className="text-red-500 text-sm">Short description is required</p>
                    )}
                    <div className="text-sm text-gray-500 ml-auto">{formData.description.length}/200 characters</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longDescription" className="text-green-700 font-medium">
                    Detailed Description *
                  </Label>
                  <Textarea
                    id="longDescription"
                    value={formData.longDescription}
                    onChange={(e) => handleInputChange("longDescription", e.target.value)}
                    rows={5}
                    placeholder="Provide a detailed description of your property, including what makes it special for students..."
                    className={`border-green-200 focus:border-green-500 resize-none ${
                      !formData.longDescription.trim() ? "border-red-300 focus:border-red-500" : ""
                    }`}
                    required
                  />
                  {!formData.longDescription.trim() && (
                    <p className="text-red-500 text-sm">Detailed description is required</p>
                  )}
                </div>

                <Separator className="bg-green-200" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center text-green-800">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-green-700 font-medium">
                        Full Address *
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="123 University Ave, Campus Town"
                        className={`border-green-200 focus:border-green-500 ${
                          !formData.address.trim() ? "border-red-300 focus:border-red-500" : ""
                        }`}
                        required
                      />
                      {!formData.address.trim() && <p className="text-red-500 text-sm">Full address is required</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-700 font-medium">Campus/Area *</Label>
                      <Select
                        value={formData.campusLocation}
                        onValueChange={(value) => handleInputChange("campusLocation", value)}
                      >
                        <SelectTrigger
                          className={`border-green-200 focus:border-green-500 ${
                            !formData.campusLocation ? "border-red-300 focus:border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select campus area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main-campus">Main Campus</SelectItem>
                          <SelectItem value="north-campus">North Campus</SelectItem>
                          <SelectItem value="south-campus">South Campus</SelectItem>
                          <SelectItem value="downtown">Downtown</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {!formData.campusLocation && (
                        <p className="text-red-500 text-sm">Campus/Area selection is required</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROPERTY DETAILS TAB */}
          <TabsContent value="details" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-green-800">
                  <Building className="h-5 w-5 mr-2" />
                  Property Details
                  {!validateCurrentTab("details").isValid && <AlertCircle className="h-5 w-5 ml-2 text-red-500" />}
                </CardTitle>
                <CardDescription>Provide specific details about your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-green-700 font-medium">
                      Monthly Rent (USD) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="e.g., 250"
                      className={`border-green-200 focus:border-green-500 ${
                        !formData.price.trim() ||
                        (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) <= 0))
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    {(!formData.price.trim() ||
                      (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) <= 0))) && (
                      <p className="text-red-500 text-sm">Valid monthly rent is required</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beds" className="text-green-700 font-medium">
                      Bedrooms
                    </Label>
                    <Input
                      id="beds"
                      type="number"
                      value={formData.beds}
                      onChange={(e) => handleInputChange("beds", e.target.value)}
                      placeholder="1"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baths" className="text-green-700 font-medium">
                      Bathrooms
                    </Label>
                    <Input
                      id="baths"
                      type="number"
                      value={formData.baths}
                      onChange={(e) => handleInputChange("baths", e.target.value)}
                      placeholder="1"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                </div>

                <Separator className="bg-green-200" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-800">Amenities & Features</h3>
                  <p className="text-sm text-gray-600">Select all amenities that apply to your property</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                          className="border-green-300 data-[state=checked]:bg-green-600"
                        />
                        <Label htmlFor={amenity} className="text-sm cursor-pointer">
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedAmenities.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Selected amenities ({selectedAmenities.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAmenities.map((amenity) => (
                          <span key={amenity} className="bg-green-200 text-green-800 px-2 py-1 rounded-md text-xs">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMAGES TAB */}
          <TabsContent value="images" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-green-800">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Property Photos
                </CardTitle>
                <CardDescription>
                  Add high-quality photos to showcase your property. The first image will be the main photo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Property image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-green-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {idx === 0 && (
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Main Photo
                        </div>
                      )}
                    </div>
                  ))}
                  {images.length < 8 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUpload}
                      className="border-2 border-dashed border-green-300 w-full h-32 rounded-lg flex flex-col justify-center items-center text-green-600 hover:bg-green-50 hover:border-green-400 bg-transparent"
                    >
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-sm">Add Photo</span>
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-600 bg-green-50 p-4 rounded-lg">
                  <p>• Upload at least 3 photos for better visibility</p>
                  <p>• Recommended size: 1200x800 pixels</p>
                  <p>• Supported formats: JPG, PNG, WebP</p>
                  <p>• Current photos: {images.length}/8</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT INFO TAB */}
          <TabsContent value="contact" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-green-800">
                  <User className="h-5 w-5 mr-2" />
                  Contact Information
                  {!validateCurrentTab("contact").isValid && <AlertCircle className="h-5 w-5 ml-2 text-red-500" />}
                </CardTitle>
                <CardDescription>Provide your contact details so interested students can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-green-700 font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+263 77 123 4567"
                      className={`border-green-200 focus:border-green-500 ${
                        !formData.phone.trim() ? "border-red-300 focus:border-red-500" : ""
                      }`}
                      required
                    />
                    {!formData.phone.trim() && <p className="text-red-500 text-sm">Phone number is required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-green-700 font-medium">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                      className={`border-green-200 focus:border-green-500 ${
                        !formData.email.trim() || (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    {(!formData.email.trim() ||
                      (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))) && (
                      <p className="text-red-500 text-sm">Valid email address is required</p>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Contact Information Summary:</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Phone:</strong> {formData.phone || "Not provided"}
                    </p>
                    <p>
                      <strong>Email:</strong> {formData.email || "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentTab === "basic"}
            className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
          >
            Previous
          </Button>

          {currentTab === "contact" ? (
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  List Property
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className={`text-white transition-all duration-200 ${
                isCurrentTabValid() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 hover:bg-gray-500"
              }`}
            >
              Next
            </Button>
          )}
        </div>

        {/* Debug info (remove in production) */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
          <p>
            <strong>Current Tab:</strong> {currentTab}
          </p>
          <p>
            <strong>Tab Valid:</strong> {isCurrentTabValid() ? "Yes" : "No"}
          </p>
          <p>
            <strong>Missing Fields:</strong> {validateCurrentTab(currentTab).missingFields.join(", ") || "None"}
          </p>
        </div>
      </form>
    </div>
  )
}
