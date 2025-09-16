import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zxqgdxydzolafekafljr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cWdkeHlkem9sYWZla2FmbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzExODIsImV4cCI6MjA3MzUwNzE4Mn0.XtXy8hG5nfLrTKabyLJvFvn3BAaOmhaNyzMxPzpLrY0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Subscriber {
  id?: string
  email: string
  subscribed_at: string
  status: 'active' | 'unsubscribed'
  source: 'countdown_banner' | 'countdown_modal' | 'landing_page'
  created_at?: string
  updated_at?: string
}
