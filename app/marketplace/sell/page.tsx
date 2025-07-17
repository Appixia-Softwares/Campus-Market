"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { createProduct, createProductImages, Product } from "@/lib/firebase-service"
import { uploadFileToStorage } from "@/lib/firebase";
import { ProtectedRoute } from '@/components/protected-route'
import { db } from "@/lib/firebase"
import { collection, getDocs, writeBatch, doc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Laptop, Shirt, Home, Book, Dumbbell, Car, Baby, Apple, Watch, Camera, Gamepad2, PawPrint, Sparkles, Briefcase, Globe, Gift, Music, FlaskConical, Wrench, Gem, BedDouble, Bike, Tv, Phone, Wallet, ShoppingBag, Package, Cake } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

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
  { name: 'Electronics', description: 'Phones, laptops, cameras, and more', icon: Laptop },
  { name: 'Fashion', description: 'Clothing, shoes, accessories', icon: Shirt },
  { name: 'Home & Garden', description: 'Furniture, decor, appliances', icon: Home },
  { name: 'Books & Media', description: 'Books, magazines, movies, music', icon: Book },
  { name: 'Beauty & Personal Care', description: 'Cosmetics, skincare, haircare', icon: Sparkles },
  { name: 'Sports & Outdoors', description: 'Fitness, sports gear, outdoor', icon: Dumbbell },
  { name: 'Toys & Games', description: 'Toys, board games, puzzles', icon: Gamepad2 },
  { name: 'Groceries', description: 'Food, beverages, pantry', icon: Apple },
  { name: 'Automotive', description: 'Car parts, accessories, tools', icon: Car },
  { name: 'Health & Wellness', description: 'Supplements, medical, wellness', icon: FlaskConical },
  { name: 'Jewelry & Accessories', description: 'Jewelry, watches, bags', icon: Gem },
  { name: 'Office & School', description: 'Supplies, stationery, tech', icon: Briefcase },
  { name: 'Baby & Kids', description: 'Baby gear, kids clothing, toys', icon: Baby },
  { name: 'Pet Supplies', description: 'Food, toys, accessories for pets', icon: PawPrint },
  { name: 'Gifts & Occasions', description: 'Gifts, party supplies, cakes', icon: Gift },
  { name: 'Music & Instruments', description: 'Instruments, audio, music', icon: Music },
  { name: 'Watches', description: 'Smartwatches, wristwatches', icon: Watch },
  { name: 'Cameras', description: 'Cameras, lenses, accessories', icon: Camera },
  { name: 'Gaming', description: 'Consoles, games, accessories', icon: Gamepad2 },
  { name: 'Health & Beauty', description: 'Personal care, wellness', icon: Sparkles },
  { name: 'Travel & Luggage', description: 'Bags, suitcases, travel gear', icon: Globe },
  { name: 'Furniture', description: 'Beds, sofas, tables, chairs', icon: BedDouble },
  { name: 'Weddings & Events', description: 'Wedding, event supplies', icon: Cake },
  { name: 'TV & Audio', description: 'Televisions, speakers, audio', icon: Tv },
  { name: 'Phones & Tablets', description: 'Smartphones, tablets, accessories', icon: Phone },
  { name: 'Bikes & Scooters', description: 'Bicycles, scooters, gear', icon: Bike },
  { name: 'Tools & DIY', description: 'Tools, hardware, home improvement', icon: Wrench },
  { name: 'Bags & Wallets', description: 'Handbags, wallets, purses', icon: Wallet },
  { name: 'Shoes', description: 'Sneakers, boots, sandals', icon: ShoppingBag },
];

// --- Cleaned and Polished Category Field Config ---
const categoryFieldConfig: Record<string, Array<any>> = {
  // Electronics
  Electronics: [
    { name: "title", label: "Product Name", type: "text", required: true, placeholder: "e.g., iPhone 14 Pro" },
    { name: "brand", label: "Brand", type: "text", required: true, placeholder: "e.g., Apple" },
    { name: "model", label: "Model", type: "text", required: false, placeholder: "e.g., A2650" },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Like New", "Good", "Fair", "For Parts"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "warranty", label: "Warranty", type: "text", required: false, placeholder: "e.g., 6 months" },
    { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Describe the product, features, and condition..." },
  ],
  // Fashion
  Fashion: [
    { name: "title", label: "Product Name", type: "text", required: true, placeholder: "e.g., Nike Air Max 270" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "size", label: "Size", type: "text", required: true, placeholder: "e.g., M, 42, 10" },
    { name: "color", label: "Color", type: "text", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Like New", "Good", "Fair"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Describe the item, material, fit, etc." },
  ],
  // Home & Garden
  'Home & Garden': [
    { name: "title", label: "Product Name", type: "text", required: true, placeholder: "e.g., Wooden Coffee Table" },
    { name: "material", label: "Material", type: "text", required: false, placeholder: "e.g., Oak Wood" },
    { name: "dimensions", label: "Dimensions", type: "text", required: false, placeholder: "e.g., 120x60x45cm" },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used", "Refurbished"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Describe the item, usage, and features..." },
  ],
  // Books & Media
  'Books & Media': [
    { name: "title", label: "Book/Media Title", type: "text", required: true, placeholder: "e.g., Atomic Habits" },
    { name: "author", label: "Author/Creator", type: "text", required: false },
    { name: "type", label: "Type", type: "select", required: true, options: ["Book", "Magazine", "DVD", "CD", "Other"] },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Like New", "Good", "Fair"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Describe the book/media, edition, etc." },
  ],
  // Beauty & Personal Care
  'Beauty & Personal Care': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Skincare, Haircare" },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Sports & Outdoors
  'Sports & Outdoors': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Football, Tent" },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Toys & Games
  'Toys & Games': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "age_range", label: "Age Range", type: "text", required: false, placeholder: "e.g., 3-6 years" },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Groceries
  Groceries: [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "weight", label: "Weight/Volume", type: "text", required: false, placeholder: "e.g., 1kg, 500ml" },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Automotive
  Automotive: [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "model", label: "Model", type: "text", required: false },
    { name: "year", label: "Year", type: "number", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Jewelry & Accessories
  'Jewelry & Accessories': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Necklace, Watch" },
    { name: "material", label: "Material", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Office & School
  'Office & School': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Stationery, Laptop" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Baby & Kids
  'Baby & Kids': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "age_range", label: "Age Range", type: "text", required: false, placeholder: "e.g., 0-2 years" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Pet Supplies
  'Pet Supplies': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Food, Toy" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Gifts & Occasions
  'Gifts & Occasions': [
    { name: "title", label: "Gift Name", type: "text", required: true },
    { name: "occasion", label: "Occasion", type: "text", required: false, placeholder: "e.g., Birthday, Wedding" },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Music & Instruments
  'Music & Instruments': [
    { name: "title", label: "Instrument/Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Guitar, Headphones" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Watches
  Watches: [
    { name: "title", label: "Watch Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Smartwatch, Analog" },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Cameras
  Cameras: [
    { name: "title", label: "Camera Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "model", label: "Model", type: "text", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Gaming
  Gaming: [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Console, Game" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Health & Beauty
  'Health & Beauty': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Supplement, Skincare" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Travel & Luggage
  'Travel & Luggage': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Suitcase, Backpack" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Furniture
  Furniture: [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "material", label: "Material", type: "text", required: false },
    { name: "dimensions", label: "Dimensions", type: "text", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used", "Refurbished"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Weddings & Events
  'Weddings & Events': [
    { name: "title", label: "Event Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Wedding Dress, Decor" },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // TV & Audio
  'TV & Audio': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Television, Speaker" },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Phones & Tablets
  'Phones & Tablets': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "model", label: "Model", type: "text", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Bikes & Scooters
  'Bikes & Scooters': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Bicycle, Scooter" },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Used"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Tools & DIY
  'Tools & DIY': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Drill, Hammer" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Bags & Wallets
  'Bags & Wallets': [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "type", label: "Type", type: "text", required: false, placeholder: "e.g., Handbag, Wallet" },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
  // Shoes
  Shoes: [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "brand", label: "Brand", type: "text", required: false },
    { name: "size", label: "Size", type: "text", required: true },
    { name: "color", label: "Color", type: "text", required: false },
    { name: "condition", label: "Condition", type: "select", required: true, options: ["New", "Like New", "Good", "Fair"] },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ],
};

// --- Dynamic Field Block ---
function FieldBlock({ field, register, errors, value, setValue }: any) {
  switch (field.type) {
    case "text":
    case "number":
      return (
        <div className="mb-4">
          <label className="block font-medium mb-1">{field.label}{field.required && <span className="text-red-500">*</span>}</label>
          <input
            type={field.type}
            {...register(field.name, { required: field.required })}
            placeholder={field.placeholder || ""}
            className="input input-bordered w-full"
            value={value || ""}
            onChange={e => setValue(field.name, e.target.value)}
          />
          {errors[field.name] && <span className="text-xs text-red-500">This field is required</span>}
        </div>
      )
    case "textarea":
      return (
        <div className="mb-4">
          <label className="block font-medium mb-1">{field.label}{field.required && <span className="text-red-500">*</span>}</label>
          <textarea
            {...register(field.name, { required: field.required })}
            className="textarea textarea-bordered w-full min-h-[80px]"
            value={value || ""}
            onChange={e => setValue(field.name, e.target.value)}
          />
          {errors[field.name] && <span className="text-xs text-red-500">This field is required</span>}
        </div>
      )
    case "select":
      return (
        <div className="mb-4">
          <label className="block font-medium mb-1">{field.label}{field.required && <span className="text-red-500">*</span>}</label>
          <select
            {...register(field.name, { required: field.required })}
            className="select select-bordered w-full"
            value={value || ""}
            onChange={e => setValue(field.name, e.target.value)}
          >
            <option value="" disabled>Select {field.label}</option>
            {field.options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors[field.name] && <span className="text-xs text-red-500">This field is required</span>}
        </div>
      )
    default:
      return null
  }
}

// --- Consistent Button Classes ---
const primaryBtn = "px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white border border-green-600 shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
const outlineBtn = "px-5 py-2 rounded-lg border border-green-600 text-green-700 bg-white hover:bg-green-50 shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

// --- Polished DetailsStep ---
function DetailsStep({ category, form, onNext, user }: any) {
  const fields = categoryFieldConfig[category.name] || [
    { name: "title", label: "Product Name", type: "text", required: true },
    { name: "price", label: "Price (USD)", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ];
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    watch,
    trigger,
    reset,
  } = useForm({
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: fields.reduce((acc, f) => ({ ...acc, [f.name]: form?.[f.name] || "" }), {}),
  });

  // Always trigger validation on mount, category, or defaultValues change
  useEffect(() => {
    reset(fields.reduce((acc, f) => ({ ...acc, [f.name]: form?.[f.name] || "" }), {}));
    trigger();
  }, [category, form, reset, trigger]);

  const onSubmit = (data: any) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="bg-background rounded-xl shadow p-4 sm:p-6 space-y-4 border border-green-200">
        {fields.map((field: any) => (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="font-medium mb-1 text-green-700">
              {field.label}{field.required && <span className="text-green-600">*</span>}
            </label>
            {field.type === "text" || field.type === "number" ? (
              <input
                type={field.type}
                {...register(field.name, { required: field.required })}
                placeholder={field.placeholder || ""}
                className="input input-bordered w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-green-600 border-green-200 focus:border-green-600"
                value={watch(field.name) || ""}
                onChange={e => setValue(field.name, e.target.value)}
              />
            ) : field.type === "textarea" ? (
              <textarea
                {...register(field.name, { required: field.required })}
                placeholder={field.placeholder || ""}
                className="textarea textarea-bordered w-full min-h-[80px] rounded-md border px-3 py-2 focus:ring-2 focus:ring-green-600 border-green-200 focus:border-green-600"
                value={watch(field.name) || ""}
                onChange={e => setValue(field.name, e.target.value)}
              />
            ) : field.type === "select" ? (
              <select
                {...register(field.name, { required: field.required })}
                className="select select-bordered w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-green-600 border-green-200 focus:border-green-600"
                value={watch(field.name) || ""}
                onChange={e => setValue(field.name, e.target.value)}
              >
                <option value="" disabled>Select {field.label}</option>
                {field.options.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : null}
            {field.helper && <span className="text-xs text-green-700">{field.helper}</span>}
            {errors[field.name] && <span className="text-xs text-green-600">This field is required</span>}
          </div>
        ))}
      </div>
      {/* Button group: stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row justify-between pt-2 gap-2">
        <button type="button" className={outlineBtn + ' w-full sm:w-auto'} onClick={() => onNext(null)}>Change Category</button>
        <button type="submit" className={primaryBtn + ' w-full sm:w-auto'} disabled={!isValid}>Next</button>
      </div>
    </form>
  );
}
function ImagesStep({ images, setImages, onNext, onBack }: any) {
  const [error, setError] = useState("");
  const maxFiles = 8;
  const canProceed = images && images.length > 0;
  const handleNext = () => {
    if (!canProceed) {
      setError("At least one product image is required.");
      return;
    }
    setError("");
    onNext();
  };
  return (
    <div className="space-y-4">
      <label className="block font-medium mb-1 text-green-700">
        Product Images <span className="text-green-600">*</span>
      </label>
      <ImageUpload
        value={images}
        onChange={setImages}
        onRemove={(url: string) => setImages(images.filter((img: string) => img !== url))}
        maxFiles={maxFiles}
      />
      <div className="text-sm text-muted-foreground">
        • Upload <span className="font-semibold text-green-700">at least one</span> high-quality image of your product<br />
        • First image will be the main display image<br />
        • Include images from different angles<br />
        • Show any defects or wear clearly<br />
        • Recommended size: 1000x1000 pixels
      </div>
      {error ? <div className="text-red-600 text-sm font-medium">{error}</div> : null}
      {/* Button group: stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row justify-between pt-2 gap-2">
        <button type="button" className={outlineBtn + ' w-full sm:w-auto'} onClick={onBack}>Back</button>
        <button type="button" className={primaryBtn + ' w-full sm:w-auto'} onClick={handleNext} disabled={!canProceed}>Next</button>
      </div>
    </div>
  );
}
function PreviewStep({ data, onNext, onBack }: any) {
  const { images = [], ...fields } = data || {};
  const [current, setCurrent] = useState(0);
  const canProceed = images && images.length > 0 && fields.title && fields.price && fields.description;
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {images.length > 0 && (
          <div className="relative aspect-square w-full bg-muted">
            <img
              src={images[current] || "/placeholder.svg"}
              alt={fields.title || "Preview"}
              className="object-cover w-full h-full"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_: string, i: number) => (
                  <button
                    key={i}
                    className={`h-2 w-6 rounded-full ${i === current ? "bg-primary" : "bg-muted-foreground/30"}`}
                    onClick={() => setCurrent(i)}
                  >
                    <span className="sr-only">Go to image {i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {fields.title || <span className="text-muted-foreground">No Title</span>}
            {fields.condition && <Badge>{fields.condition}</Badge>}
          </CardTitle>
          <CardDescription>{fields.category?.name || ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-lg mb-2">${fields.price || "-"}</div>
          <div className="mb-2 text-muted-foreground">{fields.description || <span>No description</span>}</div>
          {/* Show other key fields dynamically */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {Object.entries(fields).map(([k, v]: [string, any]) => (
              ["title", "price", "description", "images", "category"].includes(k) || !v ? null : (
                <div key={k} className="flex flex-col">
                  <span className="font-medium capitalize">{k.replace(/_/g, " ")}</span>
                  <span>{v}</span>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Button group: stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row justify-between pt-2 gap-2">
        <button type="button" className={outlineBtn + ' w-full sm:w-auto'} onClick={onBack}>Back</button>
        <button type="button" className={primaryBtn + ' w-full sm:w-auto'} onClick={onNext} disabled={!canProceed}>Next</button>
      </div>
    </div>
  );
}
function ReviewStep({ data, onSubmit, onBack, isSubmitting, submitError, submitSuccess }: any) {
  const { images = [], ...fields } = data || {};
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold mb-2">Review & Confirm Your Listing</div>
      {/* Responsive image grid: 1 column on mobile, 2 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {images.map((img: string, i: number) => (
          <img
            key={i}
            src={img || "/placeholder.svg"}
            alt={`Product image ${i + 1}`}
            className="rounded-lg object-cover w-full aspect-square border"
          />
        ))}
      </div>
      <div className="bg-muted rounded-lg p-4 mb-2">
        <div className="font-bold text-xl mb-1">{fields.title}</div>
        <div className="text-primary font-bold text-lg mb-1">${fields.price}</div>
        <div className="mb-2 text-muted-foreground">{fields.description}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {Object.entries(fields).map(([k, v]: [string, any]) => (
            ["title", "price", "description", "images", "category"].includes(k) || !v ? null : (
              <div key={k} className="flex flex-col">
                <span className="font-medium capitalize">{k.replace(/_/g, " ")}</span>
                <span>{v}</span>
              </div>
            )
          ))}
        </div>
      </div>
      {submitError ? <div className="text-red-500 text-sm">{submitError}</div> : null}
      {submitSuccess ? <div className="text-green-600 text-sm font-medium">{submitSuccess}</div> : null}
      {/* Button group: stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row justify-between pt-2 gap-2">
        <button type="button" className={outlineBtn + ' w-full sm:w-auto'} onClick={onBack} disabled={isSubmitting}>Back</button>
        <button type="button" className={primaryBtn + ' w-full sm:w-auto'} onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Listing"}
        </button>
      </div>
    </div>
  );
}

const steps = [
  { label: "Category" },
  { label: "Details" },
  { label: "Images" },
  { label: "Preview" },
  { label: "Review" },
];

// Sell Product Page
// This page allows users to list products for sale. All logic is modular and uses mock data where backend is required.
// To swap in real data, replace the mock logic with API calls.
export default function SellPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  // Centralized state
  const [step, setStep] = useState(0) // 0: Category, 1: Details, 2: Images, 3: Preview, 4: Review
  const [category, setCategory] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const contentRef = useRef<HTMLDivElement>(null);

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
        images: [], // This will be updated after image upload
        seller: null,
        category: category // <-- set full category object
      }

      console.log("Debug - Creating product in Firebase:", newProduct)
      const productRef = await createProduct(newProduct)
      const productId = typeof productRef === 'string' ? productRef : productRef.id;

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
      // Confetti animation
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Redirect to the product page
      router.push(`/marketplace/products/${productId}`)
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

  async function handleFinalSubmit() {
    setIsSubmittingFinal(true);
    setSubmitError("");
    setSubmitSuccess("");
    if (!images || images.length === 0) {
      setSubmitError("At least one product image is required.");
      setIsSubmittingFinal(false);
      return;
    }
    try {
      // 1. Upload images if not already URLs
      let uploadedImages: string[] = [];
      for (let i = 0; i < images.length; i++) {
        let url = images[i];
        if (isFile(url)) {
          url = await uploadFileToStorage(`products/${user && user.id ? user.id : 'unknown'}/${Date.now()}-${i}`, url);
        }
        uploadedImages.push(url as string);
      }
      // 2. Build product object
      let productData: any = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        category_id: category.id || category.name,
        condition: formData.condition || "",
        seller_id: user && user.id ? user.id : '',
        status: 'active',
        brand: formData.brand || null,
        model: formData.model || null,
        year_purchased: formData.year || null,
        location_id: formData.location_id || "",
        tags: [],
        specifications: {},
        created_at: new Date(),
        updated_at: new Date(),
        images: [], // This will be updated after image upload
        seller: null,
        category: category // <-- set full category object
      };
      // Add category-specific fields
      Object.keys(formData).forEach((key: string) => {
        if (Object.prototype.hasOwnProperty.call(productData, key) === false && formData[key]) {
          productData[key] = formData[key];
        }
      });
      // 3. Create product
      const productRef = await createProduct(productData as Omit<Product, 'id'>);
      const productId = typeof productRef === 'string' ? productRef : productRef.id;
      // 4. Create product images
      const imageData = uploadedImages.map((url: string, index: number) => ({
        product_id: productId,
        url: url,
        alt_text: formData.title,
        is_primary: index === 0,
        sort_order: index,
      }));
      await createProductImages(imageData);
      setSubmitSuccess("Your product has been listed successfully!");
      // Confetti animation
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        router.push(`/marketplace/products/${productId}`);
      }, 1200);
    } catch (e: any) {
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setIsSubmittingFinal(false);
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

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-primary/10">
        <div className="container max-w-2xl py-8 flex flex-col items-center justify-center min-h-[80vh]">
          <Tabs value={String(step)} className="mb-8 w-full">
            <TabsList className="w-full flex justify-center bg-background/80 shadow-sm rounded-lg mb-6">
              {steps.map((s, i) => (
                <TabsTrigger key={s.label} value={String(i)} disabled={i > step} className="transition-all duration-200">
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div ref={contentRef} className="w-full max-w-3xl mx-auto min-h-[350px] transition-all duration-500 animate-fade-in">
            {step === 0 && (
              <CategoryStep
                categories={categories.length > 0 ? categories : defaultCategories}
                onSelect={(cat) => { setCategory(cat); setStep(1); }}
              />
            )}
            {step === 1 && category && (
              <DetailsStep
                category={category}
                form={formData}
                onNext={(data: any) => {
                  if (!data) { setCategory(null); setStep(0); return; }
                  setFormData(data); setStep(2);
                }}
                user={user}
              />
            )}
              {step === 2 && (
              <ImagesStep
                images={images}
                setImages={setImages}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
              {step === 3 && (
              <PreviewStep
                data={{ ...formData, images, category }}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
              {step === 4 && (
              <ReviewStep
                data={{ ...formData, images, category }}
                onSubmit={handleFinalSubmit}
                onBack={() => setStep(3)}
                isSubmitting={isSubmittingFinal}
                submitError={submitError}
                submitSuccess={submitSuccess}
              />
            )}
                  </div>
                            </div>
                          </div>
    </ProtectedRoute>
  )
}

// Polish CategoryStep with green accent
function CategoryStep({ categories, onSelect }: { categories: any[]; onSelect: (category: any) => void }) {
  // Map string icon names to Lucide icon components
  const iconMap: Record<string, React.ElementType> = {
    Laptop,
    Shirt,
    Home,
    Book,
    Dumbbell,
    Car,
    Baby,
    Apple,
    Watch,
    Camera,
    Gamepad2,
    PawPrint,
    Sparkles,
    Briefcase,
    Globe,
    Gift,
    Music,
    FlaskConical,
    Wrench,
    Gem,
    BedDouble,
    Bike,
    Tv,
    Phone,
    Wallet,
    ShoppingBag,
    Package,
    Cake,
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] animate-fade-in">
      <div className="overflow-y-auto w-full max-h-[60vh] scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent smooth-scroll">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full max-w-3xl mx-auto">
          {categories.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">No categories available</div>
          ) : (
            categories.map((cat: any) => {
              // If icon is a string, map to component; if already a component, use directly
              let Icon: React.ElementType = Package;
              if (typeof cat.icon === 'string' && iconMap[cat.icon]) {
                Icon = iconMap[cat.icon];
              } else if (typeof cat.icon === 'function') {
                Icon = cat.icon;
              }
              return (
                <button
                  key={cat.name}
                  type="button"
                  className="flex flex-col items-center justify-center p-5 rounded-xl border border-green-200 bg-background hover:border-green-600 hover:bg-green-50 focus:border-green-600 focus:bg-green-50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-green-600 shadow-sm min-h-[150px] transform hover:scale-105 active:scale-100 animate-fade-in"
                  onClick={() => onSelect(cat)}
                >
                  <span className="mb-2">
                    <Icon className="h-9 w-9 text-green-600 group-hover:scale-110 transition-transform" />
                  </span>
                  <span className="font-semibold text-base mb-1 text-green-800 group-hover:text-green-600 text-center">{cat.name}</span>
                  <span className="text-xs text-green-700/70 text-center">{cat.description}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Helper type guard for File
function isFile(obj: any): obj is File {
  return obj && typeof obj === 'object' && typeof obj.name === 'string' && typeof obj.size === 'number';
}
