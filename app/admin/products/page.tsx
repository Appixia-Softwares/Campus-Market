"use client"

import { useEffect, useState } from 'react';
import { getProducts } from '@/app/actions/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Products</h1>
      <p className="text-muted-foreground mb-6">Manage all products listed on the platform.</p>
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
                      placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border rounded w-full max-w-xs focus:ring-2 focus:ring-primary"
                    />
                  </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div>Loading…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">No products found.</div>
        ) : (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center hover:scale-[1.03] transition cursor-pointer group"
              onClick={() => setSelectedProduct(product)}
            >
              <img
                src={product.images?.[0]?.url || '/placeholder.svg'}
                alt={product.title}
                className="h-20 w-20 rounded border object-cover mb-2"
              />
              <div className="font-semibold text-center">{product.title}</div>
              <div className="text-xs text-muted-foreground mb-2">₦{product.price?.toLocaleString() || '-'}</div>
              <div className="flex gap-2 flex-wrap justify-center mb-2">
                <Badge variant={product.status === 'sold' ? 'destructive' : 'blue'}>{product.status || 'active'}</Badge>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedProduct(product); }}>View</Button>
                <Button size="sm" variant="default" onClick={e => { e.stopPropagation(); /* implement edit */ }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); /* implement delete */ }}>Delete</Button>
              </div>
            </div>
          ))
        )}
              </div>
      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={open => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={selectedProduct.images?.[0]?.url || '/placeholder.svg'}
                alt={selectedProduct.title}
                className="h-24 w-24 rounded border object-cover mb-2"
              />
              <div className="font-semibold text-lg">{selectedProduct.title}</div>
              <div className="text-xs text-muted-foreground mb-2">₦{selectedProduct.price?.toLocaleString() || '-'}</div>
              <div className="flex gap-2 flex-wrap justify-center mb-2">
                <Badge variant={selectedProduct.status === 'sold' ? 'destructive' : 'blue'}>{selectedProduct.status || 'active'}</Badge>
              </div>
              <div className="w-full text-sm">
                <div><span className="font-medium">Category:</span> {selectedProduct.category_id || '-'}</div>
                <div><span className="font-medium">Condition:</span> {selectedProduct.condition || '-'}</div>
                <div><span className="font-medium">Location:</span> {selectedProduct.location || '-'}</div>
                <div><span className="font-medium">Description:</span> {selectedProduct.description || '-'}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default">Edit</Button>
                <Button size="sm" variant="destructive">Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
