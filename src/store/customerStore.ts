import { create } from 'zustand'
import { message } from 'antd'
import { Customer } from '../types'
import { supabase, SupabaseCustomer } from '../lib/supabase'

type NewCustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>

const mapCustomerFromDb = (record: SupabaseCustomer): Customer => ({
  id: record.id,
  name: record.name,
  company: record.company ?? undefined,
  position: record.position ?? undefined,
  industry: record.industry ?? undefined,
  phone: record.phone ?? undefined,
  email: record.email ?? undefined,
  importance: record.importance,
  status: record.status,
  tags: record.tags ?? [],
  lastContactDate: record.last_contact ?? undefined,
  nextFollowUpDate: record.next_follow_date ?? undefined,
  birthday: record.birthday ?? undefined,
  address: record.address ?? undefined,
  notes: record.notes ?? undefined,
  source: record.source ?? undefined,
  createdAt: record.created_at,
  updatedAt: record.updated_at
})

const buildInsertPayload = (customer: NewCustomerInput, userId: string): Partial<SupabaseCustomer> => ({
  name: customer.name,
  company: customer.company ?? null,
  position: customer.position ?? null,
  industry: customer.industry ?? null,
  phone: customer.phone ?? null,
  email: customer.email ?? null,
  address: customer.address ?? null,
  tags: customer.tags ?? [],
  importance: customer.importance,
  status: customer.status,
  source: customer.source ?? null,
  notes: customer.notes ?? null,
  last_contact: customer.lastContactDate ?? null,
  next_follow_date: customer.nextFollowUpDate ?? null,
  birthday: customer.birthday ?? null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: userId
})

const buildUpdatePayload = (customer: Customer): Partial<SupabaseCustomer> => ({
  name: customer.name,
  company: customer.company ?? null,
  position: customer.position ?? null,
  industry: customer.industry ?? null,
  phone: customer.phone ?? null,
  email: customer.email ?? null,
  address: customer.address ?? null,
  tags: customer.tags ?? [],
  importance: customer.importance,
  status: customer.status,
  source: customer.source ?? null,
  notes: customer.notes ?? null,
  last_contact: customer.lastContactDate ?? null,
  next_follow_date: customer.nextFollowUpDate ?? null,
  birthday: customer.birthday ?? null,
  updated_at: new Date().toISOString()
})

interface CustomerStore {
  customers: Customer[]
  loading: boolean
  searchTerm: string
  selectedCustomer: Customer | null

  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: NewCustomerInput, options?: { silent?: boolean }) => Promise<void>
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

  addCustomer: async (customerData, options = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const payload = buildInsertPayload(customerData, user.id)

      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      const mapped = mapCustomerFromDb(data as SupabaseCustomer)
      set((state) => ({ customers: [mapped, ...state.customers] }))

      if (!options.silent) {
        message.success('客户添加成功')
      }
    } catch (error: any) {
      console.error('Failed to add customer:', error)
      message.error(error.message || '添加客户失败')
    }
  },

  updateCustomer: async (customer) => {
    try {
      const payload = buildUpdatePayload(customer)

      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', customer.id)
        .select()
        .single()

      if (error) throw error

      const mapped = mapCustomerFromDb(data as SupabaseCustomer)

      set((state) => ({
        customers: state.customers.map((c) => c.id === customer.id ? mapped : c)
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

      const mapped = (data as SupabaseCustomer[] | null)?.map(mapCustomerFromDb) ?? []
      set({ customers: mapped, loading: false })
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
    
    const lower = searchTerm.toLowerCase()

    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(lower) ||
      (customer.company ? customer.company.toLowerCase().includes(lower) : false) ||
      (customer.phone ? customer.phone.includes(searchTerm) : false) ||
      (customer.email ? customer.email.toLowerCase().includes(lower) : false)
    )
  }
}))
