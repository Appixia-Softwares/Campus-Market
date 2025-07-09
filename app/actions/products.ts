import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { createAction } from '@/lib/action-handler';

export const getProducts = createAction(async (filters?: {
  category?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  let productsQuery = query(
    collection(db, 'products'),
    where('is_sold', '==', false),
    orderBy('created_at', 'desc')
  );

  if (filters?.category) {
    productsQuery = query(productsQuery, where('category_id', '==', filters.category));
  }

  if (filters?.university) {
    productsQuery = query(productsQuery, where('university_id', '==', filters.university));
  }

  if (filters?.minPrice) {
    productsQuery = query(productsQuery, where('price', '>=', filters.minPrice));
  }

  if (filters?.maxPrice) {
    productsQuery = query(productsQuery, where('price', '<=', filters.maxPrice));
  }

  const snapshot = await getDocs(productsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

export const createProduct = createAction(async (productData: any) => {
  const data = {
    ...productData,
    created_at: new Date(),
    updated_at: new Date()
  };

  const docRef = await addDoc(collection(db, 'products'), data);
  return { id: docRef.id, ...data };
});

export const updateProduct = createAction(async (id: string, updates: any) => {
  const productRef = doc(db, 'products', id);
  const data = {
    ...updates,
    updated_at: new Date()
  };
  
  await updateDoc(productRef, data);
  return { id, ...data };
});

export const deleteProduct = createAction(async (id: string) => {
  const productRef = doc(db, 'products', id);
  await deleteDoc(productRef);
  return { success: true };
}); 