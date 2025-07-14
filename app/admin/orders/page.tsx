import OrderTable from '@/components/admin/OrderTable';

export default function AdminOrdersPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Orders</h1>
      <p className="text-muted-foreground mb-6">Manage all platform orders here.</p>
      <OrderTable />
    </div>
  );
} 