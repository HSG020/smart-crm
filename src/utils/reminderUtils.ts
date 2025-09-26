import { Customer, Reminder } from '../types'

export const generateFollowUpReminders = (customers: Customer[]): Reminder[] => {
  const reminders: Reminder[] = []
  const now = new Date()

  customers.forEach(customer => {
    if (customer.nextFollowUpDate && new Date(customer.nextFollowUpDate) <= now) {
      const reminder: Reminder = {
        id: `followup_${customer.id}_${Date.now()}`,
        customerId: customer.id,
        type: 'follow_up',
        title: `跟进客户：${customer.name}`,
        description: `请及时跟进客户${customer.name}（${customer.company}），上次联系时间：${customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : '无'}`,
        reminderDate: customer.nextFollowUpDate,
        completed: false,
        createdAt: now
      }
      reminders.push(reminder)
    }

    if (customer.birthday) {
      const birthday = new Date(customer.birthday)
      const thisYear = new Date()
      thisYear.setFullYear(now.getFullYear())
      thisYear.setMonth(birthday.getMonth())
      thisYear.setDate(birthday.getDate())
      
      if (thisYear >= now && thisYear.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) {
        const reminder: Reminder = {
          id: `birthday_${customer.id}_${thisYear.getFullYear()}`,
          customerId: customer.id,
          type: 'birthday',
          title: `生日提醒：${customer.name}`,
          description: `${customer.name}的生日是${thisYear.toLocaleDateString()}，记得送上祝福！`,
          reminderDate: thisYear,
          completed: false,
          createdAt: now
        }
        reminders.push(reminder)
      }
    }

    if (customer.lastContactDate) {
      const lastContact = new Date(customer.lastContactDate)
      const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
      
      let maxDays = 7
      if (customer.importance === 'high') maxDays = 3
      if (customer.importance === 'medium') maxDays = 7
      if (customer.importance === 'low') maxDays = 14

      if (daysSinceContact >= maxDays && !customer.nextFollowUpDate) {
        const reminder: Reminder = {
          id: `longterm_${customer.id}_${Date.now()}`,
          customerId: customer.id,
          type: 'follow_up',
          title: `长时间未联系：${customer.name}`,
          description: `已经${daysSinceContact}天未联系客户${customer.name}（${customer.company}），建议主动跟进`,
          reminderDate: now,
          completed: false,
          createdAt: now
        }
        reminders.push(reminder)
      }
    }
  })

  return reminders
}

export const getBestContactTime = (customer: Customer): string => {
  const hour = new Date().getHours()
  
  if (customer.industry === '金融' || customer.industry === '房地产') {
    if (hour >= 9 && hour < 11) return '现在是联系的好时机（工作时间早期）'
    if (hour >= 14 && hour < 16) return '现在是联系的好时机（下午时段）'
  }
  
  if (customer.industry === '互联网' || customer.industry === '教育') {
    if (hour >= 10 && hour < 12) return '现在是联系的好时机（上午工作时间）'
    if (hour >= 15 && hour < 17) return '现在是联系的好时机（下午工作时间）'
  }
  
  if (hour >= 9 && hour < 18) {
    return '工作时间，适合联系'
  } else if (hour >= 19 && hour < 21) {
    return '晚间时间，可考虑微信联系'
  } else {
    return '非工作时间，建议明天联系'
  }
}

export const getContactFrequency = (customer: Customer): { days: number; reason: string } => {
  const importance = customer.importance
  const status = customer.status
  
  if (status === 'negotiating') {
    return { days: 1, reason: '洽谈阶段需密切跟进' }
  }
  
  if (status === 'contacted') {
    if (importance === 'high') return { days: 2, reason: '重要客户需要频繁跟进' }
    if (importance === 'medium') return { days: 3, reason: '中等重要客户定期跟进' }
    return { days: 5, reason: '普通客户适度跟进' }
  }
  
  if (status === 'prospect') {
    if (importance === 'high') return { days: 3, reason: '重要潜在客户需要关注' }
    if (importance === 'medium') return { days: 7, reason: '中等潜在客户定期联系' }
    return { days: 14, reason: '普通潜在客户定期维护' }
  }
  
  if (status === 'closed') {
    return { days: 30, reason: '已成交客户维护关系' }
  }
  
  return { days: 7, reason: '标准跟进频率' }
}

export const generateSmartReminder = (customer: Customer): Reminder => {
  const now = new Date()
  const frequency = getContactFrequency(customer)
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + frequency.days)
  
  return {
    id: `smart_${customer.id}_${Date.now()}`,
    customerId: customer.id,
    type: 'follow_up',
    title: `智能提醒：跟进${customer.name}`,
    description: `${frequency.reason}，建议${frequency.days}天内联系客户${customer.name}（${customer.company}）`,
    reminderDate: nextDate,
    completed: false,
    createdAt: now
  }
}