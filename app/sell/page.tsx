"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).optional(),
});

export default function SellPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [open, setOpen] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "",
      location: "",
      images: [],
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setSuccess(false)
    setCreatedProductId(null)

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
      })

      if (product) {
        // If we have images, create records in the product_images table
        if ((values.images ?? []).length > 0) {
          const imageRecords = (values.images ?? []).map((url: string, index: number) => ({
            product_id: product.id,
            url,
            alt_text: `Product image ${index + 1}`,
            is_primary: index === 0,
            sort_order: index,
          }))

          await addDoc(collection(db, 'product_images'), imageRecords)
        }

        setSuccess(true)
        setCreatedProductId(product.id)
        
        toast({
          title: "Success!",
          description: "Your listing has been created successfully.",
          variant: "default",
        })

        // Reset form
        form.reset()

        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/products/${product.id}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Error creating listing:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
          {success && createdProductId && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your listing has been created successfully. Redirecting to your listing...
              </AlertDescription>
            </Alert>
          )}
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
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Electronics, Books" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
