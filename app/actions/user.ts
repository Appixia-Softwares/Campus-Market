"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { uploadFileToStorage } from "@/lib/firebase"
import { createNotification } from '@/lib/api/notifications';

export async function updateProfileAction(userId: string, formData: FormData) {
  try {
    const full_name = formData.get("full_name") as string
    const phone = formData.get("phone") as string
    const bio = formData.get("bio") as string
    const university_id = formData.get("university_id") as string
    const website = formData.get("website") as string

    const userData: any = {
      full_name,
      phone,
      bio,
      university_id: university_id || null,
      website: website || null,
      updated_at: new Date().toISOString(),
    }

    // Handle avatar upload
    const avatar = formData.get("avatar") as File
    if (avatar && avatar.size > 0) {
      const fileExt = avatar.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const avatarUrl = await uploadFileToStorage(fileName, avatar)
      userData.avatar_url = avatarUrl
    }

    // Update user profile in Firebase
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, userData)

    revalidatePath("/profile")
    revalidatePath("/dashboard")

    return { success: true, data: userData }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function uploadVerificationDocumentAction(userId: string, formData: FormData) {
  try {
    const document_type = formData.get("document_type") as string
    const document = formData.get("document") as File

    if (!document || document.size === 0) {
      return { success: false, error: "No document provided" }
    }

    const fileExt = document.name.split(".").pop()
    const fileName = `${userId}/${document_type}_${Date.now()}.${fileExt}`

    const documentUrl = await uploadFileToStorage(fileName, document)

    // Create verification request in Firebase
    const verificationRef = doc(db, "verification_requests", `${userId}_${Date.now()}`)
    await updateDoc(verificationRef, {
      user_id: userId,
      document_type,
      document_url: documentUrl,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    // Trigger notification for verification request
    await createNotification({
      userId,
      type: 'verification',
      title: 'Verification Submitted',
      body: 'Your verification document has been submitted and is pending review.',
      link: '/profile',
      read: false,
      extraData: { documentType: document_type },
    });

    revalidatePath("/profile")

    return { success: true, data: { document_url: documentUrl } }
  } catch (error) {
    console.error("Error uploading verification document:", error)
    return { success: false, error: "Failed to upload document" }
  }
}
