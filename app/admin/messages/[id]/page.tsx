import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import ConversationList from "@/components/messaging/conversation-list"
import { MessageThread } from "@/components/messaging/message-thread"
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, addDoc } from 'firebase/firestore';

export const metadata: Metadata = {
  title: "Messages | ZimStudentHub",
  description: "Chat with other users about accommodations and marketplace items",
}

async function getConversationDetails(id: string) {
  // This function is no longer used as supabase logic is removed
  return null
}

export default async function MessageThreadPage({ params }: { params: { id: string } }) {
  // This function is no longer used as supabase logic is removed
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="hidden md:block md:col-span-3">
          <Card className="h-[calc(100vh-12rem)] overflow-y-auto">
            <ConversationList />
          </Card>
        </div>

        <div className="md:col-span-9">
          <div className="h-[calc(100vh-12rem)]">
            {/* @ts-expect-error: MessageThread expects id prop */}
            <MessageThread id={params.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
