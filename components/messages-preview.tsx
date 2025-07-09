import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import type { Message, Conversation } from "@/types"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function MessagesPreview() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      try {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          orderBy('updated_at', 'desc'),
          limit(5)
        )

        const snapshot = await getDocs(conversationsQuery)
        const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setConversations(conversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  if (loading) {
    return <div>Loading messages...</div>
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <div key={conversation.id} className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm font-medium">{conversation.last_message}</p>
          <p className="text-xs text-gray-400">
            {new Date(conversation.updated_at).toLocaleDateString()}
              </p>
            </div>
      ))}
    </div>
  )
}
