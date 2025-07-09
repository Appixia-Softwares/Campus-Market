import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function getProfile(userId: string) {
  const profileRef = doc(db, 'profiles', userId);
  const profileSnap = await getDoc(profileRef);
  
  if (!profileSnap.exists()) {
    return null;
  }
  
  return { id: profileSnap.id, ...profileSnap.data() };
}

export async function updateProfile(userId: string, updates: any) {
  const profileRef = doc(db, 'profiles', userId);
  await updateDoc(profileRef, {
    ...updates,
    updated_at: new Date()
  });
  
  const updatedProfile = await getDoc(profileRef);
  return { id: updatedProfile.id, ...updatedProfile.data() };
}

export async function uploadVerificationDocument(userId: string, file: File) {
  const filePath = `verifications/${userId}/${file.name}`;
  // Placeholder for the removed supabase.storage.from('verifications').upload method
  // This function should be implemented to handle file upload to Firebase Storage
  throw new Error("Supabase storage upload method not implemented");
}

export async function uploadProfileImage(userId: string, file: File) {
  const filePath = `avatars/${userId}/${file.name}`;
  // Placeholder for the removed supabase.storage.from('avatars').upload method
  // This function should be implemented to handle file upload to Firebase Storage
  throw new Error("Supabase storage upload method not implemented");
}

export async function getUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const profileRef = doc(db, 'profiles', user.id);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return null;
    }

    return { id: profileSnap.id, ...profileSnap.data() } as Profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(updates: Partial<Profile>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const profileRef = doc(db, 'profiles', user.id);
    await updateDoc(profileRef, {
        ...updates,
      updated_at: new Date()
    });
    
    const updatedProfile = await getDoc(profileRef);
    return { id: updatedProfile.id, ...updatedProfile.data() } as Profile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function uploadStudentId(fileUri: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Convert image to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const fileExt = fileUri.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `student_ids/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("verifications")
      .upload(filePath, blob);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from("verifications")
      .getPublicUrl(filePath);

    // Update profile with student ID URL and set verification status to pending
    if (data) {
      await updateUserProfile({
        student_id_url: data.publicUrl,
        verification_status: "pending",
      });
    }

    return true;
  } catch (error) {
    console.error("Error uploading student ID:", error);
    throw error;
  }
}
