import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not defined. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase row shapes (snake_case) used for request/response mapping
export interface SupabaseCustomer {
  id: string
  name: string
  company: string | null
  position: string | null
  industry: string | null
  phone: string | null
  email: string | null
  wechat: string | null
  address: string | null
  tags: string[] | null
  importance: 'high' | 'medium' | 'low'
  status: 'potential' | 'following' | 'signed' | 'lost'
  source: string | null
  notes: string | null
  last_contact: string | null
  next_follow_date: string | null
  birthday: string | null
  created_at: string
  updated_at: string
  user_id: string
}

export interface SupabaseFollowUpReminder {
  id: string
  customer_id: string
  remind_date: string
  title: string | null
  message: string | null
  type: 'follow_up' | 'birthday' | 'festival' | 'contract'
  is_completed: boolean
  created_at: string
  user_id: string
  customers?: { name: string } | null
}

export interface SupabaseCommunicationHistory {
  id: string
  customer_id: string
  type: 'phone' | 'email' | 'meeting' | 'wechat' | 'other'
  content: string
  result: string | null
  next_step: string | null
  attachments: string[] | null
  created_at: string
  user_id: string
  customers?: { name: string } | null
}
