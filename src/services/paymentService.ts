/**
 * 回款管理服务
 */

import { supabase } from '@/lib/supabase'
import type {
  PaymentPlan,
  PaymentRecord,
  ReminderRule,
  ReminderLog,
  PaymentStatistics,
  PaymentFilters,
  PaymentStatus
} from '@/types/payment'

class PaymentService {
  // ============= 回款计划管理 =============

  /**
   * 获取回款计划列表
   */
  async getPaymentPlans(filters?: PaymentFilters) {
    try {
      let query = supabase
        .from('payment_plans')
        .select(`
          *,
          opportunities (
            id,
            name,
            customer_name,
            amount
          ),
          payment_records (
            id,
            amount,
            payment_date
          )
        `)

      // 应用过滤条件
      if (filters) {
        if (filters.status?.length) {
          query = query.in('status', filters.status)
        }
        if (filters.customer_id) {
          query = query.eq('customer_id', filters.customer_id)
        }
        if (filters.owner_id) {
          query = query.eq('owner_id', filters.owner_id)
        }
        if (filters.due_date_from) {
          query = query.gte('due_date', filters.due_date_from)
        }
        if (filters.due_date_to) {
          query = query.lte('due_date', filters.due_date_to)
        }
        if (filters.amount_min) {
          query = query.gte('total_amount', filters.amount_min)
        }
        if (filters.amount_max) {
          query = query.lte('total_amount', filters.amount_max)
        }
        if (filters.overdue_only) {
          query = query.eq('status', 'overdue')
        }
        if (filters.search) {
          query = query.or(`customer_name.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%`)
        }
      }

      const { data, error } = await query.order('due_date', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching payment plans:', error)
      return { data: null, error }
    }
  }

  /**
   * 获取单个回款计划详情
   */
  async getPaymentPlan(id: string) {
    try {
      const { data, error } = await supabase
        .from('payment_plans')
        .select(`
          *,
          opportunities (
            id,
            name,
            customer_name,
            amount,
            stage
          ),
          payment_records (
            *
          ),
          reminder_rules (
            *
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching payment plan:', error)
      return { data: null, error }
    }
  }

  /**
   * 创建回款计划
   */
  async createPaymentPlan(plan: Partial<PaymentPlan>) {
    try {
      // 计算剩余应收金额
      const remaining_amount = (plan.total_amount || 0) - (plan.received_amount || 0)

      // 自动设置状态
      let status: PaymentStatus = 'pending'
      if (remaining_amount <= 0) {
        status = 'completed'
      } else if (plan.received_amount && plan.received_amount > 0) {
        status = 'partial'
      } else if (plan.due_date && new Date(plan.due_date) < new Date()) {
        status = 'overdue'
      }

      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('payment_plans')
        .insert({
          ...plan,
          remaining_amount,
          status,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating payment plan:', error)
      return { data: null, error }
    }
  }

  /**
   * 更新回款计划
   */
  async updatePaymentPlan(id: string, updates: Partial<PaymentPlan>) {
    try {
      // 重新计算剩余金额和状态
      if (updates.total_amount !== undefined || updates.received_amount !== undefined) {
        const { data: currentPlan } = await this.getPaymentPlan(id)
        if (currentPlan) {
          const total = updates.total_amount ?? currentPlan.total_amount
          const received = updates.received_amount ?? currentPlan.received_amount
          updates.remaining_amount = total - received

          // 自动更新状态
          if (updates.remaining_amount <= 0) {
            updates.status = 'completed'
            updates.actual_date = new Date().toISOString()
          } else if (received > 0) {
            updates.status = 'partial'
          }
        }
      }

      const { data, error } = await supabase
        .from('payment_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating payment plan:', error)
      return { data: null, error }
    }
  }

  /**
   * 删除回款计划
   */
  async deletePaymentPlan(id: string) {
    try {
      const { error } = await supabase
        .from('payment_plans')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting payment plan:', error)
      return { error }
    }
  }

  // ============= 回款记录管理 =============

  /**
   * 添加回款记录
   */
  async addPaymentRecord(record: Partial<PaymentRecord>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 插入回款记录
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          ...record,
          created_by: user?.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // 更新对应的回款计划
      if (record.payment_plan_id) {
        const { data: plan } = await this.getPaymentPlan(record.payment_plan_id)
        if (plan) {
          const newReceivedAmount = (plan.received_amount || 0) + (record.amount || 0)
          await this.updatePaymentPlan(record.payment_plan_id, {
            received_amount: newReceivedAmount
          })
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error adding payment record:', error)
      return { data: null, error }
    }
  }

  /**
   * 删除回款记录
   */
  async deletePaymentRecord(id: string) {
    try {
      // 先获取记录信息
      const { data: record } = await supabase
        .from('payment_records')
        .select('*')
        .eq('id', id)
        .single()

      if (!record) throw new Error('Payment record not found')

      // 删除记录
      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 更新回款计划的已收金额
      if (record.payment_plan_id) {
        const { data: plan } = await this.getPaymentPlan(record.payment_plan_id)
        if (plan) {
          const newReceivedAmount = Math.max(0, (plan.received_amount || 0) - (record.amount || 0))
          await this.updatePaymentPlan(record.payment_plan_id, {
            received_amount: newReceivedAmount
          })
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Error deleting payment record:', error)
      return { error }
    }
  }

  // ============= 提醒规则管理 =============

  /**
   * 创建提醒规则
   */
  async createReminderRule(rule: Partial<ReminderRule>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 计算下次触发时间
      let next_trigger_at = null
      if (rule.enabled && rule.payment_plan_id && rule.trigger_days_before !== undefined) {
        const { data: plan } = await this.getPaymentPlan(rule.payment_plan_id)
        if (plan?.due_date) {
          const dueDate = new Date(plan.due_date)
          const triggerDate = new Date(dueDate)
          triggerDate.setDate(triggerDate.getDate() - rule.trigger_days_before)
          next_trigger_at = triggerDate.toISOString()
        }
      }

      const { data, error } = await supabase
        .from('reminder_rules')
        .insert({
          ...rule,
          next_trigger_at,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating reminder rule:', error)
      return { data: null, error }
    }
  }

  /**
   * 更新提醒规则
   */
  async updateReminderRule(id: string, updates: Partial<ReminderRule>) {
    try {
      const { data, error } = await supabase
        .from('reminder_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating reminder rule:', error)
      return { data: null, error }
    }
  }

  /**
   * 删除提醒规则
   */
  async deleteReminderRule(id: string) {
    try {
      const { error } = await supabase
        .from('reminder_rules')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting reminder rule:', error)
      return { error }
    }
  }

  // ============= 统计分析 =============

  /**
   * 获取回款统计
   */
  async getPaymentStatistics(filters?: PaymentFilters): Promise<PaymentStatistics> {
    try {
      const { data: plans } = await this.getPaymentPlans(filters)

      if (!plans) {
        throw new Error('Failed to fetch payment plans')
      }

      const now = new Date()

      // 基础统计
      let total_receivable = 0
      let total_received = 0
      let total_overdue = 0
      let overdue_count = 0
      let total_days_overdue = 0

      const statusCount = {
        pending: { count: 0, amount: 0 },
        partial: { count: 0, amount: 0 },
        completed: { count: 0, amount: 0 },
        overdue: { count: 0, amount: 0 }
      }

      const monthlyData: { [key: string]: { planned: number; actual: number } } = {}
      const customerData: { [key: string]: any } = {}

      plans.forEach(plan => {
        total_receivable += plan.total_amount || 0
        total_received += plan.received_amount || 0

        // 状态统计
        if (plan.status in statusCount) {
          statusCount[plan.status as keyof typeof statusCount].count++
          statusCount[plan.status as keyof typeof statusCount].amount += plan.remaining_amount || 0
        }

        // 逾期统计
        if (plan.status === 'overdue') {
          total_overdue += plan.remaining_amount || 0
          overdue_count++

          const dueDate = new Date(plan.due_date)
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          total_days_overdue += daysOverdue
        }

        // 月度统计
        const monthKey = plan.due_date.substring(0, 7) // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { planned: 0, actual: 0 }
        }
        monthlyData[monthKey].planned += plan.total_amount || 0
        monthlyData[monthKey].actual += plan.received_amount || 0

        // 客户统计
        const customerId = plan.customer_id
        if (!customerData[customerId]) {
          customerData[customerId] = {
            customer_id: customerId,
            customer_name: plan.customer_name || '未知客户',
            total_amount: 0,
            received_amount: 0,
            overdue_amount: 0
          }
        }
        customerData[customerId].total_amount += plan.total_amount || 0
        customerData[customerId].received_amount += plan.received_amount || 0
        if (plan.status === 'overdue') {
          customerData[customerId].overdue_amount += plan.remaining_amount || 0
        }
      })

      // 计算回款率
      const collection_rate = total_receivable > 0
        ? (total_received / total_receivable) * 100
        : 0

      // 计算平均逾期天数
      const average_days_overdue = overdue_count > 0
        ? total_days_overdue / overdue_count
        : 0

      // 转换月度数据
      const by_month = Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month,
          planned: data.planned,
          actual: data.actual,
          rate: data.planned > 0 ? (data.actual / data.planned) * 100 : 0
        }))

      // 转换客户数据
      const by_customer = Object.values(customerData)
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 10) // 取前10个客户

      return {
        total_receivable,
        total_received,
        total_overdue,
        overdue_count,
        collection_rate,
        average_days_overdue,
        by_status: statusCount,
        by_month,
        by_customer
      }
    } catch (error) {
      console.error('Error getting payment statistics:', error)
      // 返回空统计数据
      return {
        total_receivable: 0,
        total_received: 0,
        total_overdue: 0,
        overdue_count: 0,
        collection_rate: 0,
        average_days_overdue: 0,
        by_status: {
          pending: { count: 0, amount: 0 },
          partial: { count: 0, amount: 0 },
          completed: { count: 0, amount: 0 },
          overdue: { count: 0, amount: 0 }
        },
        by_month: [],
        by_customer: []
      }
    }
  }

  /**
   * 检查并更新逾期状态
   */
  async checkAndUpdateOverdueStatus() {
    try {
      const now = new Date().toISOString()

      // 查找应该标记为逾期的计划
      const { data: plans } = await supabase
        .from('payment_plans')
        .select('id')
        .in('status', ['pending', 'partial'])
        .lt('due_date', now)

      if (plans && plans.length > 0) {
        const planIds = plans.map(p => p.id)

        // 批量更新为逾期状态
        await supabase
          .from('payment_plans')
          .update({
            status: 'overdue',
            updated_at: now
          })
          .in('id', planIds)

        console.log(`Updated ${planIds.length} payment plans to overdue status`)
      }

      return { error: null }
    } catch (error) {
      console.error('Error checking overdue status:', error)
      return { error }
    }
  }
}

// 导出单例
export const paymentService = new PaymentService()