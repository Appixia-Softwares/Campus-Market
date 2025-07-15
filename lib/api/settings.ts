import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField } from 'firebase/firestore';

const SETTINGS_DOC_ID = 'global'; // Use a single document for global settings

// Get all settings (once)
export async function getSettings() {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : {};
}

// Real-time settings listener
export function listenToSettings(callback: (settings: any) => void) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : {});
  });
}

// Update settings (partial update)
export async function updateSettings(updates: Record<string, any>) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(docRef, updates);
}

// Delete a setting field
export async function deleteSettingField(field: string) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(docRef, { [field]: deleteField() });
} 