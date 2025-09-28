/**
 * 邮件服务集成
 * 模拟邮件发送、接收、模板管理等功能
 */

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: 'welcome' | 'follow-up' | 'promotion' | 'notification' | 'custom'
  variables: string[]  // 支持的变量，如 {{customer_name}}
  createdAt: Date
  updatedAt: Date
}

export interface EmailMessage {
  id: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  html?: string
  attachments?: EmailAttachment[]
  status: 'draft' | 'sending' | 'sent' | 'failed' | 'scheduled'
  scheduledTime?: Date
  sentTime?: Date
  templateId?: string
  metadata?: Record<string, any>
}

export interface EmailAttachment {
  filename: string
  contentType: string
  size: number
  url?: string
}

export interface EmailAccount {
  id: string
  email: string
  displayName: string
  provider: 'gmail' | 'outlook' | 'exchange' | 'custom'
  isDefault: boolean
  signature?: string
  settings: {
    trackOpens: boolean
    trackClicks: boolean
    autoReply: boolean
    autoReplyMessage?: string
  }
}

/**
 * 邮件服务类
 */
export class EmailService {
  private templates: Map<string, EmailTemplate> = new Map()
  private messages: Map<string, EmailMessage> = new Map()
  private accounts: Map<string, EmailAccount> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
    this.initializeDefaultAccount()
  }

  /**
   * 初始化默认邮件模板
   */
  private initializeDefaultTemplates() {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'welcome-new-customer',
        name: '新客户欢迎邮件',
        subject: '欢迎加入 {{company_name}}',
        body: `尊敬的 {{customer_name}}，

非常感谢您选择我们的产品和服务！

作为您的专属客户经理，我将全程为您提供支持。如有任何问题或需求，请随时联系我。

期待与您的合作！

此致
{{sender_name}}
{{sender_title}}`,
        category: 'welcome',
        variables: ['customer_name', 'company_name', 'sender_name', 'sender_title'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'follow-up-after-meeting',
        name: '会议后跟进',
        subject: '关于我们今天的会议 - {{meeting_topic}}',
        body: `Hi {{customer_name}}，

感谢您今天抽出时间与我会面。

根据我们的讨论，主要达成了以下共识：
{{meeting_summary}}

下一步行动：
{{action_items}}

如有任何补充或疑问，请随时告诉我。

Best regards,
{{sender_name}}`,
        category: 'follow-up',
        variables: ['customer_name', 'meeting_topic', 'meeting_summary', 'action_items', 'sender_name'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'product-promotion',
        name: '产品推广',
        subject: '{{product_name}} - 专属优惠',
        body: `尊敬的 {{customer_name}}，

我们很高兴地通知您，{{product_name}} 现在推出限时优惠！

优惠详情：
{{promotion_details}}

优惠有效期：{{valid_until}}

立即了解更多：{{product_link}}

不要错过这个机会！

{{sender_name}}
{{company_name}}`,
        category: 'promotion',
        variables: ['customer_name', 'product_name', 'promotion_details', 'valid_until', 'product_link', 'sender_name', 'company_name'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * 初始化默认账户
   */
  private initializeDefaultAccount() {
    const defaultAccount: EmailAccount = {
      id: 'default-account',
      email: 'sales@company.com',
      displayName: '销售团队',
      provider: 'gmail',
      isDefault: true,
      signature: `
<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
  <strong>销售团队</strong><br>
  Smart CRM System<br>
  📧 sales@company.com<br>
  📱 400-888-8888
</div>`,
      settings: {
        trackOpens: true,
        trackClicks: true,
        autoReply: false
      }
    }

    this.accounts.set(defaultAccount.id, defaultAccount)
  }

  /**
   * 发送邮件
   */
  async sendEmail(message: Partial<EmailMessage>): Promise<EmailMessage> {
    // 生成邮件ID
    const emailId = `email-${Date.now()}`

    // 获取默认账户
    const defaultAccount = Array.from(this.accounts.values()).find(a => a.isDefault)
    if (!defaultAccount) {
      throw new Error('未找到默认邮件账户')
    }

    // 创建邮件消息
    const fullMessage: EmailMessage = {
      id: emailId,
      from: message.from || defaultAccount.email,
      to: message.to || [],
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject || '无主题',
      body: message.body || '',
      html: message.html,
      attachments: message.attachments,
      status: 'sending',
      templateId: message.templateId,
      metadata: message.metadata
    }

    // 保存邮件
    this.messages.set(emailId, fullMessage)

    // 模拟发送过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟90%成功率
        if (Math.random() > 0.1) {
          fullMessage.status = 'sent'
          fullMessage.sentTime = new Date()
          resolve(fullMessage)
        } else {
          fullMessage.status = 'failed'
          reject(new Error('邮件发送失败'))
        }
      }, 1000)
    })
  }

  /**
   * 使用模板发送邮件
   */
  async sendWithTemplate(
    templateId: string,
    to: string[],
    variables: Record<string, string>
  ): Promise<EmailMessage> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`)
    }

    // 替换变量
    let subject = template.subject
    let body = template.body

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })

    // 发送邮件
    return this.sendEmail({
      to,
      subject,
      body,
      templateId,
      metadata: { variables }
    })
  }

  /**
   * 安排定时邮件
   */
  async scheduleEmail(
    message: Partial<EmailMessage>,
    scheduledTime: Date
  ): Promise<EmailMessage> {
    const emailId = `email-${Date.now()}`
    const defaultAccount = Array.from(this.accounts.values()).find(a => a.isDefault)

    if (!defaultAccount) {
      throw new Error('未找到默认邮件账户')
    }

    const scheduledMessage: EmailMessage = {
      id: emailId,
      from: message.from || defaultAccount.email,
      to: message.to || [],
      subject: message.subject || '无主题',
      body: message.body || '',
      status: 'scheduled',
      scheduledTime,
      ...message
    }

    this.messages.set(emailId, scheduledMessage)

    // 设置定时器（实际应该使用任务队列）
    const delay = scheduledTime.getTime() - Date.now()
    if (delay > 0) {
      setTimeout(() => {
        this.sendEmail(scheduledMessage)
      }, delay)
    }

    return scheduledMessage
  }

  /**
   * 批量发送邮件
   */
  async bulkSend(
    recipients: Array<{ email: string; variables: Record<string, string> }>,
    templateId: string
  ): Promise<EmailMessage[]> {
    const results: EmailMessage[] = []

    // 分批发送，避免过载
    const batchSize = 10
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      const promises = batch.map(recipient =>
        this.sendWithTemplate(templateId, [recipient.email], recipient.variables)
      )

      const batchResults = await Promise.allSettled(promises)
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })

      // 批次间延迟
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  /**
   * 获取邮件模板列表
   */
  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 创建自定义模板
   */
  createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.templates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  /**
   * 获取邮件历史
   */
  getEmailHistory(filter?: {
    status?: EmailMessage['status']
    from?: string
    to?: string
    dateRange?: { start: Date; end: Date }
  }): EmailMessage[] {
    let messages = Array.from(this.messages.values())

    if (filter) {
      if (filter.status) {
        messages = messages.filter(m => m.status === filter.status)
      }
      if (filter.from) {
        messages = messages.filter(m => m.from === filter.from)
      }
      if (filter.to) {
        messages = messages.filter(m => m.to.includes(filter.to))
      }
      if (filter.dateRange) {
        messages = messages.filter(m => {
          const sentTime = m.sentTime || m.scheduledTime
          if (!sentTime) return false
          return sentTime >= filter.dateRange!.start && sentTime <= filter.dateRange!.end
        })
      }
    }

    return messages.sort((a, b) => {
      const timeA = a.sentTime || a.scheduledTime || new Date(0)
      const timeB = b.sentTime || b.scheduledTime || new Date(0)
      return timeB.getTime() - timeA.getTime()
    })
  }

  /**
   * 获取邮件统计
   */
  getEmailStats(): {
    total: number
    sent: number
    failed: number
    scheduled: number
    openRate: number
    clickRate: number
  } {
    const messages = Array.from(this.messages.values())
    const sent = messages.filter(m => m.status === 'sent')

    return {
      total: messages.length,
      sent: sent.length,
      failed: messages.filter(m => m.status === 'failed').length,
      scheduled: messages.filter(m => m.status === 'scheduled').length,
      openRate: sent.length > 0 ? Math.random() * 0.3 + 0.4 : 0, // 模拟40-70%打开率
      clickRate: sent.length > 0 ? Math.random() * 0.2 + 0.1 : 0  // 模拟10-30%点击率
    }
  }
}

// 导出单例
export const emailService = new EmailService()