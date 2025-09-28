export interface Customer {
  id: string
  name: string
  company?: string
  position?: string
  phone?: string
  email?: string
  industry?: string
  importance: 'high' | 'medium' | 'low'
  status: 'potential' | 'following' | 'signed' | 'lost'
  tags: string[]
  lastContactDate?: string
  nextFollowUpDate?: string
  birthday?: string
  address?: string
  notes?: string
  source?: string
  createdAt: string
  updatedAt: string
}

export interface Communication {
  id: string
  customerId: string
  type: 'call' | 'email' | 'meeting' | 'wechat' | 'visit' | 'other'
  content: string
  result: string
  nextAction?: string
  createdAt: string
  attachments?: string[]
  customerName?: string
}

export interface Reminder {
  id: string
  customerId: string
  type: 'follow_up' | 'birthday' | 'festival' | 'contract'
  title: string
  description: string
  reminderDate: string
  completed: boolean
  createdAt: string
  customerName?: string
}

export interface SalesStage {
  id: string
  name: string
  probability: number
  color: string
  order: number
}

export interface Opportunity {
  id: string
  customerId: string
  title: string
  value: number
  stage: string
  probability: number
  expectedCloseDate: Date
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface ScriptTemplate {
  id: string
  title: string
  category: string
  scenario: string
  content: string
  tags: string[]
}

export interface Analytics {
  totalCustomers: number
  totalOpportunities: number
  conversionRate: number
  averageDealSize: number
  monthlyRevenue: number
  followUpEfficiency: number
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'sales'
  avatar?: string
  department: string
  createdAt: Date
}

export interface TeamMessage {
  id: string
  userId: string
  customerId?: string
  content: string
  type: 'message' | 'transfer' | 'assignment'
  createdAt: Date
  readBy: string[]
}

export interface CustomerConflict {
  customerId: string
  users: string[]
  type: 'duplicate' | 'assignment_conflict'
  resolvedAt?: Date
}
