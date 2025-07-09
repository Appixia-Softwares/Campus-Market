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
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          products (id, title, price, product_images (url, is_primary))
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (error) throw error

      // Get other user details and unread counts for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id

          // Get other user details
          const { data: userData } = await supabase
            .from("users")
            .select("id, full_name, avatar_url, whatsapp_number")
            .eq("id", otherUserId)
            .single()

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("read", false)
            .neq("sender_id", user.id)

          return {
            ...conv,
            other_user: userData,
            last_message: lastMessage?.content || null,
            last_message_time: lastMessage?.created_at || null,
            unread_count: unreadCount || 0,
          }
        }),
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast.error("Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!user) return

    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("read", false)
        .neq("sender_id", user.id)

      // Update local state
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv)))
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setSendingMessage(true)

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
        read: false,
      })

      if (error) throw error

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation.id)

      setNewMessage("")
      fetchMessages(selectedConversation.id)
      fetchConversations()

      // Send notification
      await supabase.from("notifications").insert({
        user_id: selectedConversation.other_user.id,
        title: "New Message",
        content: `${user.full_name} sent you a message`,
        link: `/messages`,
        type: "message",
      })

      toast.success("Message sent")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Chat with buyers and sellers
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnread} unread
                </Badge>
              )}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversations</CardTitle>
                <Badge variant="secondary">{conversations.length}</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
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
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No conversations</h3>
                    <p className="text-muted-foreground">Start chatting with buyers and sellers</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation, index) => (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conversation.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
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
                                    src={
                                      conversation.products.product_images?.find((img) => img.is_primary)?.url ||
                                      "/placeholder.svg?height=24&width=24" ||
                                      "/placeholder.svg"
                                    }
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
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b">
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

                    <div className="flex gap-2">
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
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-400px)]">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs opacity-70">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                                {message.sender_id === user?.id && (
                                  <CheckCheck className={`h-3 w-3 ${message.read ? "text-blue-400" : "opacity-50"}`} />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
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
                      className="min-h-[40px] max-h-[120px] resize-none"
                    />
                    <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
