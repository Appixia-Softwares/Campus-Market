"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Loader2, CheckCircle2, UploadCloud } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  onRemove: (url: string) => void
  productId?: string
  maxFiles?: number
}

export function ImageUpload({ value, onChange, onRemove, productId, maxFiles = 8 }: ImageUploadProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      if (error) {
        console.error('Auth check error:', error)
      }
    }
    checkAuth()
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return

    // Check if adding new files would exceed the limit
    if (value.length + acceptedFiles.length > maxFiles) {
          toast({
            title: "Too many images",
        description: `You can upload up to ${maxFiles} images. You already have ${value.length} images.`,
            variant: "destructive",
          })
          return
        }

        setIsUploading(true)
    const newUrls: string[] = []
    const newProgress: Record<string, number> = {}

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${productId || 'temp'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

          // Initialize progress for this file
        newProgress[file.name] = 0
        setUploadProgress(prev => ({
          ...prev,
          ...newProgress
        }))

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
          console.error('Error uploading image:', uploadError)
              toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}. Please try again.`,
                variant: "destructive",
              })
              continue
            }

            const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

            // If we have a product ID, create a record in the product_images table
            if (productId) {
              const { error: insertError } = await supabase
                .from('product_images')
                .insert({
                  product_id: productId,
                  url: publicUrl,
                  alt_text: file.name,
                  is_primary: value.length === 0,
                  sort_order: value.length
                })

              if (insertError) {
                console.error('Error creating product image record:', insertError)
            // Delete the uploaded file if we can't create the record
            await supabase.storage.from('product-images').remove([filePath])
                toast({
                  title: "Error",
                  description: "Failed to save image details. Please try again.",
                  variant: "destructive",
                })
                continue
              }
            }

        newUrls.push(publicUrl)
      }

      onChange([...value, ...newUrls])
            toast({
              title: "Success",
        description: `Successfully uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''}`,
            })
          } catch (error) {
            console.error('Error in upload process:', error)
            toast({
        title: "Upload failed",
        description: "An error occurred while uploading. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
          setUploadProgress({})
      }
  }, [value, onChange, productId, maxFiles, toast])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    disabled: isUploading || !isAuthenticated
  })

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    await onDrop(Array.from(files))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {value.map((url) => (
            <div key={url} className="relative group aspect-square">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover rounded-lg"
              alt="Product image"
              src={url}
            />
            </div>
          ))}
        {value.length < maxFiles && (
          <div className="relative group aspect-square">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
              multiple
            />
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">
                Upload Image{value.length === 0 ? '' : 's'}
              </span>
              <span className="text-xs text-muted-foreground">
                {value.length}/{maxFiles} images
              </span>
            </label>
        </div>
      )}
      </div>
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-sm">
            <span className="truncate">{fileName}</span>
                <span>{Math.round(progress)}%</span>
          </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
                  className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  )
}
