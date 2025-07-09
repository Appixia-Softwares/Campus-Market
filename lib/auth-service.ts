import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  university_id?: string;
  student_id?: string;
  phone?: string;
  whatsapp_number?: string;
  course?: string;
  year_of_study?: string;
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'student' | 'admin' | 'moderator';
  verified?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', email));
    const userData = userDoc.data() as User;

    return {
      user: {
        ...userData,
        id: email,
      },
    };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, userData: Partial<User>) => {
  try {
    // Create user document in Firestore with all collected data
    const user: User = {
      id: email,
      email,
      ...userData,
      status: 'active',
      role: 'student',
      verified: false,
      phone_verified: false,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await setDoc(doc(db, 'users', email), user);

    return {
      user,
    };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    // Implement sign out logic
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', email));
    const userData = userDoc.data() as User;

    return {
      ...userData,
      id: email,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (userId: string, data: Partial<User>) => {
  try {
    // Update user document in Firestore
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updated_at: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Subscribe to auth state changes
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  // Implement subscribe to auth state changes logic
  return {
    unsubscribe: () => {
      // Implement unsubscribe logic
    }
  };
}; 