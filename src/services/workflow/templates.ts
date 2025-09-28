/**
 * 预定义工作流模板
 * 提供开箱即用的自动化流程
 */

import { WorkflowDefinition } from './engine'

/**
 * 新客户自动化流程
 * 触发：新客户创建
 * 流程：
 * 1. 自动分配负责人（轮询）
 * 2. 创建欢迎跟进提醒（24小时后）
 * 3. 发送欢迎邮件
 * 4. 根据客户重要性设置不同跟进策略
 */
export const newCustomerWorkflow: WorkflowDefinition = {
  id: 'new-customer-automation',
  name: '新客户自动化流程',
  description: '自动处理新客户的分配、提醒和通知',

  trigger: {
    type: 'event',
    config: {
      event: 'customer.created'
    }
  },

  variables: {
    followUpDays: 1,
    emailTemplate: 'welcome'
  },

  nodes: [
    {
      id: 'start',
      type: 'start',
      name: '开始',
      position: { x: 100, y: 100 }
    },
    {
      id: 'assign-owner',
      type: 'action',
      name: '分配负责人',
      actionType: 'assign_to_user',
      config: {
        assignmentRule: 'round-robin'
      },
      position: { x: 250, y: 100 }
    },
    {
      id: 'check-importance',
      type: 'condition',
      name: '检查客户重要性',
      config: {
        condition: 'context.customer.importance'
      },
      position: { x: 400, y: 100 }
    },
    {
      id: 'create-urgent-reminder',
      type: 'action',
      name: '创建紧急提醒',
      actionType: 'create_reminder',
      config: {
        title: '重要客户跟进',
        description: '这是一个高价值客户，请优先跟进',
        priority: 'high',
        date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4小时后
      },
      position: { x: 550, y: 50 }
    },
    {
      id: 'create-normal-reminder',
      type: 'action',
      name: '创建常规提醒',
      actionType: 'create_reminder',
      config: {
        title: '新客户跟进',
        description: '请在方便的时候跟进此客户',
        priority: 'medium',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后
      },
      position: { x: 550, y: 150 }
    },
    {
      id: 'send-welcome-email',
      type: 'action',
      name: '发送欢迎邮件',
      actionType: 'send_email',
      config: {
        to: '{{customer.email}}',
        subject: '欢迎您，{{customer.name}}！',
        body: '尊敬的{{customer.name}}，\n\n欢迎您成为我们的客户！我们将竭诚为您提供最优质的服务。\n\n您的专属客户经理将在24小时内与您联系。\n\n祝商祺！'
      },
      position: { x: 700, y: 100 }
    },
    {
      id: 'update-status',
      type: 'action',
      name: '更新客户状态',
      actionType: 'update_customer_status',
      config: {
        status: 'following'
      },
      position: { x: 850, y: 100 }
    },
    {
      id: 'end',
      type: 'end',
      name: '结束',
      position: { x: 1000, y: 100 }
    }
  ],

  edges: [
    {
      id: 'e1',
      source: 'start',
      target: 'assign-owner'
    },
    {
      id: 'e2',
      source: 'assign-owner',
      target: 'check-importance'
    },
    {
      id: 'e3',
      source: 'check-importance',
      target: 'create-urgent-reminder',
      condition: 'high',
      label: '高重要性'
    },
    {
      id: 'e4',
      source: 'check-importance',
      target: 'create-normal-reminder',
      condition: 'medium',
      label: '中/低重要性'
    },
    {
      id: 'e5',
      source: 'check-importance',
      target: 'create-normal-reminder',
      condition: 'low',
      label: '低重要性'
    },
    {
      id: 'e6',
      source: 'create-urgent-reminder',
      target: 'send-welcome-email'
    },
    {
      id: 'e7',
      source: 'create-normal-reminder',
      target: 'send-welcome-email'
    },
    {
      id: 'e8',
      source: 'send-welcome-email',
      target: 'update-status'
    },
    {
      id: 'e9',
      source: 'update-status',
      target: 'end'
    }
  ]
}

/**
 * 客户跟进提醒工作流
 * 触发：每天早上9点
 * 流程：
 * 1. 查询今日需要跟进的客户
 * 2. 为每个客户创建提醒
 * 3. 发送汇总通知
 */
export const dailyFollowUpWorkflow: WorkflowDefinition = {
  id: 'daily-follow-up',
  name: '每日跟进提醒',
  description: '每天自动创建当日需要跟进的客户提醒',

  trigger: {
    type: 'time',
    config: {
      cron: '0 9 * * *', // 每天早上9点
      timezone: 'Asia/Shanghai'
    }
  },

  variables: {
    reminderPriority: 'high'
  },

  nodes: [
    {
      id: 'start',
      type: 'start',
      name: '开始',
      position: { x: 100, y: 100 }
    },
    {
      id: 'create-reminders',
      type: 'action',
      name: '创建今日提醒',
      actionType: 'create_reminder',
      config: {
        title: '今日重点跟进',
        description: '请及时跟进以下客户',
        priority: 'high'
      },
      position: { x: 300, y: 100 }
    },
    {
      id: 'send-summary',
      type: 'action',
      name: '发送汇总通知',
      actionType: 'send_email',
      config: {
        to: '{{user.email}}',
        subject: '今日跟进计划',
        body: '您好，今天有{{reminderCount}}个客户需要跟进，请查看系统提醒。'
      },
      position: { x: 500, y: 100 }
    },
    {
      id: 'end',
      type: 'end',
      name: '结束',
      position: { x: 700, y: 100 }
    }
  ],

  edges: [
    {
      id: 'e1',
      source: 'start',
      target: 'create-reminders'
    },
    {
      id: 'e2',
      source: 'create-reminders',
      target: 'send-summary'
    },
    {
      id: 'e3',
      source: 'send-summary',
      target: 'end'
    }
  ]
}

/**
 * 销售机会阶段推进工作流
 * 触发：销售机会阶段变更
 * 流程：
 * 1. 根据新阶段执行不同动作
 * 2. 更新相关提醒
 * 3. 通知相关人员
 */
export const opportunityStageWorkflow: WorkflowDefinition = {
  id: 'opportunity-stage-change',
  name: '销售机会阶段推进',
  description: '根据销售机会阶段变化自动执行相应动作',

  trigger: {
    type: 'event',
    config: {
      event: 'opportunity.stage_changed'
    }
  },

  variables: {},

  nodes: [
    {
      id: 'start',
      type: 'start',
      name: '开始',
      position: { x: 100, y: 200 }
    },
    {
      id: 'check-stage',
      type: 'condition',
      name: '检查新阶段',
      config: {
        condition: 'context.trigger.newStage'
      },
      position: { x: 250, y: 200 }
    },
    {
      id: 'proposal-action',
      type: 'action',
      name: '准备提案',
      actionType: 'create_reminder',
      config: {
        title: '准备销售提案',
        description: '客户已进入提案阶段，请准备相关材料',
        priority: 'high'
      },
      position: { x: 450, y: 100 }
    },
    {
      id: 'negotiation-action',
      type: 'action',
      name: '跟进谈判',
      actionType: 'create_reminder',
      config: {
        title: '跟进谈判进展',
        description: '密切关注谈判进展，及时处理客户疑虑',
        priority: 'high'
      },
      position: { x: 450, y: 200 }
    },
    {
      id: 'closed-won-action',
      type: 'action',
      name: '成交处理',
      actionType: 'send_email',
      config: {
        to: '{{customer.email}}',
        subject: '感谢您的信任！',
        body: '恭喜成交！我们将尽快为您安排后续服务。'
      },
      position: { x: 450, y: 300 }
    },
    {
      id: 'notify-team',
      type: 'action',
      name: '通知团队',
      actionType: 'send_email',
      config: {
        to: 'team@company.com',
        subject: '销售机会阶段更新',
        body: '{{opportunity.title}} 已进入 {{trigger.newStage}} 阶段'
      },
      position: { x: 650, y: 200 }
    },
    {
      id: 'end',
      type: 'end',
      name: '结束',
      position: { x: 850, y: 200 }
    }
  ],

  edges: [
    {
      id: 'e1',
      source: 'start',
      target: 'check-stage'
    },
    {
      id: 'e2',
      source: 'check-stage',
      target: 'proposal-action',
      condition: 'proposal',
      label: '提案阶段'
    },
    {
      id: 'e3',
      source: 'check-stage',
      target: 'negotiation-action',
      condition: 'negotiation',
      label: '谈判阶段'
    },
    {
      id: 'e4',
      source: 'check-stage',
      target: 'closed-won-action',
      condition: 'closed-won',
      label: '成交'
    },
    {
      id: 'e5',
      source: 'proposal-action',
      target: 'notify-team'
    },
    {
      id: 'e6',
      source: 'negotiation-action',
      target: 'notify-team'
    },
    {
      id: 'e7',
      source: 'closed-won-action',
      target: 'notify-team'
    },
    {
      id: 'e8',
      source: 'notify-team',
      target: 'end'
    }
  ]
}

/**
 * 获取所有工作流模板
 */
export const getAllWorkflowTemplates = (): WorkflowDefinition[] => {
  return [
    newCustomerWorkflow,
    dailyFollowUpWorkflow,
    opportunityStageWorkflow
  ]
}

/**
 * 根据ID获取工作流模板
 */
export const getWorkflowTemplateById = (id: string): WorkflowDefinition | undefined => {
  return getAllWorkflowTemplates().find(template => template.id === id)
}