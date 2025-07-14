"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Search, Send, Phone, MoreVertical, Archive, Trash2, Star, CheckCheck, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, addDoc, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSearchParams } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"

interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  product_id: string | null
  last_message: string | null
  last_message_time: string | null
  unread_count: number
  created_at: string
  updated_at: string
  other_user: {
    id: string
    full_name: string
    avatar_url: string | null
    whatsapp_number: string | null
  }
  products: {
    id: string
    title: string
    price: number
    product_images: { url: string; is_primary: boolean }[]
  } | null
  order_id: string | null
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [userResults, setUserResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchParams = useSearchParams()
  const orderIdParam = searchParams?.get("order")
  const [orderInfo, setOrderInfo] = useState<any>(null)

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  // Auto-select or create conversation for ?order=...
  useEffect(() => {
    if (!user || !orderIdParam) return
    (async () => {
      // Try to find existing conversation for this order
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.id),
        where("order_id", "==", orderIdParam)
      )
      const snap = await getDocs(q)
      let conv = null
      if (!snap.empty) {
        const docSnap = snap.docs[0]
        const data = docSnap.data()
        if (!data) return
        // Find the other participant
        const otherUserId = data.participants.find((id: string) => id !== user.id)
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
        const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : { full_name: 'Unknown', avatar_url: null, whatsapp_number: null }
        conv = {
          id: docSnap.id,
          participant_1_id: data.participant_1_id,
          participant_2_id: data.participant_2_id,
          product_id: data.product_id || null,
          last_message: data.last_message || null,
          last_message_time: data.last_message_time || null,
          unread_count: 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
          other_user: {
            id: otherUserId,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
            whatsapp_number: otherUser.whatsapp_number || null,
          },
          products: null,
          order_id: orderIdParam,
        }
      } else {
        // Fetch order info to get participants
        const orderDoc = await getDoc(doc(db, "orders", orderIdParam))
        if (!orderDoc.exists()) return
        const order = orderDoc.data()
        setOrderInfo(order)
        const otherUserId = order.seller_id === user.id ? order.buyer_id : order.seller_id
        // Create conversation
        const docRef = await addDoc(collection(db, "conversations"), {
          participants: [user.id, otherUserId],
          participant_1_id: user.id,
          participant_2_id: otherUserId,
          order_id: orderIdParam,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: null,
          last_message_time: null,
        })
        const newDoc = await getDoc(docRef)
        const data = newDoc.data()
        if (!data) return
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
        const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : { full_name: 'Unknown', avatar_url: null, whatsapp_number: null }
        conv = {
          id: newDoc.id,
          participant_1_id: data.participant_1_id,
          participant_2_id: data.participant_2_id,
          product_id: data.product_id || null,
          last_message: data.last_message || null,
          last_message_time: data.last_message_time || null,
          unread_count: 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
          other_user: {
            id: otherUserId,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
            whatsapp_number: otherUser.whatsapp_number || null,
          },
          products: null,
          order_id: orderIdParam,
        }
      }
      if (conv) setSelectedConversation(conv)
    })()
  }, [user, orderIdParam])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  // --- Firestore Conversation & Message Logic ---
  const fetchConversations = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Query conversations where user is a participant
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.id)
      )
      const snapshot = await getDocs(q)
      const convs: Conversation[] = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        // Find the other participant
        const otherUserId = data.participants.find((id: string) => id !== user.id)
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
        const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : { full_name: 'Unknown', avatar_url: null, whatsapp_number: null }
        // Fetch product if exists
        let product = null
        if (data.product_id) {
          const productDoc = await getDoc(doc(db, 'products', data.product_id))
          if (productDoc.exists()) {
            const prodData = productDoc.data()
            const imagesQuery = query(collection(db, 'product_images'), where('product_id', '==', data.product_id))
            const imagesSnap = await getDocs(imagesQuery)
            const images = imagesSnap.docs.map(img => img.data()) as { url: string; is_primary: boolean }[]
            product = { id: productDoc.id, title: prodData.title, price: prodData.price, product_images: images }
          }
        }
        // Count unread messages
        const messagesQuery = query(collection(db, 'messages'), where('conversation_id', '==', docSnap.id), where('read', '==', false), where('sender_id', '!=', user.id))
        const unreadSnap = await getDocs(messagesQuery)
        return {
          id: docSnap.id,
          participant_1_id: data.participant_1_id,
          participant_2_id: data.participant_2_id,
          product_id: data.product_id || null,
          last_message: data.last_message || null,
          last_message_time: data.last_message_time || null,
          unread_count: unreadSnap.size,
          created_at: data.created_at,
          updated_at: data.updated_at,
          other_user: {
            id: otherUserId,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
            whatsapp_number: otherUser.whatsapp_number || null,
          },
          products: product,
          order_id: data.order_id || null,
        }
      }))
      setConversations(convs.sort((a, b) => (b.last_message_time || '').localeCompare(a.last_message_time || '')))
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      // Listen for live updates
      const q = query(collection(db, 'messages'), where('conversation_id', '==', conversationId), orderBy('created_at', 'asc'))
      const unsub = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message))
      })
      return () => unsub()
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!user) return
    try {
      // Mark all unread messages in this conversation as read
      const q = query(collection(db, 'messages'), where('conversation_id', '==', conversationId), where('read', '==', false), where('sender_id', '!=', user.id))
      const snap = await getDocs(q)
      snap.forEach(async (docSnap) => {
        await updateDoc(doc(db, 'messages', docSnap.id), { read: true })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return
    setSendingMessage(true)
    try {
      // Add message to Firestore
      await addDoc(collection(db, 'messages'), {
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
        read: false,
        created_at: new Date().toISOString(),
      })
      // Update conversation last message
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        last_message: newMessage.trim(),
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const contactWhatsApp = (conversation: Conversation) => {
    if (!conversation.other_user.whatsapp_number) {
      toast.error("WhatsApp number not available")
      return
    }

    const message = `Hi ${conversation.other_user.full_name}! I'm contacting you from Campus Market${
      conversation.products ? ` about your ${conversation.products.title}` : ""
    }.`
    const whatsappUrl = `https://wa.me/${conversation.other_user.whatsapp_number}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.products?.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  const searchUsers = async (query: string) => {
    setSearching(true)
    setUserResults([])
    if (!query.trim()) {
      setSearching(false)
      return
    }
    const q = query(
      collection(db, "users"),
      where("full_name", ">=", query),
      where("full_name", "<=", query + "\uf8ff")
    )
    const snap = await getDocs(q)
    setUserResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    setSearching(false)
  }

  const startConversation = async (otherUser: any, orderId?: string) => {
    if (!user) return
    // Check if conversation exists
    let convQuery
    if (orderId) {
      convQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.id),
        where("order_id", "==", orderId)
      )
    } else {
      convQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.id)
      )
    }
    const snap = await getDocs(convQuery)
    let existing = null
    snap.forEach(docSnap => {
      const data = docSnap.data()
      if (data && data.participants.includes(otherUser.id) && (!orderId || data.order_id === orderId)) existing = { id: docSnap.id, participant_1_id: data.participant_1_id, participant_2_id: data.participant_2_id, product_id: data.product_id || null, last_message: data.last_message || null, last_message_time: data.last_message_time || null, unread_count: 0, created_at: data.created_at, updated_at: data.updated_at, other_user: { id: otherUser.id, full_name: otherUser.full_name, avatar_url: otherUser.avatar_url, whatsapp_number: otherUser.whatsapp_number || null }, products: null, order_id: data.order_id || null }
    })
    let convId = existing?.id
    if (!convId) {
      const docRef = await addDoc(collection(db, "conversations"), {
        participants: [user.id, otherUser.id],
        participant_1_id: user.id,
        participant_2_id: otherUser.id,
        order_id: orderId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message: null,
        last_message_time: null,
      })
      convId = docRef.id
    }
    // Fetch the new conversation object
    const docSnap = await getDoc(doc(db, "conversations", convId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      setSelectedConversation({
        id: docSnap.id,
        participant_1_id: data.participant_1_id,
        participant_2_id: data.participant_2_id,
        product_id: data.product_id || null,
        last_message: data.last_message || null,
        last_message_time: data.last_message_time || null,
        unread_count: 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        other_user: {
          id: otherUser.id,
          full_name: otherUser.full_name,
          avatar_url: otherUser.avatar_url,
          whatsapp_number: otherUser.whatsapp_number || null,
        },
        products: null,
        order_id: orderId || null,
      })
      setShowNewMessage(false)
    }
  }

  // --- UI POLISH ---
  // 1. Add bg-white/95 and border to cards for contrast
  // 2. Add shadow and rounded corners
  // 3. Highlight selected conversation with bg-primary/10 and border-l-4 border-primary
  // 4. Make chat header sticky and visually distinct
  // 5. Improve empty state with icon and text centering
  // 6. Add hover/focus states to buttons and conversation items
  // 7. Ensure mobile responsiveness with flex-col on small screens
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <Card className="bg-white/95 border shadow-lg rounded-xl w-full lg:w-1/3 flex flex-col">
            <CardHeader className="border-b bg-gray-50 rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Conversations</CardTitle>
                <Badge variant="secondary">{conversations.length}</Badge>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10 bg-white border rounded focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-muted-foreground/10">
                {loading ? (
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <MessageSquare className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No conversations</h3>
                    <p>Start chatting with buyers and sellers</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation, index) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 cursor-pointer flex items-center gap-3 transition-colors rounded-lg border-l-4 ${selectedConversation?.id === conversation.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50 border-transparent"}`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.other_user.avatar_url || undefined} />
                            <AvatarFallback>{conversation.other_user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {conversation.unread_count > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                            >
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium truncate">{conversation.other_user.full_name}</h4>
                            {conversation.last_message_time && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          {conversation.products && (
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded overflow-hidden bg-muted">
                                <img
                                  src={conversation.products.product_images?.find((img) => img.is_primary)?.url || "/placeholder.svg?height=24&width=24" || "/placeholder.svg"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-xs text-muted-foreground truncate">
                                {conversation.products.title}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message || "No messages yet"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {conversation.other_user.whatsapp_number && (
                              <DropdownMenuItem onClick={() => contactWhatsApp(conversation)}>
                                <Phone className="h-4 w-4 mr-2 text-green-600" />
                                WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              Star
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <Card className="bg-white/95 border shadow-lg rounded-xl h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b bg-gray-50 rounded-t-xl sticky top-0 z-10 flex flex-col gap-1 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                        <AvatarFallback>{selectedConversation.other_user.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.other_user.full_name}</h3>
                        {selectedConversation.products && (
                          <p className="text-sm text-muted-foreground">About: {selectedConversation.products.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <ModeToggle />
                      {selectedConversation.other_user.whatsapp_number && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => contactWhatsApp(selectedConversation)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            Star Conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {/* Order info if present */}
                  {selectedConversation?.order_id && orderInfo && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Order: <span className="font-semibold">{orderInfo?.products?.title || orderInfo?.id || selectedConversation.order_id}</span> • Status: {orderInfo?.status || "-"}
                    </div>
                  )}
                </CardHeader>
                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-320px)] bg-gradient-to-br from-gray-100 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
                  <div className="absolute inset-0 pointer-events-none bg-[url('/chat-bg.svg')] opacity-10" />
                  <div className="space-y-4 relative z-10">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex items-end gap-2 ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                          >
                            {/* Avatar for other user */}
                            {message.sender_id !== user?.id && (
                              <Avatar className="h-8 w-8 mb-1">
                                <AvatarImage src={selectedConversation.other_user.avatar_url || undefined} />
                                <AvatarFallback>{selectedConversation.other_user.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            {/* Message bubble */}
                            <div
                              className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm border transition-colors group
                                ${message.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground border-primary/30 rounded-br-none after:content-[''] after:absolute after:right-[-8px] after:bottom-2 after:border-8 after:border-transparent after:border-l-primary"
                                  : "bg-white text-gray-900 border-muted-foreground/10 rounded-bl-none after:content-[''] after:absolute after:left-[-8px] after:bottom-2 after:border-8 after:border-transparent after:border-r-white dark:bg-gray-800 dark:text-white dark:after:border-r-gray-800"}
                                hover:bg-primary/20 dark:hover:bg-gray-700/80`}
                            >
                              <p className="text-sm break-words whitespace-pre-line">{message.content}</p>
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <span className="text-xs opacity-70">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                                {message.sender_id === user?.id && (
                                  <CheckCheck className={`h-3 w-3 ${message.read ? "text-blue-400" : "opacity-50"}`} />
                                )}
                              </div>
                            </div>
                            {/* Avatar for self (optional, can comment out if not wanted) */}
                            {message.sender_id === user?.id && (
                              <Avatar className="h-8 w-8 mb-1">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{user.full_name?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </CardContent>
                {/* Message Input */}
                <div className="border-t p-4 bg-gray-50 rounded-b-xl">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      className="min-h-[40px] max-h-[120px] resize-none bg-white border rounded focus:ring-2 focus:ring-primary"
                    />
                    <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} className="bg-primary text-white hover:bg-primary/90">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-white/95 border shadow-lg rounded-xl h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the list to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
        {/* New Message Dialog remains unchanged */}
      </div>
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search users by name..."
            value={userSearch}
            onChange={e => {
              setUserSearch(e.target.value)
              searchUsers(e.target.value)
            }}
            className="mb-4"
          />
          {searching ? (
            <div className="text-center text-muted-foreground">Searching...</div>
          ) : userResults.length === 0 && userSearch ? (
            <div className="text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userResults.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => startConversation(u)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback>{u.full_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{u.full_name}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
