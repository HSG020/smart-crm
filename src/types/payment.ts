/**
 * 回款管理相关类型定义
 */

// 回款状态
export type PaymentStatus =
  | 'pending'      // 待回款
  | 'partial'      // 部分回款
  | 'completed'    // 已回款
  | 'overdue'      // 逾期
  | 'cancelled'    // 已取消

// 提醒频率
export type ReminderFrequency =
  | 'once'         // 一次
  | 'daily'        // 每天
  | 'weekly'       // 每周
  | 'monthly'      // 每月
  | 'custom'       // 自定义

// 提醒渠道
export type ReminderChannel =
  | 'system'       // 系统内提醒
  | 'email'        // 邮件
  | 'sms'          // 短信
  | 'wechat'       // 微信

// 回款计划
export interface PaymentPlan {
  id: string
  opportunity_id: string          // 关联的销售机会
  customer_id: string              // 客户ID
  customer_name?: string           // 客户名称
  contract_number?: string         // 合同编号
  total_amount: number             // 应收总额
  received_amount: number          // 已收金额
  remaining_amount: number         // 剩余应收
  currency: string                 // 货币单位
  due_date: string                 // 应收日期
  actual_date?: string             // 实际回款日期
  status: PaymentStatus            // 回款状态
  installment: number              // 期数（第几期）
  total_installments: number       // 总期数
  notes?: string                   // 备注
  created_at: string
  updated_at: string
  created_by: string               // 创建人
  owner_id: string                 // 负责人
}

// 回款记录
export interface PaymentRecord {
  id: string
  payment_plan_id: string          // 关联的回款计划
  amount: number                   // 回款金额
  payment_date: string             // 回款日期
  payment_method?: string          // 回款方式（转账/现金/支票等）
  transaction_number?: string      // 交易号
  receipt_number?: string          // 收据号
  notes?: string                   // 备注
  attachments?: string[]           // 附件URL列表
  verified: boolean                // 是否已核实
  verified_by?: string             // 核实人
  verified_at?: string             // 核实时间
  created_at: string
  created_by: string
}

// 提醒规则
export interface ReminderRule {
  id: string
  payment_plan_id: string          // 关联的回款计划
  name: string                     // 规则名称
  enabled: boolean                 // 是否启用
  trigger_days_before: number      // 提前几天提醒
  frequency: ReminderFrequency     // 提醒频率
  channels: ReminderChannel[]      // 提醒渠道
  recipients: string[]             // 接收人列表（用户ID）
  cc_recipients?: string[]         // 抄送人列表
  message_template?: string        // 消息模板
  last_triggered_at?: string      // 上次触发时间
  next_trigger_at?: string        // 下次触发时间
  created_at: string
  updated_at: string
  created_by: string
}

// 提醒记录
export interface ReminderLog {
  id: string
  payment_plan_id: string
  reminder_rule_id: string
  channel: ReminderChannel
  recipients: string[]
  message: string
  status: 'sent' | 'failed' | 'pending'
  error_message?: string
  sent_at?: string
  created_at: string
}

// 回款统计
export interface PaymentStatistics {
  total_receivable: number         // 应收总额
  total_received: number           // 已收总额
  total_overdue: number           // 逾期金额
  overdue_count: number           // 逾期笔数
  collection_rate: number         // 回款率
  average_days_overdue: number    // 平均逾期天数
  by_status: {
    pending: { count: number; amount: number }
    partial: { count: number; amount: number }
    completed: { count: number; amount: number }
    overdue: { count: number; amount: number }
  }
  by_month: Array<{
    month: string
    planned: number
    actual: number
    rate: number
  }>
  by_customer: Array<{
    customer_id: string
    customer_name: string
    total_amount: number
    received_amount: number
    overdue_amount: number
  }>
}

// 回款过滤条件
export interface PaymentFilters {
  status?: PaymentStatus[]
  customer_id?: string
  owner_id?: string
  due_date_from?: string
  due_date_to?: string
  amount_min?: number
  amount_max?: number
  overdue_only?: boolean
  search?: string
}

// 批量操作
export interface BulkPaymentAction {
  action: 'update_status' | 'assign_owner' | 'create_reminder' | 'export'
  payment_ids: string[]
  params?: any
}