"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, ArrowLeft, ImageIcon, Paperclip, Smile } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, updateDoc, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import EmojiPicker from "emoji-picker-react"; // Assume emoji-picker-react is installed

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read: boolean
  users: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  fileUrl?: string | null;
  fileType?: string | null;
}

export function MessageThread() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileToSend, setFileToSend] = useState<File | null>(null);

  // Typing indicator logic
  useEffect(() => {
    if (!id || !user) return
    const convoRef = doc(db, 'conversations', id)
    // Listen for typing field
    const unsub = onSnapshot(convoRef, (snap) => {
      const data = snap.data()
      if (!data) return
      setIsOtherTyping(data.typing && data.typing !== user.id)
      setLastReadMessageId(data.lastReadMessageId || null)
    })
    return () => unsub()
  }, [id, user])

  // Update typing status
  const setTyping = useCallback((typing: boolean) => {
    if (!id || !user) return
    const convoRef = doc(db, 'conversations', id)
    updateDoc(convoRef, { typing: typing ? user.id : null })
  }, [id, user])

  // Fetch messages and subscribe to updates
  useEffect(() => {
    if (!id || !user) return
    setLoading(true)
    // Listen for live updates
    const q = query(collection(db, 'messages'), where('conversation_id', '==', id), orderBy('created_at', 'asc'))
    const unsub = onSnapshot(q, async (snapshot) => {
      const msgs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const msg = docSnap.data() as Message
        // Fetch user info for each message
        const userDoc = await getDoc(doc(db, 'users', msg.sender_id))
        msg.users = userDoc.exists() ? userDoc.data() as any : { full_name: 'Unknown', avatar_url: null }
        return { ...msg, id: docSnap.id }
      }))
      setMessages(msgs)
      setLoading(false)
      // Mark as read if there are unread messages not from current user
      msgs.forEach(async (msg) => {
        if (!msg.read && msg.sender_id !== user.id) {
          await updateDoc(doc(db, 'messages', msg.id), { read: true })
        }
      })
    })
    return () => unsub()
  }, [id, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !id) return
    setSending(true)
    try {
      await addDoc(collection(db, 'messages'), {
        conversation_id: id,
        sender_id: user.id,
        content: messageText.trim(),
        read: false,
        created_at: new Date().toISOString(),
      })
      // Update conversation last message
      await updateDoc(doc(db, 'conversations', id), {
        last_message: messageText.trim(),
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setMessageText("")
      textareaRef.current?.focus()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Handle textarea key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
      setTyping(false)
    } else {
      setTyping(true)
    }
  }

  // Clear typing status on blur
  const handleBlur = () => setTyping(false)

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileToSend(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Handle file upload and send
  const handleSendFile = async () => {
    if (!fileToSend || !user || !id) return;
    setUploadingFile(true);
    try {
      const storage = getStorage();
      const filePath = `messages/${id}/${Date.now()}-${fileToSend.name}`;
      const fileRef = storageRef(storage, filePath);
      const uploadTask = uploadBytes(fileRef, fileToSend);
      await uploadTask;
      const url = await getDownloadURL(fileRef);
      await addDoc(collection(db, 'messages'), {
        conversation_id: id,
        sender_id: user.id,
        content: fileToSend.type.startsWith("image/") ? "[image]" : fileToSend.name,
        fileUrl: url,
        fileType: fileToSend.type,
        read: false,
        created_at: new Date().toISOString(),
      });
      setFileToSend(null);
      setFilePreview(null);
      setUploadProgress(null);
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not upload file.", variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle emoji picker
  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setMessageText(
      messageText.slice(0, start) + emoji + messageText.slice(end)
    );
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
    setShowEmojiPicker(false);
  };

  // Update lastReadMessageId when messages are read
  useEffect(() => {
    if (!id || !user || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.sender_id !== user.id && !lastMsg.read) {
      const convoRef = doc(db, 'conversations', id)
      updateDoc(convoRef, { lastReadMessageId: lastMsg.id })
    }
  }, [id, user, messages])

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)]">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-lg font-medium flex items-center">
            {loading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <>
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={messages[0]?.users?.avatar_url || ""} />
                  <AvatarFallback>{messages[0]?.users?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span>{messages[0]?.users?.full_name || "Conversation"}</span>
              </>
            )}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto px-4 py-2">
        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="text-xs text-blue-500 mb-2 animate-pulse">User is typing…</div>
        )}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${i % 2 === 0 ? "ml-auto" : "mr-auto"}`}>
                <Skeleton className="h-16 w-64 rounded-lg" />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, idx) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${message.sender_id === user?.id ? "flex-row-reverse" : ""}`}>
                  {message.sender_id !== user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.users?.avatar_url || ""} />
                      <AvatarFallback>{message.users?.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {/* Render image inline if fileUrl and fileType is image */}
                      {message.fileUrl && message.fileType?.startsWith("image/") ? (
                        <img src={message.fileUrl} alt="sent image" className="max-w-xs rounded mb-1" />
                      ) : message.fileUrl ? (
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{message.content}</a>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                    {/* Read receipt for last message sent by user */}
                    {message.sender_id === user?.id && idx === messages.length - 1 && lastReadMessageId === message.id && (
                      <span className="text-xs text-green-500 flex items-center gap-1 mt-1">Seen <CheckmarkIcon className="h-3 w-3" /></span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="border-t px-4 py-3">
        <div className="flex items-end w-full gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleBlur}
              className="min-h-[60px] resize-none pr-20"
              disabled={sending || uploadingFile}
            />
            {/* Emoji picker button */}
            <div className="absolute bottom-2 right-16 flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowEmojiPicker((v) => !v)} aria-label="Add emoji">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
              {/* File upload button */}
              <label className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer bg-muted hover:bg-muted/70">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {/* Emoji picker dropdown */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
              </div>
            )}
            {/* File preview and upload progress */}
            {fileToSend && (
              <div className="absolute bottom-16 left-0 right-0 bg-white border rounded shadow p-2 flex items-center gap-2 z-40">
                {filePreview ? <img src={filePreview} alt="preview" className="h-12 w-12 object-cover rounded" /> : <span>{fileToSend.name}</span>}
                <Button size="sm" onClick={handleSendFile} disabled={uploadingFile}>Send</Button>
                <Button size="sm" variant="outline" onClick={() => { setFileToSend(null); setFilePreview(null); }}>Cancel</Button>
              </div>
            )}
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending || uploadingFile}
            className="h-10 w-10 rounded-full p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function CheckmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M4 8.5l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
