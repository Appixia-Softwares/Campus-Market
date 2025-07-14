"use client"

import ProductTable from '@/components/admin/ProductTable';

export default function AdminProductsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Products</h1>
      <p className="text-muted-foreground mb-6">Manage all products listed on the platform.</p>
      <ProductTable />
    </div>
  );
}
