import { create } from 'zustand'
import { User, TeamMessage, CustomerConflict } from '../types'
import { storage } from '../utils/storage'

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
  addUser: (user: User) => Promise<void>
  updateUser: (user: User) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  addMessage: (message: TeamMessage) => Promise<void>
  loadUsers: () => Promise<void>
  loadMessages: () => Promise<void>
  loadConflicts: () => Promise<void>
  initializeDefaultUsers: () => Promise<void>
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

  addUser: async (user) => {
    try {
      await storage.save('users', user)
      set((state) => ({ users: [...state.users, user] }))
    } catch (error) {
      console.error('Failed to add user:', error)
    }
  },

  updateUser: async (user) => {
    try {
      await storage.save('users', user)
      set((state) => ({
        users: state.users.map((u) => u.id === user.id ? user : u)
      }))
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  },

  deleteUser: async (id) => {
    try {
      await storage.delete('users', id)
      set((state) => ({
        users: state.users.filter((u) => u.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  },

  addMessage: async (message) => {
    try {
      await storage.save('teamMessages', message)
      set((state) => ({ 
        messages: [message, ...state.messages].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }))
    } catch (error) {
      console.error('Failed to add message:', error)
    }
  },

  loadUsers: async () => {
    set({ loading: true })
    try {
      const users = await storage.getAll<User>('users')
      if (users.length === 0) {
        await get().initializeDefaultUsers()
      } else {
        set({ users, loading: false })
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      set({ loading: false })
    }
  },

  loadMessages: async () => {
    try {
      const messages = await storage.getAll<TeamMessage>('teamMessages')
      const sortedMessages = messages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      set({ messages: sortedMessages })
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  },

  loadConflicts: async () => {
    try {
      const conflicts = await storage.getAll<CustomerConflict>('conflicts')
      set({ conflicts: conflicts.filter(c => !c.resolvedAt) })
    } catch (error) {
      console.error('Failed to load conflicts:', error)
    }
  },

  initializeDefaultUsers: async () => {
    const defaultUsers: User[] = [
      {
        id: 'user_1',
        name: '张经理',
        email: 'zhang@company.com',
        role: 'manager',
        department: '销售部',
        avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=1',
        createdAt: new Date()
      },
      {
        id: 'user_2',
        name: '李销售',
        email: 'li@company.com',
        role: 'sales',
        department: '销售部',
        avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=2',
        createdAt: new Date()
      },
      {
        id: 'user_3',
        name: '王销售',
        email: 'wang@company.com',
        role: 'sales',
        department: '销售部',
        avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=3',
        createdAt: new Date()
      },
      {
        id: 'user_admin',
        name: '系统管理员',
        email: 'admin@company.com',
        role: 'admin',
        department: '技术部',
        avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=4',
        createdAt: new Date()
      }
    ]

    try {
      for (const user of defaultUsers) {
        await storage.save('users', user)
      }
      set({ users: defaultUsers, currentUser: defaultUsers[0], loading: false })
    } catch (error) {
      console.error('Failed to initialize users:', error)
      set({ loading: false })
    }
  },

  checkCustomerConflicts: async (customerId, userId) => {
    // 检查是否有其他用户也在跟进同一个客户
    // 这里简化处理，实际应用中可能需要更复杂的逻辑
  },

  resolveConflict: async (customerId) => {
    try {
      const { conflicts } = get()
      const conflict = conflicts.find(c => c.customerId === customerId)
      if (conflict) {
        const resolvedConflict = { ...conflict, resolvedAt: new Date() }
        await storage.save('conflicts', resolvedConflict)
        set((state) => ({
          conflicts: state.conflicts.filter(c => c.customerId !== customerId)
        }))
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    }
  },

  getUnreadMessages: (userId) => {
    const { messages } = get()
    return messages.filter(msg => !msg.readBy.includes(userId))
  },

  markMessageAsRead: async (messageId, userId) => {
    try {
      const { messages, setMessages } = get()
      const message = messages.find(m => m.id === messageId)
      if (message && !message.readBy.includes(userId)) {
        const updatedMessage = {
          ...message,
          readBy: [...message.readBy, userId]
        }
        await storage.save('teamMessages', updatedMessage)
        setMessages(messages.map(m => m.id === messageId ? updatedMessage : m))
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }
}))