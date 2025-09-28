import { create } from 'zustand'
import { message } from 'antd'
import { Opportunity, SalesStage } from '../types'
import { supabase } from '../lib/supabase'

// Supabase type definitions for sales_opportunities
interface SupabaseSalesOpportunity {
  id: string
  customer_id: string
  opportunity_name: string
  expected_amount: number | null
  probability: number | null
  expected_close_date: string | null
  stage: string | null
  notes: string | null
  created_at: string
  updated_at: string
  user_id: string
  customers?: {
    name: string
  }
}

type NewOpportunityInput = Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>

const mapOpportunityFromDb = (record: SupabaseSalesOpportunity): Opportunity => ({
  id: record.id,
  customerId: record.customer_id,
  customerName: record.customers?.name,
  title: record.opportunity_name,
  value: record.expected_amount ?? 0,
  probability: record.probability ?? 0,
  expectedCloseDate: record.expected_close_date ?? undefined,
  stage: record.stage ?? 'lead',
  notes: record.notes ?? undefined,
  createdAt: new Date(record.created_at),
  updatedAt: new Date(record.updated_at)
})

const buildInsertPayload = (opp: NewOpportunityInput, userId: string) => ({
  customer_id: opp.customerId,
  opportunity_name: opp.title,
  expected_amount: opp.value,
  probability: opp.probability,
  expected_close_date: opp.expectedCloseDate ?? null,
  stage: opp.stage,
  notes: opp.notes ?? null,
  user_id: userId
})

const buildUpdatePayload = (opp: Opportunity) => ({
  opportunity_name: opp.title,
  expected_amount: opp.value,
  probability: opp.probability,
  expected_close_date: opp.expectedCloseDate ?? null,
  stage: opp.stage,
  notes: opp.notes ?? null,
  updated_at: new Date().toISOString()
})

interface OpportunityStore {
  opportunities: Opportunity[]
  stages: SalesStage[]
  loading: boolean

  setOpportunities: (opportunities: Opportunity[]) => void
  setStages: (stages: SalesStage[]) => void
  addOpportunity: (opportunity: NewOpportunityInput) => Promise<void>
  updateOpportunity: (opportunity: Opportunity) => Promise<void>
  deleteOpportunity: (id: string) => Promise<void>
  loadOpportunities: () => Promise<void>
  loadStages: () => Promise<void>
  initializeStages: () => void
  moveOpportunityToStage: (opportunityId: string, stageId: string) => Promise<void>
  getOpportunitiesByStage: (stageId: string) => Opportunity[]
  getStageStats: () => { [stageId: string]: { count: number; totalValue: number } }
  getTotalPipelineValue: () => number
  getWeightedPipelineValue: () => number
}

export const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: [],
  stages: [],
  loading: false,

  setOpportunities: (opportunities) => set({ opportunities }),
  setStages: (stages) => set({ stages }),

  addOpportunity: async (opportunityData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const payload = buildInsertPayload(opportunityData, user.id)

      const { data, error } = await supabase
        .from('sales_opportunities')
        .insert(payload)
        .select(`*, customers(name)`)
        .single()

      if (error) throw error

      const newOpportunity = mapOpportunityFromDb(data as SupabaseSalesOpportunity)
      set((state) => ({ opportunities: [...state.opportunities, newOpportunity] }))
      message.success('销售机会添加成功')
    } catch (error: any) {
      console.error('Failed to add opportunity:', error)
      message.error(error.message || '添加销售机会失败')
    }
  },

  updateOpportunity: async (opportunity) => {
    try {
      const payload = buildUpdatePayload(opportunity)

      const { data, error } = await supabase
        .from('sales_opportunities')
        .update(payload)
        .eq('id', opportunity.id)
        .select(`*, customers(name)`)
        .single()

      if (error) throw error

      const updatedOpportunity = mapOpportunityFromDb(data as SupabaseSalesOpportunity)
      set((state) => ({
        opportunities: state.opportunities.map((o) =>
          o.id === opportunity.id ? updatedOpportunity : o
        )
      }))
      message.success('销售机会更新成功')
    } catch (error: any) {
      console.error('Failed to update opportunity:', error)
      message.error(error.message || '更新销售机会失败')
    }
  },

  deleteOpportunity: async (id) => {
    try {
      const { error } = await supabase
        .from('sales_opportunities')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        opportunities: state.opportunities.filter((o) => o.id !== id)
      }))
      message.success('销售机会删除成功')
    } catch (error: any) {
      console.error('Failed to delete opportunity:', error)
      message.error(error.message || '删除销售机会失败')
    }
  },

  loadOpportunities: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('sales_opportunities')
        .select(`
          *,
          customers (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const opportunities = (data as SupabaseSalesOpportunity[] | null)?.map(mapOpportunityFromDb) ?? []
      set({ opportunities, loading: false })
    } catch (error: any) {
      console.error('Failed to load opportunities:', error)
      message.error(error.message || '加载销售机会失败')
      set({ loading: false })
    }
  },

  loadStages: async () => {
    // Initialize default stages in memory (not persisted to DB yet)
    get().initializeStages()
  },

  initializeStages: () => {
    const defaultStages: SalesStage[] = [
      { id: 'lead', name: '潜在客户', probability: 10, color: '#1890ff', order: 1 },
      { id: 'qualified', name: '已验证', probability: 25, color: '#13c2c2', order: 2 },
      { id: 'proposal', name: '方案阶段', probability: 50, color: '#faad14', order: 3 },
      { id: 'negotiation', name: '谈判阶段', probability: 75, color: '#f759ab', order: 4 },
      { id: 'closed_won', name: '成交', probability: 100, color: '#52c41a', order: 5 },
      { id: 'closed_lost', name: '失败', probability: 0, color: '#ff4d4f', order: 6 }
    ]
    set({ stages: defaultStages })
  },

  moveOpportunityToStage: async (opportunityId, stageId) => {
    const { opportunities, stages, updateOpportunity } = get()
    const opportunity = opportunities.find(o => o.id === opportunityId)
    const stage = stages.find(s => s.id === stageId)

    if (opportunity && stage) {
      const updatedOpportunity = {
        ...opportunity,
        stage: stageId,
        probability: stage.probability,
        updatedAt: new Date()
      }
      await updateOpportunity(updatedOpportunity)
    }
  },

  getOpportunitiesByStage: (stageId) => {
    const { opportunities } = get()
    return opportunities.filter(o => o.stage === stageId)
  },

  getStageStats: () => {
    const { opportunities } = get()
    const stats: { [stageId: string]: { count: number; totalValue: number } } = {}

    opportunities.forEach(opp => {
      if (!stats[opp.stage]) {
        stats[opp.stage] = { count: 0, totalValue: 0 }
      }
      stats[opp.stage].count++
      stats[opp.stage].totalValue += opp.value
    })

    return stats
  },

  getTotalPipelineValue: () => {
    const { opportunities } = get()
    return opportunities
      .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
      .reduce((total, opp) => total + opp.value, 0)
  },

  getWeightedPipelineValue: () => {
    const { opportunities } = get()
    return opportunities
      .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
      .reduce((total, opp) => total + (opp.value * opp.probability / 100), 0)
  }
}))