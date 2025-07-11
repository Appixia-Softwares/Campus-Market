import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from '@/lib/firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'

interface ProductImage {
  url?: string;
  is_primary?: boolean;
}

interface ProductCategory {
  name?: string;
}

interface Product {
  id: string;
  title?: string;
  price?: number;
  created_at?: string;
  product_images?: ProductImage[];
  product_categories?: ProductCategory;
  [key: string]: any;
}

interface MarketplacePreviewProps {
  userId: string
}

export async function MarketplacePreview({ userId }: MarketplacePreviewProps) {
  // Fetch recent products from Firestore
  const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)
  const products: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products available</p>
        <Button asChild className="mt-4">
          <Link href="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product) => {
        const images = product.product_images || [];
        const primaryImage = images.find((img) => img.is_primary)?.url || images[0]?.url || "/placeholder.svg?height=64&width=64";
        const title = product.title || "Untitled";
        const price = typeof product.price === 'number' ? product.price : "-";
        const createdAt = product.created_at ? new Date(product.created_at) : null;
        const categoryName = product.product_categories?.name || "Uncategorized";

        return (
          <Link
            key={product.id}
            href={`/marketplace/products/${product.id}`}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
              <img
                src={primaryImage}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm leading-none truncate">{title}</p>
                <Badge variant="outline" className="ml-2">
                  {categoryName}
                </Badge>
              </div>
              <p className="mt-1 font-bold text-primary">${price}</p>
              <p className="text-xs text-muted-foreground">
                {createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : "Unknown date"}
              </p>
            </div>
          </Link>
        )
      })}

      <div className="pt-2">
        <Button asChild variant="outline" className="w-full">
          <Link href="/marketplace">View All Products</Link>
        </Button>
      </div>
    </div>
  )
}
