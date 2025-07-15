export type Subscriber = {
  id: string
  email: string
  created_at: string
  status: 'active' | 'unsubscribed'
  source: 'newsletter' | 'early_access'
  university?: string
  name?: string
}

export type Newsletter = {
  id: string
  subject: string
  content: string
  sent_at: string | null
  created_at: string
  status: 'draft' | 'sent'
}

export interface Notification {
  id: string; // Firestore document ID
  userId: string | null; // recipient user, or null for broadcast
  type: 'message' | 'order' | 'admin' | 'reminder' | 'product' | 'verification' | 'accommodation';
  title: string;
  body: string;
  link?: string; // URL or route for redirection
  read: boolean;
  createdAt: Date;
  extraData?: Record<string, any>; // context, e.g., orderId, productId
  delivered?: boolean; // for push/email tracking
  expiresAt?: Date; // for time-limited notifications
  priority?: 'low' | 'normal' | 'high';
  icon?: string; // icon URL or type for UI
  actionLabel?: string; // e.g., "View", "Reply"
}
