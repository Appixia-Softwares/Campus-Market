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
