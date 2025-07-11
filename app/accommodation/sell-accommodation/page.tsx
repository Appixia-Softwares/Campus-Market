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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Building,
  Upload,
  MapPin,
  DollarSign,
  Home,
  User,
  Phone,
  Mail,
  CheckCircle,
  X,
  ImageIcon,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

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

export default function SellAccommodationForm() {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast();

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))
  }

  const handleImageUpload = () => {
    // In a real app, this would handle file upload
    const newImage = `/placeholder.svg?height=200&width=300&text=Image${images.length + 1}`
    setImages((prev) => [...prev, newImage])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all required fields
    const title = (document.getElementById("title") as HTMLInputElement)?.value.trim();
    const type = (document.getElementById("type") as HTMLInputElement)?.value.trim();
    const description = (document.getElementById("description") as HTMLTextAreaElement)?.value.trim();
    const longDescription = (document.getElementById("longDescription") as HTMLTextAreaElement)?.value.trim();
    const address = (document.getElementById("address") as HTMLInputElement)?.value.trim();
    const location = (document.getElementById("location") as HTMLInputElement)?.value.trim();
    const price = (document.getElementById("price") as HTMLInputElement)?.value.trim();
    // Add more fields as needed

    if (!title || !description || !longDescription || !address || !price) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    toast({
      title: "Success!",
      description: "Your property has been listed.",
      variant: "default",
    });
    // Optionally reset form or redirect
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">List Your Accommodation</h1>
        <p className="text-muted-foreground">
          Help students find their perfect home near campus
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Property Details</TabsTrigger>
            <TabsTrigger value="images">Photos</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>Tell us about your property and what makes it special</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Property Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Modern Studio Apartment"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Property Type *</Label>
                    <Select required>
                      <SelectTrigger>
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your property (max 200 characters)"
                    maxLength={200}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longDescription">Detailed Description *</Label>
                  <Textarea
                    id="longDescription"
                    placeholder="Provide a detailed description of your property, including what makes it special for students..."
                    rows={6}
                    required
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address *</Label>
                      <Input
                        id="address"
                        placeholder="123 University Ave, Campus Town"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Campus/Area *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select campus area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main-campus">Main Campus</SelectItem>
                          <SelectItem value="north-campus">North Campus</SelectItem>
                          <SelectItem value="south-campus">South Campus</SelectItem>
                          <SelectItem value="downtown">Downtown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Property Details
                </CardTitle>
                <CardDescription>Specify the details and amenities of your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Rent *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beds">Bedrooms</Label>
                    <Input
                      id="beds"
                      type="number"
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baths">Bathrooms</Label>
                    <Input
                      id="baths"
                      type="number"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                        />
                        <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Photos
                </CardTitle>
                <CardDescription>Upload photos of your property (up to 8 images)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
                <CardDescription>How potential tenants can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+263 77 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const tabs = ["basic", "details", "images", "contact"];
              const currentIndex = tabs.indexOf(currentTab);
              if (currentIndex > 0) {
                setCurrentTab(tabs[currentIndex - 1]);
              }
            }}
            disabled={currentTab === "basic"}
          >
            Previous
          </Button>
          {currentTab === "contact" ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "List Property"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                const tabs = ["basic", "details", "images", "contact"];
                const currentIndex = tabs.indexOf(currentTab);
                if (currentIndex < tabs.length - 1) {
                  setCurrentTab(tabs[currentIndex + 1]);
                }
              }}
            >
              Next
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
