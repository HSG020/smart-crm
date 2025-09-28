import { create } from 'zustand'
import { message } from 'antd'
import { Reminder } from '../types'
import { supabase, SupabaseFollowUpReminder } from '../lib/supabase'

type NewReminderInput = Omit<Reminder, 'id' | 'createdAt'> & { completed?: boolean }

const mapReminderFromDb = (record: SupabaseFollowUpReminder): Reminder => ({
  id: record.id,
  customerId: record.customer_id,
  customerName: record.customers?.name ?? undefined,
  title: record.title ?? '跟进提醒',
  description: record.message ?? '',
  type: record.type,
  reminderDate: record.remind_date,
  completed: record.is_completed,
  createdAt: record.created_at
})

const buildInsertPayload = (data: NewReminderInput, userId: string) => ({
  customer_id: data.customerId,
  remind_date: data.reminderDate,
  title: data.title,
  message: data.description,
  type: data.type,
  is_completed: data.completed ?? false,
  user_id: userId,
  created_at: data.createdAt ?? new Date().toISOString()
})

const buildUpdatePayload = (data: Reminder) => ({
  remind_date: data.reminderDate,
  title: data.title,
  message: data.description,
  type: data.type,
  is_completed: data.completed
})

interface ReminderStore {
  reminders: Reminder[]
  loading: boolean

  setReminders: (reminders: Reminder[]) => void
  addReminder: (reminder: NewReminderInput) => Promise<void>
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

      const payload = buildInsertPayload(reminderData, user.id)

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert(payload)
        .select(`*, customers(name)`)
        .single()

      if (error) throw error

      const newReminder = mapReminderFromDb(data as SupabaseFollowUpReminder)

      set((state) => ({ reminders: [newReminder, ...state.reminders] }))
      message.success('提醒添加成功')
    } catch (error: any) {
      console.error('Failed to add reminder:', error)
      message.error(error.message || '添加提醒失败')
    }
  },

  updateReminder: async (reminder) => {
    try {
      const payload = buildUpdatePayload(reminder)

      const { data, error } = await supabase
        .from('follow_up_reminders')
        .update(payload)
        .eq('id', reminder.id)
        .select(`*, customers(name)`)
        .single()

      if (error) throw error

      const mapped = mapReminderFromDb(data as SupabaseFollowUpReminder)

      set((state) => ({
        reminders: state.reminders.map((r) => r.id === reminder.id ? mapped : r)
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
          customers (
            name
          )
        `)
        .order('remind_date', { ascending: true })

      if (error) throw error

      const reminders: Reminder[] = (data as SupabaseFollowUpReminder[] | null)?.map(mapReminderFromDb) ?? []

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
