"use client"
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o =>
    o.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Orders</h1>
      <p className="text-muted-foreground mb-6">Manage all platform orders here.</p>
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border rounded w-full max-w-xs focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div>Loading…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">No orders found.</div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center hover:scale-[1.03] transition cursor-pointer group"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="font-semibold text-center">Order #{order.id}</div>
              <div className="text-xs text-muted-foreground mb-2">{order.user_id || '-'}</div>
              <div className="flex gap-2 flex-wrap justify-center mb-2">
                <Badge variant={order.status === 'completed' ? 'blue' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>{order.status || 'pending'}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}>View</Button>
                <Button size="sm" variant="default" onClick={e => { e.stopPropagation(); /* implement update */ }}>Update</Button>
                <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); /* implement delete */ }}>Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex flex-col gap-3">
              <div className="font-semibold text-lg">Order #{selectedOrder.id}</div>
              <div className="text-xs text-muted-foreground mb-2">{selectedOrder.user_id || '-'}</div>
              <div className="flex gap-2 flex-wrap justify-center mb-2">
                <Badge variant={selectedOrder.status === 'completed' ? 'blue' : selectedOrder.status === 'cancelled' ? 'destructive' : 'secondary'}>{selectedOrder.status || 'pending'}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : '-'}</div>
              <div className="w-full text-sm">
                <div><span className="font-medium">Product:</span> {selectedOrder.product_id || '-'}</div>
                <div><span className="font-medium">Amount:</span> ₦{selectedOrder.amount?.toLocaleString() || '-'}</div>
                <div><span className="font-medium">Status:</span> {selectedOrder.status || '-'}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default">Update</Button>
                <Button size="sm" variant="destructive">Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 