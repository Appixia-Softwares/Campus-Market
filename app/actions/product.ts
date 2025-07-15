"use server"

import { revalidatePath } from "next/cache"
import { createProduct, updateProduct, deleteProduct } from "@/lib/api/products"
import { uploadFileToStorage } from '@/lib/firebase'
import { createNotification } from '@/lib/api/notifications';

export async function createProductAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const category_id = formData.get("category_id") as string
    const condition = formData.get("condition") as string
    const location = formData.get("location") as string
    const user_id = formData.get("user_id") as string

    if (!user_id) {
      return { success: false, error: "User not authenticated" }
    }

    const productData = {
      name,
      title,
      description,
      price,
      category_id,
      condition,
      location,
      user_id,
      status: "active",
      views: 0,
      likes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await createProduct(productData)

    if (error) {
      return { success: false, error: error }
    }

    // Handle images
    const images = formData.getAll("images") as File[]
    if (images.length > 0 && data) {
      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${data.id}/${Date.now()}.${fileExt}`
        const publicUrl = await uploadFileToStorage(fileName, file)
        // Save image URL to Firestore or your product_images collection as needed
        // await createProductImage({ product_id: data.id, url: publicUrl, is_primary: i === 0 })
      }
    }

    // Notify interested users (placeholder logic)
    // TODO: Replace with actual logic to fetch interested users by university/location/category
    const interestedUserIds: string[] = [];
    for (const interestedUserId of interestedUserIds) {
      await createNotification({
        userId: interestedUserId,
        type: 'product',
        title: 'New Product Listed',
        body: `A new product has been listed in your area of interest: ${title}`,
        link: `/marketplace/products/${data.id}`,
        read: false,
        extraData: { productId: data.id, categoryId: category_id, location },
      });
    }

    revalidatePath("/marketplace")

    return { success: true, data }
  } catch (error) {
    console.error("Error creating product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

export async function updateProductAction(id: string, formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const status = formData.get("status") as string
    const condition = formData.get("condition") as string

    const productData = {
      title,
      description,
      price,
      status,
      condition,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await updateProduct(id, productData)

    if (error) {
      return { success: false, error: error }
    }

    // Handle new images
    const newImages = formData.getAll("new_images") as File[]
    if (newImages.length > 0) {
      for (const file of newImages) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${id}/${Date.now()}.${fileExt}`
        const publicUrl = await uploadFileToStorage(fileName, file)
        // Save image URL to Firestore or your product_images collection as needed
        // await createProductImage({ product_id: id, url: publicUrl, is_primary: false })
      }
    }

    // Handle deleted images
    const deletedImagesString = formData.get("deleted_images") as string
    if (deletedImagesString) {
      const deletedImages = JSON.parse(deletedImagesString)
      for (const imageId of deletedImages) {
        // Implement Firebase Storage deletion logic if needed
      }
    }

    // Handle primary image
    const primaryImage = formData.get("primary_image") as string
    if (primaryImage) {
      // Reset all images to non-primary
      // Implement Firebase Storage logic to reset all images to non-primary
    }

    revalidatePath(`/marketplace/products/${id}`)
    revalidatePath("/marketplace")

    return { success: true, data }
  } catch (error) {
    console.error("Error updating product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

export async function deleteProductAction(id: string) {
  try {
    // Delete images from storage
    // Implement Firebase Storage deletion logic if needed

    // Delete product
    const { error } = await deleteProduct(id)

    if (error) {
      return { success: false, error: error }
    }

    revalidatePath("/marketplace")

    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

export async function markProductAsSoldAction(id: string) {
  try {
    const { data, error } = await updateProduct(id, {
      status: "sold",
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error }
    }

    revalidatePath(`/marketplace/products/${id}`)
    revalidatePath("/marketplace")

    return { success: true, data }
  } catch (error) {
    console.error("Error marking product as sold:", error)
    return { success: false, error: "Failed to update product status" }
  }
}
