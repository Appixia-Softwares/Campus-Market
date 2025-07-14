import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  getDoc,
  DocumentReference,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Types
export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  original_price?: number | null;
  category_id: string;
  condition: string;
  seller_id: string;
  status: 'active' | 'pending' | 'sold';
  brand?: string | null;
  model?: string | null;
  year_purchased?: number | null;
  location_id: string;
  tags?: string[];
  specifications?: {
    color?: string[] | null;
    size?: string[] | null;
    material?: string[] | null;
  };
  created_at?: Date;
  updated_at?: Date;
  views?: number;
  images: ProductImage[];
  seller: any;
  category: any;
}

export interface ProductImage {
  id?: string;
  product_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

// Products Collection
const productsCollection = 'products';
const productImagesCollection = 'product_images';

// Deep clean utility to remove Symbols, functions, and undefined from nested objects/arrays
function deepClean(value: any): any {
  if (Array.isArray(value)) {
    return value.map(deepClean).filter(v => v !== undefined);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (
        typeof v !== 'function' &&
        typeof v !== 'symbol' &&
        typeof v !== 'undefined'
      ) {
        const cleaned = deepClean(v);
        if (cleaned !== undefined) result[k] = cleaned;
      }
    }
    return result;
  }
  if (
    typeof value === 'function' ||
    typeof value === 'symbol' ||
    typeof value === 'undefined'
  ) {
    return undefined;
  }
  return value;
}

// Product Functions
export const getProducts = async (filters: any = {}) => {
  try {
    console.log("Debug - Building products query with filters:", filters)
    const productsRef = collection(db, 'products')
    let queryConstraints: any[] = []

    // Add filter constraints
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status))
    }
    if (filters.category_id) {
      queryConstraints.push(where('category_id', '==', filters.category_id))
    }
    if (filters.seller_id) {
      queryConstraints.push(where('seller_id', '==', filters.seller_id))
    }
    if (filters.university_id) {
      queryConstraints.push(where('university_id', '==', filters.university_id))
    }
    if (filters.delivery_available) {
      queryConstraints.push(where('delivery_available', '==', true))
    }
    if (filters.minPrice) {
      queryConstraints.push(where('price', '>=', filters.minPrice))
    }
    if (filters.maxPrice) {
      queryConstraints.push(where('price', '<=', filters.maxPrice))
    }
    if (filters.condition) {
      queryConstraints.push(where('condition', '==', filters.condition))
    }

    // Add sorting
    if (filters.sortBy === 'price') {
      queryConstraints.push(orderBy('price', 'asc'))
    } else if (filters.sortBy === 'popular') {
      queryConstraints.push(orderBy('views', 'desc'))
    } else {
      queryConstraints.push(orderBy('created_at', 'desc'))
    }

    // Add pagination
    if (filters.lastDoc) {
      queryConstraints.push(startAfter(filters.lastDoc))
    }
    if (filters.pageSize) {
      queryConstraints.push(limit(filters.pageSize))
    } else {
      queryConstraints.push(limit(20)) // Default page size
    }

    // Build and execute query
    const productsQuery = query(productsRef, ...queryConstraints)
    const snapshot = await getDocs(productsQuery)
    
    // Process products
    const products = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const productData = docSnapshot.data()
        
        // Get images
        const imagesQuery = query(
          collection(db, 'product_images'),
          where('product_id', '==', docSnapshot.id)
        )
        const imagesSnapshot = await getDocs(imagesQuery)
        const images = imagesSnapshot.docs.map(img => ({
          id: img.id,
          ...img.data()
        }))

        // Get view count
        const viewsQuery = query(
          collection(db, 'user_product_views'),
          where('product_id', '==', docSnapshot.id)
        )
        const viewsSnapshot = await getDocs(viewsQuery)
        const viewCount = viewsSnapshot.size

        // Get seller info
        const sellerRef = doc(db, 'users', productData.seller_id)
        const sellerDoc = await getDoc(sellerRef)
        const sellerData = sellerDoc.exists() ? sellerDoc.data() as DocumentData : null

        // Get category info
        const categoryRef = doc(db, 'product_categories', productData.category_id)
        const categoryDoc = await getDoc(categoryRef)
        const categoryData = categoryDoc.exists() ? categoryDoc.data() as DocumentData : null

        return {
          id: docSnapshot.id,
          ...productData,
          images: images,
          views: viewCount,
          seller: sellerData,
          category: categoryData,
          created_at: productData.created_at instanceof Timestamp ? productData.created_at.toDate() : new Date(productData.created_at),
          updated_at: productData.updated_at instanceof Timestamp ? productData.updated_at.toDate() : new Date(productData.updated_at)
        } as Product
      })
    )

    return {
      products,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === (filters.pageSize || 20)
    }
  } catch (error) {
    console.error("Error in getProducts:", error)
    throw error
  }
}

export const createProduct = async (productData: Omit<Product, 'id'>) => {
  try {
    const cleanData = deepClean(productData);
    console.log('createProduct data:', cleanData);
    const docRef = await addDoc(collection(db, productsCollection), {
      ...cleanData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return docRef;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const createProductImages = async (images: Omit<ProductImage, 'id'>[]) => {
  try {
    const imagePromises = images.map(image => 
      addDoc(collection(db, productImagesCollection), image)
    );
    return await Promise.all(imagePromises);
  } catch (error) {
    console.error('Error creating product images:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, data: Partial<Product>) => {
  try {
    const productRef = doc(db, productsCollection, productId);
    await updateDoc(productRef, {
      ...data,
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Categories Collection
const categoriesCollection = 'product_categories';

export const getCategories = async () => {
  try {
    const q = query(
      collection(db, categoriesCollection),
      where('is_active', '==', true),
      orderBy('sort_order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const categories: any[] = [];
    
    querySnapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Locations Collection
const locationsCollection = 'locations';

export const getLocations = async () => {
  try {
    const q = query(
      collection(db, locationsCollection),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const locations: any[] = [];
    
    querySnapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by city after fetching
    return locations.sort((a, b) => {
      if (a.city === b.city) {
        return a.name.localeCompare(b.name);
      }
      return a.city.localeCompare(b.city);
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

// Universities Collection
const universitiesCollection = 'universities';

export const getUniversities = async () => {
  try {
    const q = query(
      collection(db, universitiesCollection),
      where('is_active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const universities: any[] = [];
    
    querySnapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
      universities.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by name after fetching
    return universities.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching universities:', error);
    throw error;
  }
}; 