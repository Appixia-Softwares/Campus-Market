"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Search, Send, MoreVertical, Archive, Trash2, Star, CheckCheck, Check, Paperclip, X, Mic, StopCircle } from "lucide-react"
import { SiWhatsapp } from "react-icons/si";
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSearchParams } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import React, { useRef } from "react"

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
  attachment?: string | null
  audio?: string | null
}

// Robust waveform generator with error handling
const generateWaveform = (audioUrl: string, cb: (data: number[]) => void) => {
  if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
    cb([]);
    return;
  }
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    fetch(audioUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch audio: ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then(buffer => audioCtx.decodeAudioData(buffer))
      .then(decoded => {
        const raw = decoded.getChannelData(0);
        const samples = 64;
        const blockSize = Math.floor(raw.length / samples);
        const waveform = Array(samples).fill(0).map((_, i) => {
          const blockStart = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(raw[blockStart + j]);
          }
          return sum / blockSize;
        });
        cb(waveform);
      })
      .catch((err) => {
        console.error('Waveform generation failed:', err);
        cb([]);
      });
  } catch (err) {
    console.error('Waveform generation error:', err);
    cb([]);
  }
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

  // Typing indicator state
  const [otherTyping, setOtherTyping] = useState(false)
  let typingTimeout: NodeJS.Timeout | null = null

  // Attachment state
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Voice note state
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)

  // Waveform state
  const [waveform, setWaveform] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // When audioUrl changes, generate waveform
  useEffect(() => {
    if (audioUrl) {
      generateWaveform(audioUrl, setWaveform)
    }
  }, [audioUrl])

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    const w = canvasRef.current.width
    const h = canvasRef.current.height
    waveform.forEach((v, i) => {
      const x = (i / waveform.length) * w
      const y = h - v * h
      ctx.beginPath()
      ctx.moveTo(x, h)
      ctx.lineTo(x, y)
      ctx.stroke()
    })
  }, [waveform])

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

  // Listen for typing status in conversation
  useEffect(() => {
    if (!selectedConversation) return
    const unsub = onSnapshot(doc(db, 'conversations', selectedConversation.id), (docSnap) => {
      const data = docSnap.data()
      if (!data) return
      setOtherTyping(data.typing === selectedConversation.other_user.id)
    })
    return () => unsub()
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

  const startRecording = async () => {
    if (!navigator.mediaDevices) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    setMediaRecorder(recorder)
    setRecording(true)
    setRecordingTime(0)
    const interval = setInterval(() => setRecordingTime(t => t + 1), 1000)
    setRecordingInterval(interval)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      clearInterval(interval)
      setRecording(false)
      const blob = new Blob(chunks, { type: 'audio/webm' })
      setAudioBlob(blob)
      setAudioUrl(URL.createObjectURL(blob))
    }
    recorder.start()
  }
  const stopRecording = () => {
    mediaRecorder?.stop()
    setMediaRecorder(null)
  }
  const removeAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachment && !audioBlob) || !selectedConversation || !user) return
    setSendingMessage(true)
    let attachmentUrl = null
    if (attachment) {
      setUploading(true)
      // Mock upload logic: in real app, upload to storage and get URL
      await new Promise(res => setTimeout(res, 1200))
      attachmentUrl = attachmentPreview
      setUploading(false)
      setAttachment(null)
      setAttachmentPreview(null)
    }
    let audioFileUrl = null
    if (audioBlob) {
      setUploading(true)
      await new Promise(res => setTimeout(res, 1200))
      audioFileUrl = audioUrl
      setUploading(false)
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
    }
    try {
      await addDoc(collection(db, 'messages'), {
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
        read: false,
        created_at: new Date().toISOString(),
        attachment: attachmentUrl,
        audio: audioFileUrl,
      })
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
      typeof conv.other_user.full_name === 'string' && conv.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.products && typeof conv.products.title === 'string' && conv.products.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  const searchUsers = async (searchTerm: string) => {
    setSearching(true)
    setUserResults([])
    if (!searchTerm.trim()) {
      setSearching(false)
      return
    }
    const q = query(
      collection(db, "users"),
      where("full_name", ">=", searchTerm),
      where("full_name", "<=", searchTerm + "\uf8ff")
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
    let existing: any = null
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

  // Handle typing events
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    if (!selectedConversation || !user) return
    // Set typing status in Firestore
    setDoc(doc(db, 'conversations', selectedConversation.id), { typing: user.id }, { merge: true })
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      setDoc(doc(db, 'conversations', selectedConversation.id), { typing: null }, { merge: true })
    }, 2000)
  }
  const handleInputBlur = () => {
    if (!selectedConversation || !user) return
    setDoc(doc(db, 'conversations', selectedConversation.id), { typing: null }, { merge: true })
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment(file)
    setAttachmentPreview(URL.createObjectURL(file))
  }
  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentPreview(null)
  }

  // --- UI POLISH ---
  // 1. Add bg-white/95 and border to cards for contrast
  // 2. Add shadow and rounded corners
  // 3. Highlight selected conversation with bg-primary/10 and border-l-4 border-primary
  // 4. Make chat header sticky and visually distinct
  // 5. Improve empty state with icon and text centering
  // 6. Add hover/focus states to buttons and conversation items
  // 7. Ensure mobile responsiveness with flex-col on small screens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [showChat, setShowChat] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-4 md:py-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-120px)]">
          {/* Conversations List */}
          {(!isMobile || !showChat) && (
            <Card className="bg-white/95 border shadow-lg rounded-xl w-full md:w-1/3 flex flex-col">
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
                      {(filteredConversations as Conversation[]).map((conversation, index) => {
                        // Find the last message for this conversation
                        const lastMsg = messages.filter(m => m.conversation_id === conversation.id).slice(-1)[0];
                        return (
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
                                      src={conversation.products.product_images?.find((img) => img.is_primary)?.url || "/placeholder.svg?height=24&width=24"}
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
                                {lastMsg?.content
                                  ? lastMsg.content
                                  : lastMsg?.audio
                                    ? "Voice note"
                                    : lastMsg?.attachment
                                      ? "Attachment"
                                      : "No messages yet"}
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
                                    <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
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
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Chat Area */}
          {(selectedConversation && (!isMobile || showChat)) && (
            <div className="flex-1 flex flex-col">
              <Card className="bg-white/95 border shadow-lg rounded-xl h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b bg-primary/10 dark:bg-primary/20 rounded-t-xl sticky top-0 z-10 flex flex-col gap-1 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Back button for mobile */}
                      {isMobile && (
                        <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="mr-2">
                          ←
                        </Button>
                      )}
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
                          <SiWhatsapp className="h-4 w-4 mr-1" />
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
                  <div className="absolute inset-0 pointer-events-none bg-[url('/chat-bg1.svg')] opacity-10" />
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
                          >
                            <MessageBubble
                              message={message}
                              isSelf={message.sender_id === user?.id}
                              avatarUrl={message.sender_id === user?.id ? user.avatar_url : selectedConversation.other_user.avatar_url}
                              name={message.sender_id === user?.id ? user.full_name : selectedConversation.other_user.full_name}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                    {otherTyping && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse mt-2">
                        <span>{selectedConversation.other_user.full_name} is typing…</span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      </div>
                    )}
                  </div>
                </CardContent>
                {/* Message Input */}
                <div className="border-t bg-primary/10 dark:bg-primary/20 rounded-b-xl p-4">
                  <div className="flex gap-2 items-end">
                    <label className="cursor-pointer flex items-center justify-center h-10 w-10 rounded bg-white/80 hover:bg-primary/20 border shadow" title="Attach file">
                      <Paperclip className="h-5 w-5 text-primary" />
                      <input type="file" className="hidden" onChange={handleAttachmentChange} accept="image/*,application/pdf" />
                    </label>
                    {/* Mic button */}
                    <button type="button" onClick={recording ? stopRecording : startRecording} className="flex items-center justify-center h-10 w-10 rounded bg-white/80 hover:bg-primary/20 border shadow" title={recording ? "Stop recording" : "Record voice note"}>
                      {recording ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-primary" />}
                    </button>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="min-h-[40px] max-h-[120px] resize-none bg-white/90 dark:bg-gray-900 border rounded focus:ring-2 focus:ring-primary"
                        disabled={recording}
                      />
                      {/* Show attachment preview ... */}
                      {audioUrl && (
                        <div className="relative mt-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded p-2 shadow">
                          <audio src={audioUrl} controls className="h-8" />
                          <button type="button" onClick={removeAudio} className="ml-2 bg-white/80 rounded-full p-1 shadow">
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                          <span className="text-xs text-muted-foreground">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                      {recording && (
                        <div className="flex items-center gap-2 mt-2 animate-pulse">
                          <canvas ref={canvasRef} width={120} height={32} className="bg-gray-200 rounded" />
                          <span className="text-xs text-muted-foreground">Recording… {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                    <Button onClick={sendMessage} disabled={sendingMessage || (!newMessage.trim() && !attachment && !audioBlob)} className="bg-primary text-white hover:bg-primary/90 shadow-md">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
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
    </div>
  )
}

// --- MessageBubble component for DRYness ---
function MessageBubble({ message, isSelf, avatarUrl, name }: { message: any; isSelf: boolean; avatarUrl?: string | null; name?: string }) {
  return (
    <div className={`flex items-end gap-2 ${isSelf ? 'justify-end' : 'justify-start'} group`}>
      {!isSelf && (
        <img
          src={avatarUrl || '/placeholder-user.jpg'}
          alt={name || 'User'}
          className="w-8 h-8 rounded-full border shadow-sm bg-white object-cover"
        />
      )}
      <div className={`relative max-w-[70%] px-4 py-2 rounded-2xl shadow-md transition-all duration-200 ${isSelf ? 'bg-primary text-white rounded-br-none ml-auto' : 'bg-white text-gray-900 rounded-bl-none mr-auto'} group-hover:scale-105 group-hover:shadow-lg animate-fade-in-slide`}
        style={{ borderBottomRightRadius: isSelf ? 4 : 16, borderBottomLeftRadius: isSelf ? 16 : 4 }}
      >
        <div className="whitespace-pre-line break-words">{message.content}</div>
        {message.attachment && (
          <div className="mt-2">
            {message.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={message.attachment} alt="Attachment" className="max-h-40 rounded shadow border" />
            ) : (
              <a href={message.attachment} target="_blank" rel="noopener noreferrer" className="text-primary underline">View attachment</a>
            )}
          </div>
        )}
        {message.audio && (
          <div className="mt-2 flex flex-col items-center">
            <WaveformPlayer audioUrl={message.audio} />
            <audio src={message.audio} controls className="w-full max-w-xs rounded shadow border mt-1" />
          </div>
        )}
        <div className="flex items-center justify-between mt-1 gap-2">
          <span className="text-xs text-muted-foreground">
            {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : ''}
          </span>
          {/* Tick indicator for self messages */}
          {isSelf && (
            <span className="flex items-center gap-1 ml-2">
              {message.read ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <Check className="w-4 h-4 text-gray-400" />
              )}
            </span>
          )}
        </div>
        {/* Bubble tail */}
        <span className={`absolute bottom-0 ${isSelf ? 'right-0' : 'left-0'} w-3 h-3 bg-inherit rounded-br-2xl rounded-bl-2xl z-0`} style={{ transform: isSelf ? 'translateY(50%) rotate(45deg)' : 'translateY(50%) rotate(-45deg)' }} />
      </div>
      {isSelf && (
        <img
          src={avatarUrl || '/placeholder-user.jpg'}
          alt={name || 'You'}
          className="w-8 h-8 rounded-full border shadow-sm bg-white object-cover"
        />
      )}
    </div>
  )
}

// --- WaveformPlayer component ---
function WaveformPlayer({ audioUrl }: { audioUrl: string }) {
  const [waveform, setWaveform] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    if (audioUrl && typeof audioUrl === "string" && audioUrl.trim() !== "") {
      generateWaveform(audioUrl, setWaveform)
    } else {
      setWaveform([])
    }
  }, [audioUrl])
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    const w = canvasRef.current.width
    const h = canvasRef.current.height
    waveform.forEach((v, i) => {
      const x = (i / waveform.length) * w
      const y = h - v * h
      ctx.beginPath()
      ctx.moveTo(x, h)
      ctx.lineTo(x, y)
      ctx.stroke()
    })
  }, [waveform])
  if (waveform.length === 0) {
    return <div className="text-xs text-muted-foreground">No waveform available</div>
  }
  return <canvas ref={canvasRef} width={120} height={32} className="bg-gray-200 rounded" />
}
