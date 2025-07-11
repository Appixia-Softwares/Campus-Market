import { db, auth } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail, // Add this import
} from 'firebase/auth';

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
  role?: 'student' | 'non_student' | 'admin' | 'moderator';
  occupation?: string;
  organization?: string;
  reason?: string;
  // --- Added fields for profile enhancement ---
  bio?: string;
  location?: string;
  // Notification preferences
  email_notifications?: boolean;
  push_notifications?: boolean;
  message_notifications?: boolean;
  marketing_emails?: boolean;
  // Privacy settings
  profile_visible?: boolean;
  show_online_status?: boolean;
  show_contact_info?: boolean;
  // --- End added fields ---
  verified?: boolean;
  phone_verified?: boolean;
  email_verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data() as User;
    return {
      user: {
        ...userData,
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    // Create user document in Firestore with all collected data
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      ...userData,
      status: 'active',
      role: 'student',
      verified: false,
      phone_verified: false,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), user);
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
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data() as User;
    return {
      ...userData,
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (userId: string, data: Partial<User>) => {
  try {
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
  const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data() as User;
      callback({
        ...userData,
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
      });
    } else {
      callback(null);
    }
  });
  return { unsubscribe };
};

// Send password reset email
/**
 * Sends a password reset email to the given address using Firebase Auth.
 * @param email The user's email address
 */
export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}; 