"use client"

import React from "react"

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
import { Home, MapPin, ImageIcon, X, User, Upload, Building, CheckCircle, AlertCircle, Check, Bed, Users, Wifi, ParkingCircle, Utensils, WashingMachine, Sparkles, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { uploadFileToStorage } from "@/lib/firebase"
import ZIM_UNIVERSITIES from "@/utils/schools_data"
import confetti from "canvas-confetti"

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

const propertyTypes = [
  { value: "house", label: "House" },
  { value: "cottage", label: "Cottage" },
  { value: "flat", label: "Flat" },
  { value: "apartment", label: "Apartment" },
  { value: "boarding_house", label: "Boarding House" },
  { value: "hostel", label: "Hostel/Dormitory" },
  { value: "single_room", label: "Full Room (Single)" },
  { value: "2_sharing", label: "Room - 2 Sharing" },
  { value: "3_sharing", label: "Room - 3 Sharing" },
  { value: "4_sharing", label: "Room - 4 Sharing" },
  { value: "other", label: "Other (specify)" }
];

interface FormData {
  title: string
  propertyType: string
  description: string
  longDescription: string
  address: string
  university: string
  campusLocation: string
  price: string
  beds: string
  baths: string
  phone: string
  email: string
  customPropertyType?: string; // Added for custom property type
}

export default function AccommodationFormDialogContent({ onSuccess }: { onSuccess?: () => void }) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    propertyType: "",
    description: "",
    longDescription: "",
    address: "",
    university: user?.university_id || "",
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

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const path = `accommodation-images/${user?.id}/${Date.now()}-${file.name}`
      // Use uploadBytesResumable for progress (if available)
      const url = await uploadFileToStorage(path, file)
      setImages((prev) => [...prev, url])
      toast({ title: "Image Uploaded", description: "Photo has been uploaded.", })
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
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
      if (!formData.university) missingFields.push("University")
      if (!formData.campusLocation) missingFields.push("Campus/Area")
    }

    if (tab === "details") {
      if (!formData.price.trim()) missingFields.push("Monthly Rent")
      if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
        missingFields.push("Valid Monthly Rent Amount")
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

    const tabs = ["basic", "details", "images", "preview"]
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
    const tabs = ["basic", "details", "images", "preview"]
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

    if (!basicValidation.isValid || !detailsValidation.isValid) {
      const allMissingFields = [
        ...basicValidation.missingFields,
        ...detailsValidation.missingFields,
      ]

      toast({
        title: "Form Incomplete",
        description: `Please fill out: ${allMissingFields.join(", ")}`,
        variant: "destructive",
      })
      setCurrentTab("basic")
      return
    }

    if (images.length < 3) {
      toast({
        title: "Not Enough Images",
        description: "You must upload at least three images to list your property.",
        variant: "destructive",
      })
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
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
      })

      // Reset form
      setFormData({
        title: "",
        propertyType: "",
        description: "",
        longDescription: "",
        address: "",
        university: user?.university_id || "",
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

  // Add a stepper at the top
  const steps = [
    { key: "basic", label: "Basic Info", icon: Home },
    { key: "details", label: "Details", icon: Bed },
    { key: "images", label: "Photos", icon: ImageIcon },
    { key: "preview", label: "Preview", icon: CheckCircle },
  ]

  // Expanded mapping for Zimbabwe universities
  const UNIVERSITY_CAMPUSES: Record<string, string[]> = {
    uz: [
      "Mount Pleasant (Main Campus)",
      "College of Health Sciences",
      "City Campus",
      "Faculty of Engineering",
      "Faculty of Law",
      "Faculty of Education",
      "Faculty of Science",
      "Faculty of Social Studies",
      "Faculty of Arts",
      "Faculty of Agriculture",
      "Faculty of Commerce",
      "Faculty of Veterinary Science"
    ],
    nust: [
      "Main Campus (Ascot, Bulawayo)",
      "Extension Campus (City Center, Bulawayo)"
    ],
    msu: [
      "Gweru Main Campus",
      "Zvishavane Campus",
      "Harare Campus",
      "Mutare Campus"
    ],
    gzu: [
      "Masvingo Main Campus",
      "Mashava Campus",
      "City Campus"
    ],
    chu: [
      "Chinhoyi Main Campus"
    ],
    bindura: [
      "Bindura Main Campus"
    ],
    lsz: [
      "Lupane Main Campus"
    ],
    marondera: [
      "Main Campus"
    ],
    gwanda: [
      "Epoch Mine Campus"
    ],
    manicaland: [
      "Fern Valley Campus",
      "Mutare City Campus"
    ],
    hit: [
      "Main Campus (Harare)"
    ],
    wua: [
      "Harare Campus",
      "Marondera Campus"
    ],
    african: [
      "Mutare Campus"
    ],
    solusi: [
      "Bulawayo Campus"
    ],
    zou: [
      "Harare Regional Campus",
      "Bulawayo Regional Campus",
      "Mutare Regional Campus",
      "Gweru Regional Campus",
      "Masvingo Regional Campus",
      "Chinhoyi Regional Campus"
    ],
    reformed: [
      "Masvingo Campus"
    ],
    cuz: [
      "Harare Campus"
    ],
    zsm: [
      "Bulawayo Campus"
    ],
    // Add more as needed...
  };

  const mappedCampuses = formData.university && UNIVERSITY_CAMPUSES[formData.university];
  const campusOptions = mappedCampuses && mappedCampuses.length > 0 ? mappedCampuses : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Modern stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${currentTab === step.key ? 'border-green-600 bg-green-100 text-green-700' : 'border-gray-300 bg-white text-gray-400'} font-bold text-lg mb-1 transition-all`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${currentTab === step.key ? 'text-green-700' : 'text-gray-400'}`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="relative">
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
            <TabsTrigger value="preview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white relative">
              Preview
            </TabsTrigger>
          </TabsList>

          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-background">
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
                      onValueChange={value => {
                        handleInputChange("propertyType", value);
                        if (value !== "other") handleInputChange("customPropertyType", "");
                      }}
                    >
                      <SelectTrigger className={`border-green-200 focus:border-green-500 ${!formData.propertyType ? "border-red-300 focus:border-red-500" : ""}`}>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.propertyType === "other" && (
                      <Input
                        value={formData.customPropertyType || ""}
                        onChange={e => handleInputChange("customPropertyType", e.target.value)}
                        placeholder="Specify property type"
                        className="border-green-200 focus:border-green-500 mt-2"
                        required
                      />
                    )}
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
                      <Label className="text-green-700 font-medium">University *</Label>
                      <Select
                        value={formData.university}
                        onValueChange={value => setFormData(prev => ({ ...prev, university: value, campusLocation: "" }))}
                      >
                        <SelectTrigger className={`border-green-200 focus:border-green-500 ${!formData.university ? "border-red-300 focus:border-red-500" : ""}`}>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          {ZIM_UNIVERSITIES.filter(u => u.type === "university").map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.location})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!formData.university && <p className="text-red-500 text-sm">University selection is required</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-700 font-medium">Campus/Area *</Label>
                      {campusOptions ? (
                        <Select
                          value={formData.campusLocation}
                          onValueChange={value => setFormData(prev => ({ ...prev, campusLocation: value }))}
                          disabled={!formData.university}
                        >
                          <SelectTrigger className={`border-green-200 focus:border-green-500 ${!formData.campusLocation ? "border-red-300 focus:border-red-500" : ""}`}>
                            <SelectValue placeholder="Select campus/area" />
                          </SelectTrigger>
                          <SelectContent>
                            {campusOptions.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={formData.campusLocation}
                          onChange={e => setFormData(prev => ({ ...prev, campusLocation: e.target.value }))}
                          placeholder="Enter campus or area name"
                          className={`border-green-200 focus:border-green-500 ${!formData.campusLocation ? "border-red-300 focus:border-red-500" : ""}`}
                          disabled={!formData.university}
                        />
                      )}
                      {!formData.campusLocation && <p className="text-red-500 text-sm">Campus/Area selection is required</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROPERTY DETAILS TAB */}
          <TabsContent value="details" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-background">
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
                  {/* Replace amenities checkboxes with Lucide icon badges in a grid */}
                  <div className="space-y-2">
                    <Label className="text-green-700 font-medium">Amenities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {amenitiesList.map((amenity) => {
                        // Pick an icon for each amenity (fallback to Sparkles)
                        let Icon = Sparkles
                        if (amenity.toLowerCase().includes("wifi")) Icon = Wifi
                        if (amenity.toLowerCase().includes("furnished")) Icon = Home
                        if (amenity.toLowerCase().includes("laundry")) Icon = WashingMachine
                        if (amenity.toLowerCase().includes("kitchen")) Icon = Utensils
                        if (amenity.toLowerCase().includes("parking")) Icon = ParkingCircle
                        if (amenity.toLowerCase().includes("security")) Icon = ShieldCheck
                        return (
                          <button
                            type="button"
                            key={amenity}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedAmenities.includes(amenity) ? 'bg-green-100 border-green-600 text-green-700' : 'bg-white border-gray-200 text-gray-500'} hover:border-green-400 focus:outline-none`}
                            onClick={() => handleAmenityToggle(amenity)}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-xs font-medium">{amenity}</span>
                            {selectedAmenities.includes(amenity) && <Check className="h-3 w-3 ml-1 text-green-600" />}
                          </button>
                        )
                      })}
                    </div>
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
              <CardHeader className="bg-background">
                <CardTitle className="flex items-center text-green-800">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Photos
                </CardTitle>
                <CardDescription>Upload high-quality images of your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col items-center">
                  {/* Instructions */}
                  <div className="mb-4 text-center">
                    <p className="text-green-400 font-medium">You must upload at least <span className="font-bold">3 images</span> to list your property.</p>
                    <p className="text-xs text-muted-foreground">First image will be the main photo. Recommended: 1200x800px, JPG/PNG/WebP.</p>
                  </div>
                  {/* Upload area */}
                  <label htmlFor="accom-image-upload" className="w-full max-w-md cursor-pointer border-2 border-dashed border-green-400 rounded-lg p-6 flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 focus-within:ring-2 focus-within:ring-green-400 transition-all mb-4 outline-none">
                    <ImageIcon className="h-10 w-10 text-green-400 mb-2" />
                    <span className="text-green-700 font-medium mb-2">Drag & drop or click to upload</span>
                    <Button variant="default" asChild tabIndex={0}>
                      <span><Upload className="h-4 w-4 mr-2" /> Add Image</span>
                    </Button>
                    <input type="file" accept="image/*" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(handleImageUpload) }} className="hidden" id="accom-image-upload" />
                  </label>
                  {/* Image previews */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Property ${idx + 1}`} className="rounded-lg w-full h-32 object-cover border border-green-200" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow hover:bg-red-100"
                            onClick={() => removeImage(idx)}
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">Main</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Validation warning if less than 3 images */}
                  {images.length < 3 && (
                    <div className="mt-2 text-red-500 text-sm font-medium">You must upload at least three images to continue.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-background">
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Preview & Confirm
                </CardTitle>
                <CardDescription>Review your listing before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">Property Info</h3>
                    <p><strong>Type:</strong> {formData.propertyType === "other" ? formData.customPropertyType : propertyTypes.find(t => t.value === formData.propertyType)?.label}</p>
                    <p><strong>Title:</strong> {formData.title}</p>
                    <p><strong>Description:</strong> {formData.description}</p>
                    <p><strong>Details:</strong> {formData.longDescription}</p>
                    <p><strong>Address:</strong> {formData.address}</p>
                    <p><strong>University:</strong> {ZIM_UNIVERSITIES.find(u => u.id === formData.university)?.name || formData.university}</p>
                    <p><strong>Campus/Area:</strong> {formData.campusLocation}</p>
                    <p><strong>Price:</strong> ${formData.price}</p>
                    <p><strong>Beds:</strong> {formData.beds}</p>
                    <p><strong>Baths:</strong> {formData.baths}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedAmenities.map((amenity) => (
                        <span key={amenity} className="bg-green-200 text-green-800 px-2 py-1 rounded-md text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-green-700 mb-2">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt={`Preview ${idx + 1}`} className="rounded-lg w-full h-24 object-cover border border-green-200" />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">Main</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <h3 className="font-semibold text-green-700 mt-4 mb-2">Seller Info</h3>
                    <p><strong>Name:</strong> {user?.full_name || user?.email}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    {user?.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Sticky footer for navigation buttons */}
        <div className="sticky bottom-0 left-0 w-full bg-background border-t border-green-900/20 py-4 flex justify-between gap-4 z-10 px-6 mt-8">
          <Button variant="outline" type="button" onClick={handlePrevious} disabled={currentTab === "basic" || isSubmitting}>
            Back
          </Button>
          {currentTab !== "preview" ? (
            <Button type="button" onClick={handleNext} disabled={!isCurrentTabValid() || isSubmitting}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          )}
        </div>

        {/* Debug info (remove in production) */}
        <div className="mt-4 p-4 bg-background text-green-200 rounded-lg text-xs opacity-80">
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
