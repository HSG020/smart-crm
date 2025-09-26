import { create } from 'zustand'
import { Reminder } from '../types'
import { supabase } from '../lib/supabase'
import { message } from 'antd'

interface ReminderStore {
  reminders: Reminder[]
  loading: boolean

  setReminders: (reminders: Reminder[]) => void
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Promise<void>
  updateReminder: (reminder: Reminder) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  loadReminders: () => Promise<void>
  completeReminder: (id: string) => Promise<void>
  getTodayReminders: () => Reminder[]
  getOverdueReminders: () => Reminder[]
  getUpcomingReminders: () => Reminder[]
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  loading: false,

  setReminders: (reminders) => set({ reminders }),

  addReminder: async (reminderData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert({
          customer_id: reminderData.customerId,
          remind_date: reminderData.reminderDate,
          message: reminderData.message,
          is_completed: false,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      const newReminder: Reminder = {
        id: data.id,
        customerId: data.customer_id,
        customerName: reminderData.customerName,
        reminderDate: data.remind_date,
        message: data.message,
        type: reminderData.type,
        completed: data.is_completed,
        createdAt: data.created_at
      }

      set((state) => ({ reminders: [...state.reminders, newReminder] }))
      message.success('提醒添加成功')
    } catch (error: any) {
      console.error('Failed to add reminder:', error)
      message.error(error.message || '添加提醒失败')
    }
  },

  updateReminder: async (reminder) => {
    try {
      const { error } = await supabase
        .from('follow_up_reminders')
        .update({
          remind_date: reminder.reminderDate,
          message: reminder.message,
          is_completed: reminder.completed
        })
        .eq('id', reminder.id)

      if (error) throw error

      set((state) => ({
        reminders: state.reminders.map((r) => r.id === reminder.id ? reminder : r)
      }))
      message.success('提醒更新成功')
    } catch (error: any) {
      console.error('Failed to update reminder:', error)
      message.error(error.message || '更新提醒失败')
    }
  },

  deleteReminder: async (id) => {
    try {
      const { error } = await supabase
        .from('follow_up_reminders')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id)
      }))
      message.success('提醒删除成功')
    } catch (error: any) {
      console.error('Failed to delete reminder:', error)
      message.error(error.message || '删除提醒失败')
    }
  },

  loadReminders: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select(`
          *,
          customers!customer_id (
            name
          )
        `)
        .order('remind_date', { ascending: true })

      if (error) throw error

      const reminders: Reminder[] = (data || []).map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customerName: item.customers?.name || '未知客户',
        reminderDate: item.remind_date,
        message: item.message,
        type: 'phone' as const,
        completed: item.is_completed,
        createdAt: item.created_at
      }))

      set({ reminders, loading: false })
    } catch (error: any) {
      console.error('Failed to load reminders:', error)
      message.error(error.message || '加载提醒失败')
      set({ loading: false })
    }
  },

  completeReminder: async (id) => {
    const { reminders, updateReminder } = get()
    const reminder = reminders.find(r => r.id === id)
    if (reminder) {
      await updateReminder({ ...reminder, completed: true })
    }
  },

  getTodayReminders: () => {
    const { reminders } = get()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return reminders.filter(reminder =>
      !reminder.completed &&
      new Date(reminder.reminderDate) >= today &&
      new Date(reminder.reminderDate) < tomorrow
    )
  },

  getOverdueReminders: () => {
    const { reminders } = get()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return reminders.filter(reminder =>
      !reminder.completed &&
      new Date(reminder.reminderDate) < today
    )
  },

  getUpcomingReminders: () => {
    const { reminders } = get()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return reminders.filter(reminder =>
      !reminder.completed &&
      new Date(reminder.reminderDate) >= tomorrow
    )
  }
}))