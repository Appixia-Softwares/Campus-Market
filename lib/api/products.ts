import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  images?: string[];
  [key: string]: any;
}

export async function getProducts(filters: Record<string, any> = {}): Promise<{ data: Product[] | null; error: string | null }> {
  let productsQuery = collection(db, 'products');
  // Add filter logic as needed using query() and where()
  const snapshot = await getDocs(productsQuery);
  return { data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)), error: null };
}

export async function getProductById(id: string): Promise<{ data: Product | null; error: string | null }> {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { data: { id: docSnap.id, ...docSnap.data() } as Product, error: null };
  } else {
    return { data: null, error: 'Product not found' };
  }
}

export async function createProduct(product: Product): Promise<{ data: Product | null; error: string | null }> {
  const docRef = await addDoc(collection(db, 'products'), product);
  return { data: { id: docRef.id, ...product }, error: null };
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<{ data: Product | null; error: string | null }> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, updates);
  return { data: { id, ...updates } as Product, error: null };
}

export async function deleteProduct(id: string): Promise<{ data: { id: string } | null; error: string | null }> {
  const docRef = doc(db, 'products', id);
  await deleteDoc(docRef);
  return { data: { id }, error: null };
}

export async function toggleProductLike(productId: string, userId: string): Promise<{ data: any; error: string | null }> {
  // Implement like/unlike logic as needed using Firestore
  return { data: null, error: null };
}

export async function getProductCategories(): Promise<{ data: any[] | null; error: string | null }> {
  const snapshot = await getDocs(collection(db, 'product_categories'));
  return { data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), error: null };
}
