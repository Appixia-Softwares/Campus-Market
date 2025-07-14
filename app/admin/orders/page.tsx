"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  MessageSquare,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { motion } from "framer-motion"
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

interface Order {
  id: string
  quantity: number
  total_amount: number
  status: string
  pickup_location: string
  pickup_time: string | null
  notes: string | null
  created_at: string
  updated_at: string
  products: {
    id: string
    title: string
    price: number
    product_images: { url: string; is_primary: boolean }[]
  }
  buyer: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  seller: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    description: "Waiting for seller confirmation",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
    description: "Order confirmed by seller",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    color: "bg-green-100 text-green-800",
    icon: Package,
    description: "Ready for collection",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Order completed successfully",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "Order was cancelled",
  },
}

// Helper for robust date parsing
function parseDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
    try {
      setLoading(true)
      // Fetch all orders, then filter for buyer or seller
      const ordersRef = collection(db, "orders")
      const snap = await getDocs(ordersRef)
      const allOrders = snap.docs.map(docu => ({ id: docu.id, ...docu.data() }))
      // Filter orders where user is buyer or seller
      const userOrders = allOrders.filter(order => (order as any).buyer_id === user.id || (order as any).seller_id === user.id)
      // Fetch product, buyer, and seller info for each order
      const ordersWithDetails = await Promise.all(userOrders.map(async (order: any) => {
        const productDoc = await getDoc(doc(db, "products", order.product_id))
        const buyerDoc = await getDoc(doc(db, "users", order.buyer_id))
        const sellerDoc = await getDoc(doc(db, "users", order.seller_id))
        return {
          ...order,
          products: productDoc.exists() ? { ...productDoc.data(), id: productDoc.id } : {},
          buyer: buyerDoc.exists() ? { ...buyerDoc.data(), id: buyerDoc.id } : {},
          seller: sellerDoc.exists() ? { ...sellerDoc.data(), id: sellerDoc.id } : {},
        }
      }))
      setOrders(ordersWithDetails)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Update order status in Firestore
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, { status: newStatus })
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
      toast.success("Order status updated")
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Failed to update order status")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.products.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "buying" && order.buyer.id === user?.id) ||
      (activeTab === "selling" && order.seller.id === user?.id)

    return matchesSearch && matchesStatus && matchesTab
  })

  const getOrderStats = () => {
    const buying = orders.filter((order) => order.buyer.id === user?.id)
    const selling = orders.filter((order) => order.seller.id === user?.id)

    return {
      total: orders.length,
      buying: buying.length,
      selling: selling.length,
      pending: orders.filter((order) => order.status === "pending").length,
      completed: orders.filter((order) => order.status === "completed").length,
      totalValue: orders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + order.total_amount, 0),
    }
  }

  const stats = getOrderStats()

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Manage your buying and selling orders</p>
          </div>
          <Button asChild>
            <Link href="/marketplace">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="all">All Orders ({stats.total})</TabsTrigger>
            <TabsTrigger value="buying">Buying ({stats.buying})</TabsTrigger>
            <TabsTrigger value="selling">Selling ({stats.selling})</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value={activeTab}>
              {filteredOrders.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-6">
                      {activeTab === "buying"
                        ? "You haven't placed any orders yet"
                        : activeTab === "selling"
                          ? "You haven't received any orders yet"
                          : "No orders match your search criteria"}
                    </p>
                    <Button asChild>
                      <Link href="/marketplace">Browse Products</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order, index) => {
                    const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]
                    const StatusIcon = statusConfig.icon
                    const isBuyer = order.buyer.id === user?.id
                    const otherUser = isBuyer ? order.seller : order.buyer

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-black100/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Product Image */}
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={
                                    order.products.product_images?.find((img) => img.is_primary)?.url ||
                                    "/placeholder.svg?height=80&width=80" ||
                                    "/placeholder.svg"
                                  }
                                  alt={order.products.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Order Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg line-clamp-1">{order.products.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Order #{order.id.slice(-8).toUpperCase()}
                                    </p>
                                  </div>
                                  <Badge className={statusConfig.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">{isBuyer ? "Seller" : "Buyer"}</p>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={otherUser.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {otherUser.full_name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{otherUser.full_name}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground">Quantity</p>
                                    <p className="font-medium">{order.quantity}</p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="font-bold text-primary">${order.total_amount.toFixed(2)}</p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground">Order Date</p>
                                    <p className="font-medium">
                                      {(() => {
                                        const value = order.created_at;
                                        let dateObj: Date | null = null;
                                        if (!value) return "-";
                                        if (typeof value === "object" && value !== null && typeof (value as { toDate?: unknown }).toDate === "function") {
                                          dateObj = (value as Timestamp).toDate();
                                        } else if (typeof value === "string" || typeof value === "number") {
                                          dateObj = new Date(value);
                                        }
                                        if (!dateObj || isNaN(dateObj.getTime())) return "-";
                                        return formatDistanceToNow(dateObj, { addSuffix: true });
                                      })()}
                                    </p>
                                  </div>
                                </div>

                                {order.pickup_location && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{order.pickup_location}</span>
                                  </div>
                                )}

                                {order.pickup_time && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {(() => {
                                        const d = parseDate(order.pickup_time);
                                        return d ? `${d.toLocaleDateString()} at ${d.toLocaleTimeString()}` : '-';
                                      })()}
                                    </span>
                                  </div>
                                )}

                                {order.notes && (
                                  <div className="bg-muted/50 p-3 rounded-md mb-4">
                                    <p className="text-sm">{order.notes}</p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">{statusConfig.description}</p>

                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/orders/${order.id}`}>
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Details
                                      </Link>
                                    </Button>

                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/messages?order=${order.id}`}>
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        Message
                                      </Link>
                                    </Button>

                                    {/* Status Update Buttons for Sellers */}
                                    {!isBuyer && order.status === "pending" && (
                                      <>
                                        <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                                          Confirm
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    )}

                                    {!isBuyer && order.status === "confirmed" && (
                                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready_for_pickup")}>
                                        Mark Ready
                                      </Button>
                                    )}

                                    {order.status === "ready_for_pickup" && (
                                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>
                                        Mark Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
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
  )
}
