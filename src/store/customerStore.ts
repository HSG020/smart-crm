import { create } from 'zustand'
import { Customer } from '../types'
import { supabase } from '../lib/supabase'
import { message } from 'antd'

interface CustomerStore {
  customers: Customer[]
  loading: boolean
  searchTerm: string
  selectedCustomer: Customer | null

  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCustomer: (customer: Customer) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  loadCustomers: () => Promise<void>
  setSearchTerm: (term: string) => void
  setSelectedCustomer: (customer: Customer | null) => void
  getFilteredCustomers: () => Customer[]
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  searchTerm: '',
  selectedCustomer: null,

  setCustomers: (customers) => set({ customers }),

  addCustomer: async (customerData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          user_id: user.id,
          tags: customerData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({ customers: [...state.customers, data] }))
      message.success('客户添加成功')
    } catch (error: any) {
      console.error('Failed to add customer:', error)
      message.error(error.message || '添加客户失败')
    }
  },

  updateCustomer: async (customer) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          ...customer,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id)

      if (error) throw error

      set((state) => ({
        customers: state.customers.map((c) => c.id === customer.id ? customer : c)
      }))
      message.success('客户更新成功')
    } catch (error: any) {
      console.error('Failed to update customer:', error)
      message.error(error.message || '更新客户失败')
    }
  },

  deleteCustomer: async (id) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      }))
      message.success('客户删除成功')
    } catch (error: any) {
      console.error('Failed to delete customer:', error)
      message.error(error.message || '删除客户失败')
    }
  },

  loadCustomers: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ customers: data || [], loading: false })
    } catch (error: any) {
      console.error('Failed to load customers:', error)
      message.error(error.message || '加载客户失败')
      set({ loading: false })
    }
  },

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),

  getFilteredCustomers: () => {
    const { customers, searchTerm } = get()
    if (!searchTerm) return customers
    
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
}))