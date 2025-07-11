"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Phone,
  Send,
  Flag,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, addDoc } from 'firebase/firestore';

interface OrderDetails {
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
    description: string
    product_images: { url: string; is_primary: boolean }[]
  }
  buyer: {
    id: string
    full_name: string
    avatar_url: string | null
    whatsapp_number: string | null
  }
  seller: {
    id: string
    full_name: string
    avatar_url: string | null
    whatsapp_number: string | null
  }
}

interface OrderMessage {
  id: string
  sender_id: string
  message: string
  created_at: string
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

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [messages, setMessages] = useState<OrderMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (params.id && user) {
      fetchOrderDetails(params.id as string)
      fetchOrderMessages(params.id as string)
    }
  }, [params.id, user])

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true)
      // Replace supabase logic with Firestore logic
      // For example, you can use Firebase/Firestore to fetch order details
      // This is a placeholder and should be replaced with actual Firestore logic
      // For now, we'll use a local array to simulate the data
      const data: OrderDetails = {
        id: orderId,
        quantity: 2,
        total_amount: 100,
        status: "confirmed",
        pickup_location: "123 Main St, Anytown, USA",
        pickup_time: "2024-05-15T14:00",
        notes: "Please deliver to the front door",
        created_at: "2024-04-15T12:00",
        updated_at: "2024-04-15T12:00",
        products: {
          id: "product123",
          title: "Sample Product",
          price: 50,
          description: "A sample product description",
          product_images: [{ url: "/placeholder.svg", is_primary: true }],
        },
        buyer: {
          id: "buyer123",
          full_name: "John Doe",
          avatar_url: null,
          whatsapp_number: null,
        },
        seller: {
          id: "seller123",
          full_name: "Jane Smith",
          avatar_url: null,
          whatsapp_number: null,
        },
      }

      // Check if user is authorized to view this order
      if (data.buyer.id !== user?.id && data.seller.id !== user?.id) {
        toast.error("You are not authorized to view this order")
        router.push("/orders")
        return
      }

      setOrder(data)
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast.error("Failed to load order details")
      router.push("/orders")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderMessages = async (orderId: string) => {
    try {
      // Replace supabase logic with Firestore logic
      // For example, you can use Firebase/Firestore to fetch order messages
      // This is a placeholder and should be replaced with actual Firestore logic
      // For now, we'll use a local array to simulate the data
      const data: OrderMessage[] = [
        { id: "msg1", sender_id: "buyer123", message: "Hello, when can we expect the delivery?", created_at: "2024-04-15T12:00" },
        { id: "msg2", sender_id: "seller123", message: "Good afternoon! We're aiming to deliver by 3 PM today.", created_at: "2024-04-15T13:00" },
      ]

      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching order messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !order || !user) return

    setSendingMessage(true)

    try {
      // Replace supabase logic with Firestore logic
      // For example, you can use Firebase/Firestore to send a message
      // This is a placeholder and should be replaced with actual Firestore logic
      // For now, we'll use a local array to simulate the data
      setNewMessage("")
      fetchOrderMessages(order.id)

      // Send notification to the other party
      const recipientId = order.buyer.id === user.id ? order.seller.id : order.buyer.id
      // Replace supabase logic with Firestore logic
      // For example, you can use Firebase/Firestore to send a notification
      // This is a placeholder and should be replaced with actual Firestore logic
      // For now, we'll use a local array to simulate the data
      toast.success("Message sent")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    try {
      // Replace supabase logic with Firestore logic
      // For example, you can use Firebase/Firestore to update order status
      // This is a placeholder and should be replaced with actual Firestore logic
      // For now, we'll use a local array to simulate the data
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))

      // Send notification
      const recipientId = order.buyer.id === user?.id ? order.seller.id : order.buyer.id
      // Replace supabase logic with Firestore logic
      // For example, you can use Firebase/Firestore to send a notification
      // This is a placeholder and should be replaced with actual Firestore logic
      // For now, we'll use a local array to simulate the data
      toast.success("Order status updated")
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Failed to update order status")
    }
  }

  const contactWhatsApp = (phoneNumber: string, userName: string) => {
    if (!phoneNumber) {
      toast.error("WhatsApp number not available")
      return
    }

    const message = `Hi ${userName}! I'm contacting you about order #${order?.id.slice(-8).toUpperCase()} for ${order?.products.title}.`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <Link href="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]
  const StatusIcon = statusConfig.icon
  const isBuyer = order.buyer.id === user?.id
  const otherUser = isBuyer ? order.seller : order.buyer

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                    <p className="text-muted-foreground">
                      Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{statusConfig.description}</p>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={
                        order.products.product_images?.find((img) => img.is_primary)?.url ||
                        "/placeholder.svg?height=96&width=96" ||
                        "/placeholder.svg"
                      }
                      alt={order.products.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{order.products.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Unit Price:</span>
                        <span className="ml-2 font-medium">${order.products.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-2 font-medium">{order.quantity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="ml-2 font-bold text-primary">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link href={`/marketplace/products/${order.products.id}`}>View Product</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.pickup_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pickup Location</p>
                      <p className="text-muted-foreground">{order.pickup_location}</p>
                    </div>
                  </div>
                )}

                {order.pickup_time && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pickup Time</p>
                      <p className="text-muted-foreground">
                        {new Date(order.pickup_time).toLocaleDateString()} at{" "}
                        {new Date(order.pickup_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <p className="font-medium mb-2">Order Notes</p>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Messages */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Order Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No messages yet</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Other Party Info */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{isBuyer ? "Seller" : "Buyer"} Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.avatar_url || undefined} />
                    <AvatarFallback>{otherUser.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{otherUser.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{isBuyer ? "Seller" : "Buyer"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {otherUser.whatsapp_number && (
                    <Button
                      variant="outline"
                      className="w-full text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => contactWhatsApp(otherUser.whatsapp_number!, otherUser.full_name)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/messages?user=${otherUser.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            {!isBuyer && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Seller Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.status === "pending" && (
                    <>
                      <Button className="w-full" onClick={() => updateOrderStatus("confirmed")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Order
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={() => updateOrderStatus("cancelled")}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Order
                      </Button>
                    </>
                  )}

                  {order.status === "confirmed" && (
                    <Button className="w-full" onClick={() => updateOrderStatus("ready_for_pickup")}>
                      <Package className="h-4 w-4 mr-2" />
                      Mark Ready for Pickup
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Complete Order */}
            {order.status === "ready_for_pickup" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Complete Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mark this order as completed once the item has been collected.
                  </p>
                  <Button className="w-full" onClick={() => updateOrderStatus("completed")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${(order.products.price * order.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>${(order.total_amount - order.products.price * order.quantity).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report */}
            <Button variant="outline" size="sm" className="w-full text-muted-foreground">
              <Flag className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
