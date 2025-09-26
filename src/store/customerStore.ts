import { create } from 'zustand'
import { Customer } from '../types'
import { storage } from '../utils/storage'

interface CustomerStore {
  customers: Customer[]
  loading: boolean
  searchTerm: string
  selectedCustomer: Customer | null
  
  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Customer) => Promise<void>
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

  addCustomer: async (customer) => {
    try {
      await storage.save('customers', customer)
      set((state) => ({ customers: [...state.customers, customer] }))
    } catch (error) {
      console.error('Failed to add customer:', error)
    }
  },

  updateCustomer: async (customer) => {
    try {
      await storage.save('customers', customer)
      set((state) => ({
        customers: state.customers.map((c) => c.id === customer.id ? customer : c)
      }))
    } catch (error) {
      console.error('Failed to update customer:', error)
    }
  },

  deleteCustomer: async (id) => {
    try {
      await storage.delete('customers', id)
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  },

  loadCustomers: async () => {
    set({ loading: true })
    try {
      const customers = await storage.getAll<Customer>('customers')
      set({ customers, loading: false })
    } catch (error) {
      console.error('Failed to load customers:', error)
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