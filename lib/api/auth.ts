import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"

interface SignUpData {
  full_name: string
  university_id?: string
  student_id?: string
  phone?: string
  whatsapp_number?: string
  course?: string
  year_of_study?: string
  status?: 'active' | 'inactive' | 'suspended'
  role?: 'student' | 'admin' | 'moderator'
  verified?: boolean
  phone_verified?: boolean
  email_verified?: boolean
}

interface AuthError {
  message: string
  code?: string
  details?: string
  hint?: string
}

interface AuthResponse<T> {
  data: T | null
  error: AuthError | null
}

export async function signUp(
  email: string,
  password: string,
  data: SignUpData,
): Promise<AuthResponse<{ user: any; profile: any }>> {
  try {
    console.log("Debug - Starting signup process with data:", { email, ...data })

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        ...data,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Debug - Signup error:", result.error)
      return { data: null, error: { message: result.error } }
    }

    console.log("Debug - Signup successful:", result)
    return { data: result, error: null }
  } catch (error: any) {
    console.error("Debug - Unexpected error in signup:", error)
    return {
      data: null,
      error: {
        message: error.message || "An unexpected error occurred during signup",
      },
    }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse<{ user: any; session: any }>> {
  try {
    // Placeholder for Firebase signIn
    return { data: null, error: { message: "Firebase signIn not implemented" } }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || "An unexpected error occurred during sign in",
      },
    }
  }
}

export async function signOut(): Promise<AuthResponse<null>> {
  try {
    // Placeholder for Firebase signOut
    return { data: null, error: { message: "Firebase signOut not implemented" } }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || "An unexpected error occurred during sign out",
      },
    }
  }
}

export async function getCurrentUser(): Promise<AuthResponse<{ user: any; profile: any }>> {
  try {
    // Placeholder for Firebase getCurrentUser
    return { data: null, error: { message: "Firebase getCurrentUser not implemented" } }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || "An unexpected error occurred while getting user data",
      },
    }
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    full_name: string
    university_id: string
    status: string
    verified: boolean
  }>,
): Promise<AuthResponse<{ profile: any }>> {
  try {
    // Placeholder for Firebase updateUserProfile
    return { data: null, error: { message: "Firebase updateUserProfile not implemented" } }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || "An unexpected error occurred while updating profile",
      },
    }
  }
}

export async function getUniversities(): Promise<AuthResponse<Array<{ id: string; name: string; location: string }>>> {
  try {
    console.log("Debug - Starting to fetch universities from Firebase")
    
    const universitiesRef = collection(db, 'universities')
    const universitiesQuery = query(universitiesRef, orderBy('name'))
    const snapshot = await getDocs(universitiesQuery)
    
    const universities = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      location: doc.data().location
    }))

    console.log("Debug - Fetched universities:", universities.length)
    return { data: universities, error: null }
  } catch (error: any) {
    console.error("Debug - Error fetching universities:", error)
    return {
      data: null,
      error: {
        message: error.message || "Failed to fetch universities"
      }
    }
  }
}
