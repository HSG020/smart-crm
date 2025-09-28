import { create } from 'zustand'
import { message } from 'antd'
import { User, TeamMessage, CustomerConflict } from '../types'
import { supabase } from '../lib/supabase'

// Supabase type definitions for team_members
interface SupabaseTeamMember {
  id: string
  name: string
  email: string
  phone: string | null
  role: string | null
  department: string | null
  created_at: string
  updated_at: string
}

type NewUserInput = Omit<User, 'id' | 'createdAt'>

const mapUserFromDb = (record: SupabaseTeamMember): User => ({
  id: record.id,
  name: record.name,
  email: record.email,
  phone: record.phone ?? undefined,
  role: (record.role ?? 'sales') as 'admin' | 'manager' | 'sales',
  department: record.department ?? '销售部',
  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${record.name}`,
  createdAt: new Date(record.created_at)
})

const buildInsertPayload = (user: NewUserInput) => ({
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
  department: user.department ?? null
})

const buildUpdatePayload = (user: User) => ({
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
  department: user.department ?? null,
  updated_at: new Date().toISOString()
})

interface TeamStore {
  users: User[]
  messages: TeamMessage[]
  conflicts: CustomerConflict[]
  currentUser: User | null
  loading: boolean

  setUsers: (users: User[]) => void
  setMessages: (messages: TeamMessage[]) => void
  setConflicts: (conflicts: CustomerConflict[]) => void
  setCurrentUser: (user: User) => void
  addUser: (user: NewUserInput) => Promise<void>
  updateUser: (user: User) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  addMessage: (message: TeamMessage) => Promise<void>
  loadUsers: () => Promise<void>
  loadMessages: () => Promise<void>
  loadConflicts: () => Promise<void>
  checkCustomerConflicts: (customerId: string, userId: string) => Promise<void>
  resolveConflict: (customerId: string) => Promise<void>
  getUnreadMessages: (userId: string) => TeamMessage[]
  markMessageAsRead: (messageId: string, userId: string) => Promise<void>
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  users: [],
  messages: [],
  conflicts: [],
  currentUser: null,
  loading: false,

  setUsers: (users) => set({ users }),
  setMessages: (messages) => set({ messages }),
  setConflicts: (conflicts) => set({ conflicts }),
  setCurrentUser: (currentUser) => set({ currentUser }),

  addUser: async (userData) => {
    try {
      const payload = buildInsertPayload(userData)

      const { data, error } = await supabase
        .from('team_members')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      const newUser = mapUserFromDb(data as SupabaseTeamMember)
      set((state) => ({ users: [...state.users, newUser] }))
      message.success('团队成员添加成功')
    } catch (error: any) {
      console.error('Failed to add user:', error)
      message.error(error.message || '添加团队成员失败')
    }
  },

  updateUser: async (user) => {
    try {
      const payload = buildUpdatePayload(user)

      const { data, error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      const updatedUser = mapUserFromDb(data as SupabaseTeamMember)
      set((state) => ({
        users: state.users.map((u) => u.id === user.id ? updatedUser : u)
      }))
      message.success('团队成员更新成功')
    } catch (error: any) {
      console.error('Failed to update user:', error)
      message.error(error.message || '更新团队成员失败')
    }
  },

  deleteUser: async (id) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        users: state.users.filter((u) => u.id !== id)
      }))
      message.success('团队成员删除成功')
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      message.error(error.message || '删除团队成员失败')
    }
  },

  addMessage: async (message) => {
    // Note: TeamMessage functionality is not yet implemented in Supabase
    // For now, store messages in local state only
    set((state) => ({
      messages: [message, ...state.messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }))
  },

  loadUsers: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const users = (data as SupabaseTeamMember[] | null)?.map(mapUserFromDb) ?? []

      // Set the first user as current user for demo purposes
      // In production, this would be the logged-in user
      const currentUser = users.length > 0 ? users[0] : null

      set({ users, currentUser, loading: false })
    } catch (error: any) {
      console.error('Failed to load users:', error)
      message.error(error.message || '加载团队成员失败')
      set({ loading: false })
    }
  },

  loadMessages: async () => {
    // Note: TeamMessage functionality is not yet implemented in Supabase
    // Messages remain in local state for now
    set({ messages: [] })
  },

  loadConflicts: async () => {
    // Note: CustomerConflict functionality is not yet implemented in Supabase
    // Conflicts remain in local state for now
    set({ conflicts: [] })
  },

  checkCustomerConflicts: async (customerId, userId) => {
    // Check if other users are also following the same customer
    // Simplified for now, actual implementation would be more complex
  },

  resolveConflict: async (customerId) => {
    // Simplified conflict resolution
    set((state) => ({
      conflicts: state.conflicts.filter(c => c.customerId !== customerId)
    }))
  },

  getUnreadMessages: (userId) => {
    const { messages } = get()
    return messages.filter(msg => !msg.readBy.includes(userId))
  },

  markMessageAsRead: async (messageId, userId) => {
    const { messages, setMessages } = get()
    const message = messages.find(m => m.id === messageId)
    if (message && !message.readBy.includes(userId)) {
      const updatedMessage = {
        ...message,
        readBy: [...message.readBy, userId]
      }
      setMessages(messages.map(m => m.id === messageId ? updatedMessage : m))
    }
  }
}))