import { create } from 'zustand'
import { Opportunity, SalesStage } from '../types'
import { storage } from '../utils/storage'

interface OpportunityStore {
  opportunities: Opportunity[]
  stages: SalesStage[]
  loading: boolean
  
  setOpportunities: (opportunities: Opportunity[]) => void
  setStages: (stages: SalesStage[]) => void
  addOpportunity: (opportunity: Opportunity) => Promise<void>
  updateOpportunity: (opportunity: Opportunity) => Promise<void>
  deleteOpportunity: (id: string) => Promise<void>
  loadOpportunities: () => Promise<void>
  loadStages: () => Promise<void>
  initializeStages: () => Promise<void>
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

  addOpportunity: async (opportunity) => {
    try {
      await storage.save('opportunities', opportunity)
      set((state) => ({ opportunities: [...state.opportunities, opportunity] }))
    } catch (error) {
      console.error('Failed to add opportunity:', error)
    }
  },

  updateOpportunity: async (opportunity) => {
    try {
      await storage.save('opportunities', opportunity)
      set((state) => ({
        opportunities: state.opportunities.map((o) => 
          o.id === opportunity.id ? opportunity : o
        )
      }))
    } catch (error) {
      console.error('Failed to update opportunity:', error)
    }
  },

  deleteOpportunity: async (id) => {
    try {
      await storage.delete('opportunities', id)
      set((state) => ({
        opportunities: state.opportunities.filter((o) => o.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete opportunity:', error)
    }
  },

  loadOpportunities: async () => {
    set({ loading: true })
    try {
      const opportunities = await storage.getAll<Opportunity>('opportunities')
      set({ opportunities, loading: false })
    } catch (error) {
      console.error('Failed to load opportunities:', error)
      set({ loading: false })
    }
  },

  loadStages: async () => {
    try {
      const stages = await storage.getAll<SalesStage>('salesStages')
      if (stages.length === 0) {
        await get().initializeStages()
      } else {
        set({ stages: stages.sort((a, b) => a.order - b.order) })
      }
    } catch (error) {
      console.error('Failed to load stages:', error)
    }
  },

  initializeStages: async () => {
    const defaultStages: SalesStage[] = [
      { id: 'lead', name: '潜在客户', probability: 10, color: '#1890ff', order: 1 },
      { id: 'qualified', name: '已验证', probability: 25, color: '#13c2c2', order: 2 },
      { id: 'proposal', name: '方案阶段', probability: 50, color: '#faad14', order: 3 },
      { id: 'negotiation', name: '谈判阶段', probability: 75, color: '#f759ab', order: 4 },
      { id: 'closed_won', name: '成交', probability: 100, color: '#52c41a', order: 5 },
      { id: 'closed_lost', name: '失败', probability: 0, color: '#ff4d4f', order: 6 }
    ]

    try {
      for (const stage of defaultStages) {
        await storage.save('salesStages', stage)
      }
      set({ stages: defaultStages })
    } catch (error) {
      console.error('Failed to initialize stages:', error)
    }
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

// 扩展 storage 工具以支持新的存储类型
const extendedStorage = {
  ...storage,
  async initSalesStages() {
    const existingStages = await this.getAll('salesStages')
    if (existingStages.length === 0) {
      await useOpportunityStore.getState().initializeStages()
    }
  }
}

export { extendedStorage as storage }