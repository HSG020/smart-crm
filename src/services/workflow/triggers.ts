/**
 * 工作流触发器系统
 * 支持事件触发、定时触发、条件触发
 */

import { supabase } from '../../lib/supabase'
import { WorkflowEngine, WorkflowDefinition } from './engine'
import { getAllWorkflowTemplates } from './templates'

// ==========================================
// 触发器类型定义
// ==========================================

export type TriggerType = 'event' | 'time' | 'condition' | 'manual'

export interface TriggerConfig {
  type: TriggerType
  config: Record<string, any>
}

export interface EventTriggerConfig {
  event: string // customer.created, opportunity.stage_changed 等
  filter?: Record<string, any> // 额外的过滤条件
}

export interface TimeTriggerConfig {
  cron?: string // cron 表达式
  interval?: number // 间隔时间（毫秒）
  timezone?: string // 时区
}

export interface ConditionTriggerConfig {
  condition: string // 条件表达式
  checkInterval: number // 检查间隔（毫秒）
}

// ==========================================
// 触发器管理器
// ==========================================

export class TriggerManager {
  private static instance: TriggerManager
  private subscriptions: Map<string, any> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private workflows: WorkflowDefinition[] = []

  private constructor() {
    // 加载所有工作流模板
    this.workflows = getAllWorkflowTemplates()
  }

  static getInstance(): TriggerManager {
    if (!TriggerManager.instance) {
      TriggerManager.instance = new TriggerManager()
    }
    return TriggerManager.instance
  }

  /**
   * 启动所有触发器
   */
  async start() {
    console.log('🚀 启动工作流触发器系统...')

    // 为每个工作流设置触发器
    for (const workflow of this.workflows) {
      await this.setupTrigger(workflow)
    }

    console.log(`✅ 已启动 ${this.workflows.length} 个工作流触发器`)
  }

  /**
   * 停止所有触发器
   */
  async stop() {
    console.log('🛑 停止工作流触发器系统...')

    // 取消所有订阅
    for (const [id, subscription] of this.subscriptions) {
      if (subscription && subscription.unsubscribe) {
        await subscription.unsubscribe()
      }
    }
    this.subscriptions.clear()

    // 清除所有定时器
    for (const [id, interval] of this.intervals) {
      clearInterval(interval)
    }
    this.intervals.clear()

    console.log('✅ 所有触发器已停止')
  }

  /**
   * 设置单个工作流的触发器
   */
  private async setupTrigger(workflow: WorkflowDefinition) {
    const { trigger } = workflow

    switch (trigger.type) {
      case 'event':
        await this.setupEventTrigger(workflow)
        break
      case 'time':
        this.setupTimeTrigger(workflow)
        break
      case 'condition':
        this.setupConditionTrigger(workflow)
        break
      case 'manual':
        // 手动触发不需要设置
        console.log(`📌 工作流 [${workflow.name}] 设置为手动触发`)
        break
      default:
        console.warn(`⚠️ 未知的触发器类型: ${trigger.type}`)
    }
  }

  /**
   * 设置事件触发器（使用 Supabase Realtime）
   */
  private async setupEventTrigger(workflow: WorkflowDefinition) {
    const config = workflow.trigger.config as EventTriggerConfig
    const [schema, table, action] = config.event.split('.')

    // 订阅数据库变化
    const channel = supabase
      .channel(`workflow-${workflow.id}`)
      .on(
        'postgres_changes',
        {
          event: action?.toUpperCase() || 'INSERT',
          schema: schema || 'public',
          table: table || 'customers',
          filter: config.filter ? this.buildFilter(config.filter) : undefined
        },
        async (payload) => {
          console.log(`📨 事件触发: ${config.event}`)
          await this.executeWorkflow(workflow, {
            trigger: payload,
            ...payload.new
          })
        }
      )
      .subscribe()

    this.subscriptions.set(workflow.id, channel)
    console.log(`📡 已订阅事件: ${config.event} -> [${workflow.name}]`)
  }

  /**
   * 设置定时触发器
   */
  private setupTimeTrigger(workflow: WorkflowDefinition) {
    const config = workflow.trigger.config as TimeTriggerConfig

    if (config.interval) {
      // 基于间隔的定时器
      const interval = setInterval(async () => {
        console.log(`⏰ 定时触发: [${workflow.name}]`)
        await this.executeWorkflow(workflow, {
          trigger: { type: 'time', timestamp: new Date().toISOString() }
        })
      }, config.interval)

      this.intervals.set(workflow.id, interval)
      console.log(`⏱️ 已设置定时器: 每 ${config.interval}ms -> [${workflow.name}]`)
    } else if (config.cron) {
      // 基于 cron 表达式（简化实现，实际需要 cron 库）
      console.log(`📅 Cron 触发器: ${config.cron} -> [${workflow.name}] (需要 cron 库支持)`)
      // TODO: 集成 node-cron 或类似库
    }
  }

  /**
   * 设置条件触发器
   */
  private setupConditionTrigger(workflow: WorkflowDefinition) {
    const config = workflow.trigger.config as ConditionTriggerConfig

    // 定期检查条件
    const interval = setInterval(async () => {
      const result = await this.evaluateCondition(config.condition)
      if (result) {
        console.log(`🎯 条件触发: [${workflow.name}]`)
        await this.executeWorkflow(workflow, {
          trigger: { type: 'condition', condition: config.condition }
        })
      }
    }, config.checkInterval || 60000) // 默认每分钟检查

    this.intervals.set(workflow.id, interval)
    console.log(`🔍 已设置条件检查: ${config.condition} -> [${workflow.name}]`)
  }

  /**
   * 执行工作流
   */
  private async executeWorkflow(workflow: WorkflowDefinition, triggerData: Record<string, any>) {
    try {
      const engine = new WorkflowEngine(workflow)
      const result = await engine.execute(triggerData)

      if (result.success) {
        console.log(`✅ 工作流 [${workflow.name}] 执行成功`)

        // 记录触发日志
        await this.logTrigger(workflow.id, true, result.output)
      } else {
        console.error(`❌ 工作流 [${workflow.name}] 执行失败:`, result.error)

        // 记录失败日志
        await this.logTrigger(workflow.id, false, null, result.error)
      }
    } catch (error) {
      console.error(`💥 工作流执行异常:`, error)
      await this.logTrigger(workflow.id, false, null, String(error))
    }
  }

  /**
   * 手动触发工作流
   */
  async triggerWorkflow(workflowId: string, data: Record<string, any> = {}) {
    const workflow = this.workflows.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error(`工作流 ${workflowId} 不存在`)
    }

    console.log(`🔧 手动触发工作流: [${workflow.name}]`)
    await this.executeWorkflow(workflow, {
      trigger: { type: 'manual', ...data },
      ...data
    })
  }

  /**
   * 构建过滤条件
   */
  private buildFilter(filter: Record<string, any>): string {
    // 简单实现：将对象转换为 PostgreSQL 过滤字符串
    const conditions = Object.entries(filter).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}=eq.${value}`
      } else if (typeof value === 'number') {
        return `${key}=eq.${value}`
      } else if (value === null) {
        return `${key}=is.null`
      }
      return ''
    }).filter(c => c)

    return conditions.join(',')
  }

  /**
   * 评估条件
   */
  private async evaluateCondition(condition: string): Promise<boolean> {
    // 简化实现：检查特定条件
    // 实际应该使用表达式引擎或查询数据库

    // 示例：检查是否有超期未跟进的客户
    if (condition === 'has_overdue_customers') {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .lt('next_follow_up_date', new Date().toISOString())
        .limit(1)

      return !error && data && data.length > 0
    }

    return false
  }

  /**
   * 记录触发日志
   */
  private async logTrigger(
    workflowId: string,
    triggered: boolean,
    output?: any,
    error?: string
  ) {
    try {
      await supabase.from('workflow_triggers_log').insert({
        workflow_id: workflowId,
        trigger_type: 'auto',
        triggered,
        trigger_data: output,
        failure_reason: error
      })
    } catch (err) {
      console.error('记录触发日志失败:', err)
    }
  }
}

// ==========================================
// 导出实例和辅助函数
// ==========================================

export const triggerManager = TriggerManager.getInstance()

/**
 * 启动触发器系统
 */
export async function startTriggerSystem() {
  await triggerManager.start()
}

/**
 * 停止触发器系统
 */
export async function stopTriggerSystem() {
  await triggerManager.stop()
}

/**
 * 手动触发工作流
 */
export async function triggerWorkflow(workflowId: string, data?: Record<string, any>) {
  await triggerManager.triggerWorkflow(workflowId, data)
}