import { create } from 'zustand'
import { Communication } from '../types'
import { supabase } from '../lib/supabase'
import { message } from 'antd'

interface CommunicationStore {
  communications: Communication[]
  loading: boolean

  setCommunications: (communications: Communication[]) => void
  addCommunication: (communication: Omit<Communication, 'id' | 'createdAt'>) => Promise<void>
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

      const { data, error } = await supabase
        .from('communication_history')
        .insert({
          customer_id: communicationData.customerId,
          type: communicationData.type,
          content: communicationData.content,
          result: communicationData.result,
          next_step: communicationData.nextStep,
          attachments: communicationData.attachments || [],
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      const newCommunication: Communication = {
        id: data.id,
        customerId: data.customer_id,
        customerName: communicationData.customerName,
        type: data.type,
        content: data.content,
        result: data.result,
        nextStep: data.next_step,
        attachments: data.attachments,
        createdAt: data.created_at
      }

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
      const { error } = await supabase
        .from('communication_history')
        .update({
          type: communication.type,
          content: communication.content,
          result: communication.result,
          next_step: communication.nextStep,
          attachments: communication.attachments
        })
        .eq('id', communication.id)

      if (error) throw error

      set((state) => ({
        communications: state.communications.map((c) =>
          c.id === communication.id ? communication : c
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

      const communications: Communication[] = (data || []).map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customerName: item.customers?.name || '未知客户',
        type: item.type,
        content: item.content,
        result: item.result,
        nextStep: item.next_step,
        attachments: item.attachments,
        createdAt: item.created_at
      }))

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