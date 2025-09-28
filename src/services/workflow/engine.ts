/**
 * 工作流执行引擎 MVP 实现
 * 支持串行执行、条件分支、错误处理
 */

import { supabase } from '../../lib/supabase'

// ==========================================
// 类型定义
// ==========================================

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, any>
}

export interface WorkflowTrigger {
  type: 'manual' | 'event' | 'time' | 'condition'
  config: Record<string, any>
}

export interface WorkflowNode {
  id: string
  type: 'start' | 'end' | 'action' | 'condition' | 'parallel' | 'wait'
  name: string
  actionType?: string // 对应 workflow_actions 表中的动作
  config?: Record<string, any>
  position?: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string // 条件表达式
  label?: string
}

export interface WorkflowContext {
  variables: Record<string, any>
  trigger: Record<string, any>
  customer?: Record<string, any>
  user?: Record<string, any>
  outputs: Record<string, any> // 存储各节点的输出
}

export interface ExecutionResult {
  success: boolean
  output?: any
  error?: string
  duration?: number
}

// ==========================================
// 工作流执行引擎
// ==========================================

export class WorkflowEngine {
  private definition: WorkflowDefinition
  private context: WorkflowContext
  private runId: string | null = null

  constructor(definition: WorkflowDefinition) {
    this.definition = definition
    this.context = {
      variables: { ...definition.variables },
      trigger: {},
      outputs: {}
    }
  }

  /**
   * 执行工作流
   */
  async execute(triggerData: Record<string, any> = {}): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // 1. 创建运行实例
      await this.createWorkflowRun(triggerData)

      // 2. 初始化上下文
      this.context.trigger = triggerData

      // 3. 查找起始节点
      const startNode = this.definition.nodes.find(n => n.type === 'start')
      if (!startNode) {
        throw new Error('未找到起始节点')
      }

      // 4. 串行执行流程
      await this.executeNode(startNode.id)

      // 5. 更新运行状态为成功
      await this.updateWorkflowRun('completed', this.context.outputs)

      return {
        success: true,
        output: this.context.outputs,
        duration: Date.now() - startTime
      }

    } catch (error) {
      // 更新运行状态为失败
      await this.updateWorkflowRun('failed', null, String(error))

      return {
        success: false,
        error: String(error),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * 递归执行节点
   */
  private async executeNode(nodeId: string): Promise<void> {
    const node = this.definition.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    // 记录节点执行开始
    const nodeExecId = await this.createNodeExecution(node)

    try {
      let output: any = null

      // 根据节点类型执行
      switch (node.type) {
        case 'start':
          // 起始节点，直接执行下一个
          break

        case 'end':
          // 结束节点，完成执行
          await this.updateNodeExecution(nodeExecId, 'completed')
          return

        case 'action':
          // 执行动作节点
          output = await this.executeAction(node)
          this.context.outputs[node.id] = output
          break

        case 'condition':
          // 条件分支节点
          const conditionResult = await this.evaluateCondition(node)
          this.context.outputs[node.id] = conditionResult

          // 根据条件结果选择下一个节点
          const conditionalEdges = this.definition.edges.filter(e => e.source === nodeId)
          for (const edge of conditionalEdges) {
            if (this.evaluateEdgeCondition(edge, conditionResult)) {
              await this.updateNodeExecution(nodeExecId, 'completed', { result: conditionResult })
              await this.executeNode(edge.target)
              return
            }
          }
          break

        case 'wait':
          // 等待节点
          const waitTime = node.config?.duration || 1000
          await new Promise(resolve => setTimeout(resolve, waitTime))
          break

        case 'parallel':
          // 并行执行（简化版：仍然串行，但不等待结果）
          const parallelEdges = this.definition.edges.filter(e => e.source === nodeId)
          for (const edge of parallelEdges) {
            // 这里简化处理，实际应该并发执行
            await this.executeNode(edge.target)
          }
          await this.updateNodeExecution(nodeExecId, 'completed')
          return

        default:
          throw new Error(`未知节点类型: ${node.type}`)
      }

      // 更新节点执行状态
      await this.updateNodeExecution(nodeExecId, 'completed', output)

      // 执行下一个节点
      const nextEdge = this.definition.edges.find(e => e.source === nodeId && !e.condition)
      if (nextEdge) {
        await this.executeNode(nextEdge.target)
      }

    } catch (error) {
      await this.updateNodeExecution(nodeExecId, 'failed', null, String(error))
      throw error
    }
  }

  /**
   * 执行动作节点
   */
  private async executeAction(node: WorkflowNode): Promise<any> {
    const actionType = node.actionType
    if (!actionType) {
      throw new Error('动作节点未指定动作类型')
    }

    // 根据动作类型执行相应操作
    switch (actionType) {
      case 'create_reminder':
        return await this.actionCreateReminder(node.config || {})

      case 'update_customer_status':
        return await this.actionUpdateCustomerStatus(node.config || {})

      case 'send_email':
        return await this.actionSendEmail(node.config || {})

      case 'assign_to_user':
        return await this.actionAssignToUser(node.config || {})

      case 'create_opportunity':
        return await this.actionCreateOpportunity(node.config || {})

      default:
        throw new Error(`未实现的动作类型: ${actionType}`)
    }
  }

  // ==========================================
  // 内置动作实现
  // ==========================================

  private async actionCreateReminder(config: Record<string, any>) {
    const { customerId, title, description, date, priority = 'medium' } = config

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        customer_id: customerId || this.context.customer?.id,
        title: this.resolveVariable(title),
        description: this.resolveVariable(description),
        reminder_date: date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority,
        type: 'follow_up',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  private async actionUpdateCustomerStatus(config: Record<string, any>) {
    const { customerId, status } = config

    const { data, error } = await supabase
      .from('customers')
      .update({ status })
      .eq('id', customerId || this.context.customer?.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  private async actionSendEmail(config: Record<string, any>) {
    const { to, subject, body, template } = config

    // 这里模拟发送邮件
    console.log('发送邮件:', {
      to: this.resolveVariable(to),
      subject: this.resolveVariable(subject),
      body: this.resolveVariable(body)
    })

    // 记录通信记录
    const { data, error } = await supabase
      .from('communications')
      .insert({
        customer_id: this.context.customer?.id,
        type: 'email',
        direction: 'outbound',
        content: this.resolveVariable(body),
        date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) console.error('记录通信失败:', error)
    return { sent: true, communicationId: data?.id }
  }

  private async actionAssignToUser(config: Record<string, any>) {
    const { customerId, userId, assignmentRule = 'manual' } = config

    let targetUserId = userId

    // 根据分配规则选择用户
    if (assignmentRule === 'round-robin') {
      // 轮询分配（简化实现）
      targetUserId = await this.getRoundRobinUser()
    } else if (assignmentRule === 'load-balance') {
      // 负载均衡分配
      targetUserId = await this.getLoadBalancedUser()
    }

    const { data, error } = await supabase
      .from('customers')
      .update({ assigned_to: targetUserId })
      .eq('id', customerId || this.context.customer?.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  private async actionCreateOpportunity(config: Record<string, any>) {
    const { customerId, title, value, stage = 'qualification' } = config

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        customer_id: customerId || this.context.customer?.id,
        title: this.resolveVariable(title),
        value: Number(value) || 0,
        stage,
        probability: 30,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ==========================================
  // 辅助方法
  // ==========================================

  private async evaluateCondition(node: WorkflowNode): Promise<boolean> {
    const condition = node.config?.condition
    if (!condition) return true

    // 简化的条件评估（实际应该使用表达式引擎）
    try {
      // 替换变量
      let expression = condition
      for (const [key, value] of Object.entries(this.context.variables)) {
        expression = expression.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value))
      }

      // 使用 Function 构造器评估（注意：生产环境应该使用更安全的方法）
      return new Function('context', `return ${expression}`)(this.context)
    } catch (error) {
      console.error('条件评估失败:', error)
      return false
    }
  }

  private evaluateEdgeCondition(edge: WorkflowEdge, nodeResult: any): boolean {
    if (!edge.condition) return true

    // 简单的条件匹配
    if (edge.condition === 'true' && nodeResult === true) return true
    if (edge.condition === 'false' && nodeResult === false) return true
    if (edge.condition === nodeResult) return true

    return false
  }

  private resolveVariable(value: any): any {
    if (typeof value !== 'string') return value

    // 替换变量占位符
    let resolved = value

    // 替换上下文变量
    resolved = resolved.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.context.variables[key] || match
    })

    // 替换客户信息
    if (this.context.customer) {
      resolved = resolved.replace(/\{\{customer\.(\w+)\}\}/g, (match, key) => {
        return this.context.customer![key] || match
      })
    }

    return resolved
  }

  private async getRoundRobinUser(): Promise<string> {
    // 简化实现：返回第一个用户
    const { data } = await supabase.auth.getUser()
    return data.user?.id || ''
  }

  private async getLoadBalancedUser(): Promise<string> {
    // 简化实现：返回当前用户
    const { data } = await supabase.auth.getUser()
    return data.user?.id || ''
  }

  // ==========================================
  // 数据库操作
  // ==========================================

  private async createWorkflowRun(triggerData: Record<string, any>) {
    const { data, error } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: this.definition.id,
        status: 'running',
        trigger_source: 'manual',
        trigger_data: triggerData,
        context: this.context
      })
      .select()
      .single()

    if (error) throw error
    this.runId = data.id
  }

  private async updateWorkflowRun(status: string, output?: any, error?: string) {
    if (!this.runId) return

    await supabase
      .from('workflow_runs')
      .update({
        status,
        output,
        error,
        end_time: new Date().toISOString()
      })
      .eq('id', this.runId)
  }

  private async createNodeExecution(node: WorkflowNode): Promise<string> {
    if (!this.runId) return ''

    const { data, error } = await supabase
      .from('workflow_node_executions')
      .insert({
        run_id: this.runId,
        node_id: node.id,
        node_type: node.type,
        node_name: node.name,
        status: 'running',
        start_time: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  private async updateNodeExecution(nodeExecId: string, status: string, output?: any, error?: string) {
    if (!nodeExecId) return

    await supabase
      .from('workflow_node_executions')
      .update({
        status,
        output,
        error,
        end_time: new Date().toISOString()
      })
      .eq('id', nodeExecId)
  }
}