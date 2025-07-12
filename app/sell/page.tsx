"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Smartphone, Shirt, BookOpen, Package, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// --- Category Config & Types ---
const CATEGORY_META = [
  {
    key: "electronics",
    label: "Electronics",
    description: "Phones, laptops, gadgets, and more.",
    icon: Smartphone,
  },
  {
    key: "fashion",
    label: "Fashion",
    description: "Clothing, shoes, accessories.",
    icon: Shirt,
  },
  {
    key: "books",
    label: "Books",
    description: "Textbooks, novels, study guides.",
    icon: BookOpen,
  },
  {
    key: "other",
    label: "Other",
    description: "Anything else you want to sell.",
    icon: Package,
  },
] as const;

type CategoryKey = typeof CATEGORY_META[number]["key"];
type CategoryField = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
};

const CATEGORY_CONFIG: Record<CategoryKey, CategoryField[]> = {
  electronics: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Apple, Samsung', type: 'text' },
    { name: 'model', label: 'Model', placeholder: 'e.g. iPhone 14 Pro', type: 'text' },
    { name: 'specs', label: 'Specs', placeholder: 'e.g. 256GB, 8GB RAM, M1 Chip', type: 'text' },
  ],
  fashion: [
    { name: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Zara', type: 'text' },
    { name: 'size', label: 'Size', placeholder: 'e.g. M, 32, 8 UK', type: 'text' },
    { name: 'color', label: 'Color', placeholder: 'e.g. Black, Red', type: 'text' },
  ],
  books: [
    { name: 'brand', label: 'Publisher', placeholder: 'e.g. Pearson', type: 'text' },
    { name: 'model', label: 'Edition', placeholder: 'e.g. 2nd Edition', type: 'text' },
  ],
  other: [],
};

// --- Stepper/Progress Indicator ---
function SellStepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className={`flex items-center gap-2 ${step === 1 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
        <span className="rounded-full w-6 h-6 flex items-center justify-center border border-primary bg-background">1</span>
        <span>Choose Category</span>
      </div>
      <span className="h-0.5 w-8 bg-muted rounded" />
      <div className={`flex items-center gap-2 ${step === 2 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
        <span className="rounded-full w-6 h-6 flex items-center justify-center border border-primary bg-background">2</span>
        <span>Fill Details</span>
      </div>
    </div>
  );
}

// --- Category Selection Grid ---
function CategorySelectGrid({ onSelect, selected }: { onSelect: (key: CategoryKey) => void, selected?: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {CATEGORY_META.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            className={`flex flex-col items-center p-4 rounded-lg border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-primary/5 active:scale-95 select-none cursor-pointer ${isActive ? "border-primary bg-primary/10" : "border-muted bg-background"}`}
            onClick={() => onSelect(cat.key as CategoryKey)}
            aria-pressed={isActive}
          >
            <Icon className={`h-8 w-8 mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-semibold mb-1">{cat.label}</span>
            <span className="text-xs text-muted-foreground text-center">{cat.description}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Reusable Field Block ---
function FormFieldBlock({ name, label, placeholder, type = "text" }: CategoryField) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// --- Utility: Get all possible default values for the form ---
function getCompleteDefaultValues() {
  const allFields = [
    'title', 'description', 'price', 'category', 'condition', 'location', 'images',
    ...Array.from(new Set(Object.values(CATEGORY_CONFIG).flat().map(f => f.name))),
  ];
  const defaults: Record<string, any> = {};
  for (const key of allFields) {
    defaults[key] = undefined;
  }
  return defaults;
}

// --- Zod Schema ---
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).optional(),
  // Category-specific fields
  brand: z.string().optional(),
  model: z.string().optional(),
  specs: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

export default function SellPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | undefined>(undefined);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getCompleteDefaultValues(),
  });

  // Prefill category in form state when selected
  if (selectedCategory && form.getValues("category") !== selectedCategory) {
    form.setValue("category", selectedCategory);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSuccess(false);
    setCreatedProductId(null);

    try {
      // Create the product
      const product = await addDoc(collection(db, 'products'), {
        title: values.title,
        description: values.description,
        price: parseFloat(values.price),
        category: values.category,
        condition: values.condition,
        location: values.location,
        status: 'active',
        created_at: new Date().toISOString(),
      });

      if (product) {
        setSuccess(true);
        setCreatedProductId(product.id);
        toast({
          title: "Success!",
          description: "Your listing has been created successfully.",
          variant: "default",
        });
        form.reset(getCompleteDefaultValues());
        setSelectedCategory(undefined);
        setTimeout(() => {
          router.push(`/products/${product.id}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) router.back(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sell an Item</DialogTitle>
        </DialogHeader>
      <div className="space-y-6">
          <p className="text-muted-foreground">
            Create a new listing for your item
          </p>
          {/* Stepper/progress indicator */}
          <SellStepper step={selectedCategory ? 2 : 1} />
          {/* Step 1: Category selection */}
          {!selectedCategory && (
            <CategorySelectGrid onSelect={setSelectedCategory} selected={selectedCategory} />
          )}
          {/* Step 2: Show form only if category is selected */}
          {selectedCategory && (
            <>
              {/* Change Category button */}
              <button
                type="button"
                className="mb-4 text-sm text-primary underline hover:text-primary/80 transition"
                onClick={() => setSelectedCategory(undefined)}
              >
                ← Change Category
              </button>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive title for your item
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
                      placeholder="Describe your item in detail"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                    {/* Category select is now hidden, but keep it in form state for submission */}
                    <input type="hidden" {...form.register("category")} value={selectedCategory} />
                  </div>
                  {/* Category-specific fields */}
                  {CATEGORY_CONFIG[selectedCategory as CategoryKey] && CATEGORY_CONFIG[selectedCategory as CategoryKey].length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {CATEGORY_CONFIG[selectedCategory as CategoryKey].map((field: CategoryField) => (
                        <FormFieldBlock
                          key={field.name}
                          name={field.name}
                          label={field.label}
                          placeholder={field.placeholder}
                          type={field.type}
                        />
                      ))}
            </div>
                  )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <FormControl>
                            <Input placeholder="e.g. New, Like New, Used" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                            <Input placeholder="e.g. Harare, Campus" {...field} />
                    </FormControl>
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
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                            value={field.value || []}
                      onChange={field.onChange}
                            onRemove={(url) => field.onChange((field.value || []).filter((img: string) => img !== url))}
                            maxFiles={5}
                    />
                  </FormControl>
                  <FormDescription>
                          Upload up to 5 images
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Listing
            </Button>
          </form>
        </Form>
            </>
          )}
          {success && createdProductId && (
            <Alert className="bg-green-50 border-green-200 mt-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your listing has been created successfully. Redirecting to your listing...
              </AlertDescription>
            </Alert>
          )}
      </div>
      </DialogContent>
    </Dialog>
  );
}

