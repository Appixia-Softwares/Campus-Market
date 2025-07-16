import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField, collection, getDocs } from 'firebase/firestore';

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

// Update settings (partial update) with defensive logic
export async function updateSettings(updates: Record<string, any>) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    // Create the document with the updates
    await setDoc(docRef, updates, { merge: true });
  } else {
    await updateDoc(docRef, updates);
  }
}

// Delete a setting field
export async function deleteSettingField(field: string) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(docRef, { [field]: deleteField() });
}

// Feature Flags Management
export async function getFeatureFlags() {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() && docSnap.data().featureFlags ? docSnap.data().featureFlags : {};
}

// Defensive: create featureFlags object if missing
export async function setFeatureFlag(flag: string, value: boolean) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, { featureFlags: { [flag]: value } }, { merge: true });
  } else {
    const data = docSnap.data();
    if (!data.featureFlags) {
      await updateDoc(docRef, { featureFlags: { [flag]: value } });
    } else {
      await updateDoc(docRef, { [`featureFlags.${flag}`]: value });
    }
  }
}

// Helper to get a single feature flag (one-off, not real-time)
export async function getFeatureFlag(flag: string): Promise<boolean> {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return false;
  const flags = docSnap.data().featureFlags || {};
  return !!flags[flag];
}

// Experiments Management
export async function getExperiments() {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() && docSnap.data().experiments ? docSnap.data().experiments : {};
}

export async function setExperiment(experiment: string, value: boolean) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, { experiments: { [experiment]: value } }, { merge: true });
  } else {
    const data = docSnap.data();
    if (!data.experiments) {
      await updateDoc(docRef, { experiments: { [experiment]: value } });
    } else {
      await updateDoc(docRef, { [`experiments.${experiment}`]: value });
    }
  }
} 