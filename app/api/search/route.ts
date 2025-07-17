import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Helper to search a collection by a field (mock: name/title/desc/email)
async function searchCollection(collectionName: string, fields: string[], q: string, type: string, hrefBase: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }) as Record<string, any>)
    .filter(item => fields.some(field => (item[field] || '').toLowerCase().includes(q.toLowerCase())))
    .map(item => ({
      type,
      title: item.name || item.title || item.email || 'Untitled',
      href: `${hrefBase}/${item.id}`,
      raw: item,
    }));
}

// Static info pages for user search
const staticPages = [
  {
    type: 'Info',
    title: 'How It Works',
    description: 'Learn how to use the marketplace, connect, and transact safely.',
    href: '/#how-it-works',
  },
  {
    type: 'Info',
    title: 'App-Like Experience',
    description: 'Install as app, offline support, push notifications, and more.',
    href: '/#pwa-features',
  },
  {
    type: 'Info',
    title: 'Student Verification',
    description: 'Get verified as a real student for a trusted community.',
    href: '/#verification',
  },
  {
    type: 'Info',
    title: 'Marketplace',
    description: 'Browse and buy student essentials.',
    href: '/marketplace',
  },
  {
    type: 'Info',
    title: 'Accommodation',
    description: 'Find affordable student accommodation near your campus.',
    href: '/accommodation',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    if (!q) return NextResponse.json({ results: [] });

    // Get user role from header (for demo; in production, use session/auth)
    const userRole = request.headers.get('x-user-role') || 'student';

    let users: any[] = [];
    if (userRole === 'admin') {
      users = await searchCollection('users', ['full_name', 'email'], q, 'User', '/admin/users');
    }
    // User-facing content: products, accommodations, orders
    const products = await searchCollection('products', ['name', 'description', 'title'], q, 'Product', '/marketplace/products');
    const accommodations = await searchCollection('accommodations', ['title', 'address', 'description'], q, 'Accommodation', '/accommodation');
    const orders = await searchCollection('orders', ['id'], q, 'Order', '/orders');

    // Static info pages (search title/description)
    const infoResults = staticPages.filter(
      page =>
        page.title.toLowerCase().includes(q.toLowerCase()) ||
        page.description.toLowerCase().includes(q.toLowerCase())
    );

    // Only admins can search users. All other content is user-facing.
    const results = [
      ...users,
      ...products,
      ...accommodations,
      ...orders,
      ...infoResults,
    ];

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || 'Unknown error' }, { status: 500 });
  }
} 