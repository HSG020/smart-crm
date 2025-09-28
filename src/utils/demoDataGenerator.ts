import { Customer, Reminder, Communication, Opportunity } from '../types'
import { v4 as uuidv4 } from 'uuid'

// 示例公司名称池
const companyNames = [
  '创新科技有限公司', '智慧数据集团', '云端解决方案', '未来软件科技',
  '数字化转型咨询', '人工智能研究院', '区块链技术公司', '物联网创新中心',
  '大数据分析平台', '智能制造集团', '金融科技服务', '教育科技创新',
  '医疗健康科技', '新零售解决方案', '供应链管理系统', '企业服务平台'
]

// 示例人名池
const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '军', '磊', '涛']

// 示例职位池
const positions = ['CEO', 'CTO', '产品总监', '技术总监', '采购经理', '项目经理', '运营总监', '市场总监']

// 示例行业池
const industries = ['互联网', '金融', '教育', '医疗', '制造业', '零售', '物流', '房地产']

// 示例标签池
const tagPool = [
  '高意向', '预算充足', '决策者', '技术导向', '价格敏感', '长期合作',
  '紧急需求', '行业标杆', '推荐客户', '老客户', '大客户', '战略合作'
]

// 示例沟通内容池
const communicationTemplates = [
  '初次电话沟通，了解客户基本需求',
  '产品演示会议，客户反馈积极',
  '发送报价单，等待客户确认',
  '讨论合同细节，基本达成一致',
  '技术团队对接，解答技术问题',
  '商务谈判，讨论优惠政策',
  '客户提出新需求，需要评估',
  '签约成功，安排实施计划'
]

// 生成随机日期
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// 生成随机电话
const randomPhone = () => {
  return `1${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 900000000) + 100000000}`
}

// 生成随机邮箱
const randomEmail = (name: string, company: string) => {
  const cleanCompany = company.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').toLowerCase()
  return `${name.toLowerCase()}@${cleanCompany}.com`
}

// 生成示例客户
export const generateDemoCustomers = (count: number = 20): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const customers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = []

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = firstName + lastName
    const company = companyNames[Math.floor(Math.random() * companyNames.length)]
    const position = positions[Math.floor(Math.random() * positions.length)]
    const industry = industries[Math.floor(Math.random() * industries.length)]

    const importance = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low'
    const status = ['potential', 'following', 'signed', 'lost'][Math.floor(Math.random() * 4)] as Customer['status']

    const tags = Array.from(
      { length: Math.floor(Math.random() * 4) + 1 },
      () => tagPool[Math.floor(Math.random() * tagPool.length)]
    )

    const lastContactDate = randomDate(new Date(2024, 0, 1), new Date())
    const nextFollowDate = new Date(lastContactDate)
    nextFollowDate.setDate(nextFollowDate.getDate() + Math.floor(Math.random() * 30) + 1)

    customers.push({
      name,
      company,
      position,
      industry,
      phone: randomPhone(),
      email: randomEmail(name.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, ''), company),
      address: `${['北京', '上海', '深圳', '广州', '杭州'][Math.floor(Math.random() * 5)]}市`,
      tags: [...new Set(tags)], // 去重
      importance,
      status,
      source: ['网站', '推荐', '展会', '电话', '广告'][Math.floor(Math.random() * 5)],
      notes: `这是${name}的备注信息，${status === 'signed' ? '已成功签约' : '正在跟进中'}`,
      lastContactDate: lastContactDate.toISOString(),
      nextFollowUpDate: nextFollowDate.toISOString()
    })
  }

  return customers
}

// 生成示例提醒
export const generateDemoReminders = (
  customers: { id: string; name: string }[],
  count: number = 30
): Omit<Reminder, 'id' | 'createdAt'>[] => {
  const reminders: Omit<Reminder, 'id' | 'createdAt'>[] = []
  const types: Reminder['type'][] = ['follow_up', 'birthday', 'festival', 'contract']
  const titles = {
    follow_up: '客户跟进提醒',
    birthday: '客户生日提醒',
    festival: '节日问候提醒',
    contract: '合同到期提醒'
  }

  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const reminderDate = randomDate(new Date(), new Date(2025, 11, 31))

    reminders.push({
      customerId: customer.id,
      customerName: customer.name,
      title: titles[type],
      description: `提醒：${customer.name} - ${titles[type]}`,
      type,
      reminderDate: reminderDate.toISOString(),
      completed: Math.random() > 0.8
    })
  }

  return reminders
}

// 生成示例沟通记录
export const generateDemoCommunications = (
  customers: { id: string; name: string }[],
  count: number = 50
): Omit<Communication, 'id'>[] => {
  const communications: Omit<Communication, 'id'>[] = []
  const types: Communication['type'][] = ['phone', 'email', 'meeting', 'wechat', 'visit', 'other']

  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const createdAt = randomDate(new Date(2024, 0, 1), new Date())

    communications.push({
      customerId: customer.id,
      customerName: customer.name,
      type,
      content: communicationTemplates[Math.floor(Math.random() * communicationTemplates.length)],
      result: Math.random() > 0.5 ? '客户反馈积极' : '需要继续跟进',
      nextAction: Math.random() > 0.5 ? '准备详细方案' : undefined,
      createdAt: createdAt.toISOString()
    })
  }

  return communications
}

// 生成示例销售机会
export const generateDemoOpportunities = (
  customers: { id: string; name: string; company?: string }[],
  count: number = 15
): Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const opportunities: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const stage = stages[Math.floor(Math.random() * stages.length)]
    const value = Math.floor(Math.random() * 500000) + 10000
    const probability = stage === 'closed_won' ? 100 :
                        stage === 'closed_lost' ? 0 :
                        Math.floor(Math.random() * 80) + 10

    opportunities.push({
      customerId: customer.id,
      customerName: customer.name,
      title: `${customer.company || customer.name} - CRM系统采购项目`,
      value,
      probability,
      stage,
      expectedCloseDate: randomDate(new Date(), new Date(2025, 11, 31)).toISOString(),
      notes: `预计合同金额：${value}元，当前阶段：${stage}`
    })
  }

  return opportunities
}

// 批量生成所有演示数据
export const generateAllDemoData = () => {
  // 生成客户数据（带临时ID）
  const customersWithIds = generateDemoCustomers(20).map(c => ({
    ...c,
    id: uuidv4()
  }))

  // 基于客户生成其他数据
  const reminders = generateDemoReminders(customersWithIds, 30)
  const communications = generateDemoCommunications(customersWithIds, 50)
  const opportunities = generateDemoOpportunities(customersWithIds, 15)

  return {
    customers: customersWithIds.map(({ id, ...rest }) => rest), // 移除临时ID
    reminders,
    communications,
    opportunities,
    stats: {
      totalCustomers: customersWithIds.length,
      totalReminders: reminders.length,
      totalCommunications: communications.length,
      totalOpportunities: opportunities.length,
      activeReminders: reminders.filter(r => !r.completed).length,
      wonDeals: opportunities.filter(o => o.stage === 'closed_won').length,
      totalPipelineValue: opportunities
        .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
        .reduce((sum, o) => sum + o.value, 0)
    }
  }
}