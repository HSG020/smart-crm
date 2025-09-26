import { create } from 'zustand'
import { Communication } from '../types'
import { storage } from '../utils/storage'

interface CommunicationStore {
  communications: Communication[]
  loading: boolean
  
  setCommunications: (communications: Communication[]) => void
  addCommunication: (communication: Communication) => Promise<void>
  updateCommunication: (communication: Communication) => Promise<void>
  deleteCommunication: (id: string) => Promise<void>
  loadCommunications: () => Promise<void>
  getCustomerCommunications: (customerId: string) => Communication[]
  getRecentCommunications: (days: number) => Communication[]
}

export const useCommunicationStore = create<CommunicationStore>((set, get) => ({
  communications: [],
  loading: false,

  setCommunications: (communications) => set({ communications }),

  addCommunication: async (communication) => {
    try {
      await storage.save('communications', communication)
      set((state) => ({ 
        communications: [communication, ...state.communications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }))
    } catch (error) {
      console.error('Failed to add communication:', error)
    }
  },

  updateCommunication: async (communication) => {
    try {
      await storage.save('communications', communication)
      set((state) => ({
        communications: state.communications.map((c) => 
          c.id === communication.id ? communication : c
        )
      }))
    } catch (error) {
      console.error('Failed to update communication:', error)
    }
  },

  deleteCommunication: async (id) => {
    try {
      await storage.delete('communications', id)
      set((state) => ({
        communications: state.communications.filter((c) => c.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete communication:', error)
    }
  },

  loadCommunications: async () => {
    set({ loading: true })
    try {
      const communications = await storage.getAll<Communication>('communications')
      const sortedCommunications = communications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      set({ communications: sortedCommunications, loading: false })
    } catch (error) {
      console.error('Failed to load communications:', error)
      set({ loading: false })
    }
  },

  getCustomerCommunications: (customerId) => {
    const { communications } = get()
    return communications
      .filter(comm => comm.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getRecentCommunications: (days) => {
    const { communications } = get()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return communications
      .filter(comm => new Date(comm.createdAt) >= cutoffDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}))