import { create } from 'zustand'
import { message } from 'antd'
import { Communication } from '../types'
import { supabase, SupabaseCommunicationHistory } from '../lib/supabase'

type NewCommunicationInput = Omit<Communication, 'id'>

const mapCommunicationFromDb = (record: SupabaseCommunicationHistory): Communication => ({
  id: record.id,
  customerId: record.customer_id,
  customerName: record.customers?.name ?? undefined,
  type: record.type as Communication['type'],
  content: record.content,
  result: record.result ?? '',
  nextAction: record.next_step ?? undefined,
  attachments: record.attachments ?? undefined,
  createdAt: record.created_at
})

const buildInsertPayload = (data: NewCommunicationInput, userId: string) => ({
  customer_id: data.customerId,
  type: data.type,
  content: data.content,
  result: data.result ?? null,
  next_step: data.nextAction ?? null,
  attachments: data.attachments ?? [],
  user_id: userId,
  created_at: data.createdAt ?? new Date().toISOString()
})

const buildUpdatePayload = (data: Communication) => ({
  type: data.type,
  content: data.content,
  result: data.result ?? null,
  next_step: data.nextAction ?? null,
  attachments: data.attachments ?? []
})

interface CommunicationStore {
  communications: Communication[]
  loading: boolean

  setCommunications: (communications: Communication[]) => void
  addCommunication: (communication: NewCommunicationInput) => Promise<void>
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

  addCommunication: async (communicationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const payload = buildInsertPayload(communicationData, user.id)

      const { data, error } = await supabase
        .from('communication_history')
        .insert(payload)
        .select(`*, customers(name)`)
        .single()

      if (error) throw error

      const newCommunication = mapCommunicationFromDb(data as SupabaseCommunicationHistory)

      set((state) => ({
        communications: [newCommunication, ...state.communications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }))
      message.success('沟通记录添加成功')
    } catch (error: any) {
      console.error('Failed to add communication:', error)
      message.error(error.message || '添加沟通记录失败')
    }
  },

  updateCommunication: async (communication) => {
    try {
      const payload = buildUpdatePayload(communication)

      const { data, error } = await supabase
        .from('communication_history')
        .update(payload)
        .eq('id', communication.id)
        .select(`*, customers(name)`)
        .single()

      if (error) throw error

      const mapped = mapCommunicationFromDb(data as SupabaseCommunicationHistory)

      set((state) => ({
        communications: state.communications.map((c) =>
          c.id === communication.id ? mapped : c
        )
      }))
      message.success('沟通记录更新成功')
    } catch (error: any) {
      console.error('Failed to update communication:', error)
      message.error(error.message || '更新沟通记录失败')
    }
  },

  deleteCommunication: async (id) => {
    try {
      const { error } = await supabase
        .from('communication_history')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        communications: state.communications.filter((c) => c.id !== id)
      }))
      message.success('沟通记录删除成功')
    } catch (error: any) {
      console.error('Failed to delete communication:', error)
      message.error(error.message || '删除沟通记录失败')
    }
  },

  loadCommunications: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .select(`
          *,
          customers!customer_id (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const communications: Communication[] = (data as SupabaseCommunicationHistory[] | null)?.map(mapCommunicationFromDb) ?? []

      set({ communications, loading: false })
    } catch (error: any) {
      console.error('Failed to load communications:', error)
      message.error(error.message || '加载沟通记录失败')
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
