import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表类型定义
export interface Customer {
  id: string;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  address?: string;
  tags?: string[];
  importance: 'high' | 'medium' | 'low';
  status: 'potential' | 'following' | 'signed' | 'lost';
  source?: string;
  notes?: string;
  last_contact?: string;
  next_follow_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface FollowUpReminder {
  id: string;
  customer_id: string;
  remind_date: string;
  message: string;
  is_completed: boolean;
  created_at: string;
  user_id: string;
}

export interface CommunicationHistory {
  id: string;
  customer_id: string;
  type: 'phone' | 'email' | 'meeting' | 'wechat' | 'other';
  content: string;
  result?: string;
  next_step?: string;
  attachments?: string[];
  created_at: string;
  user_id: string;
}