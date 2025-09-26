import { create } from 'zustand'
import { Reminder } from '../types'
import { storage } from '../utils/storage'

interface ReminderStore {
  reminders: Reminder[]
  loading: boolean
  
  setReminders: (reminders: Reminder[]) => void
  addReminder: (reminder: Reminder) => Promise<void>
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

  addReminder: async (reminder) => {
    try {
      await storage.save('reminders', reminder)
      set((state) => ({ reminders: [...state.reminders, reminder] }))
    } catch (error) {
      console.error('Failed to add reminder:', error)
    }
  },

  updateReminder: async (reminder) => {
    try {
      await storage.save('reminders', reminder)
      set((state) => ({
        reminders: state.reminders.map((r) => r.id === reminder.id ? reminder : r)
      }))
    } catch (error) {
      console.error('Failed to update reminder:', error)
    }
  },

  deleteReminder: async (id) => {
    try {
      await storage.delete('reminders', id)
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete reminder:', error)
    }
  },

  loadReminders: async () => {
    set({ loading: true })
    try {
      const reminders = await storage.getAll<Reminder>('reminders')
      set({ reminders, loading: false })
    } catch (error) {
      console.error('Failed to load reminders:', error)
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
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    return reminders.filter(reminder => 
      !reminder.completed &&
      new Date(reminder.reminderDate) > today &&
      new Date(reminder.reminderDate) <= nextWeek
    ).sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
  }
}))