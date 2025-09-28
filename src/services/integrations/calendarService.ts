/**
 * 日历服务集成
 * 管理会议、事件、提醒等日程安排
 */

import dayjs, { Dayjs } from 'dayjs'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  allDay: boolean
  type: 'meeting' | 'call' | 'task' | 'reminder' | 'holiday'
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  priority: 'low' | 'medium' | 'high'
  category: 'sales' | 'support' | 'internal' | 'personal'
  attendees?: EventAttendee[]
  reminders?: EventReminder[]
  recurrence?: RecurrenceRule
  customerId?: string
  customerName?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}

export interface EventAttendee {
  email: string
  name: string
  role: 'organizer' | 'required' | 'optional'
  status: 'pending' | 'accepted' | 'declined' | 'tentative'
}

export interface EventReminder {
  type: 'email' | 'popup' | 'sms'
  minutesBefore: number
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  daysOfWeek?: number[] // 0-6, 0=Sunday
  dayOfMonth?: number
  endDate?: Date
  occurrences?: number
}

export interface CalendarView {
  type: 'day' | 'week' | 'month' | 'agenda'
  date: Date
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

/**
 * 日历服务类
 */
export class CalendarService {
  private events: Map<string, CalendarEvent> = new Map()
  private workingHours = {
    start: 9,  // 9:00 AM
    end: 18,   // 6:00 PM
    days: [1, 2, 3, 4, 5] // Monday to Friday
  }

  constructor() {
    this.initializeSampleEvents()
  }

  /**
   * 初始化示例事件
   */
  private initializeSampleEvents() {
    const now = dayjs()

    const sampleEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        title: '客户演示会议',
        description: '产品功能演示和Q&A',
        location: '腾讯会议室',
        startTime: now.add(1, 'day').hour(10).minute(0).toDate(),
        endTime: now.add(1, 'day').hour(11).minute(30).toDate(),
        allDay: false,
        type: 'meeting',
        status: 'confirmed',
        priority: 'high',
        category: 'sales',
        attendees: [
          {
            email: 'manager@company.com',
            name: '销售经理',
            role: 'organizer',
            status: 'accepted'
          },
          {
            email: 'customer@client.com',
            name: '客户代表',
            role: 'required',
            status: 'accepted'
          }
        ],
        reminders: [
          { type: 'email', minutesBefore: 60 },
          { type: 'popup', minutesBefore: 15 }
        ],
        customerId: 'customer-1',
        customerName: '重要客户A',
        createdBy: 'user-1',
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      },
      {
        id: 'event-2',
        title: '季度销售回顾',
        description: '回顾Q1销售业绩和Q2计划',
        location: '会议室A',
        startTime: now.add(2, 'day').hour(14).minute(0).toDate(),
        endTime: now.add(2, 'day').hour(16).minute(0).toDate(),
        allDay: false,
        type: 'meeting',
        status: 'scheduled',
        priority: 'medium',
        category: 'internal',
        reminders: [
          { type: 'email', minutesBefore: 1440 } // 24 hours before
        ],
        createdBy: 'user-1',
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      },
      {
        id: 'event-3',
        title: '客户跟进电话',
        startTime: now.hour(15).minute(30).toDate(),
        endTime: now.hour(16).minute(0).toDate(),
        allDay: false,
        type: 'call',
        status: 'scheduled',
        priority: 'medium',
        category: 'sales',
        customerId: 'customer-2',
        customerName: '潜在客户B',
        createdBy: 'user-1',
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      }
    ]

    sampleEvents.forEach(event => {
      this.events.set(event.id, event)
    })
  }

  /**
   * 创建事件
   */
  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const eventId = `event-${Date.now()}`

    const newEvent: CalendarEvent = {
      id: eventId,
      title: event.title || '未命名事件',
      startTime: event.startTime || new Date(),
      endTime: event.endTime || dayjs(event.startTime).add(1, 'hour').toDate(),
      allDay: event.allDay || false,
      type: event.type || 'meeting',
      status: 'scheduled',
      priority: event.priority || 'medium',
      category: event.category || 'sales',
      createdBy: event.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...event
    }

    // 检查时间冲突
    const conflicts = this.checkConflicts(newEvent)
    if (conflicts.length > 0 && !event.metadata?.ignoreConflicts) {
      throw new Error(`时间冲突：与 ${conflicts.length} 个事件冲突`)
    }

    this.events.set(eventId, newEvent)

    // 设置提醒（实际应该使用任务队列）
    if (newEvent.reminders) {
      this.scheduleReminders(newEvent)
    }

    return newEvent
  }

  /**
   * 更新事件
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event = this.events.get(eventId)
    if (!event) {
      throw new Error(`事件 ${eventId} 不存在`)
    }

    const updatedEvent: CalendarEvent = {
      ...event,
      ...updates,
      updatedAt: new Date()
    }

    this.events.set(eventId, updatedEvent)
    return updatedEvent
  }

  /**
   * 取消事件
   */
  async cancelEvent(eventId: string): Promise<void> {
    const event = this.events.get(eventId)
    if (!event) {
      throw new Error(`事件 ${eventId} 不存在`)
    }

    event.status = 'cancelled'
    event.updatedAt = new Date()

    // 通知参与者（模拟）
    if (event.attendees) {
      console.log(`通知 ${event.attendees.length} 位参与者事件已取消`)
    }
  }

  /**
   * 获取事件列表
   */
  getEvents(filter?: {
    startDate?: Date
    endDate?: Date
    type?: CalendarEvent['type']
    status?: CalendarEvent['status']
    customerId?: string
  }): CalendarEvent[] {
    let events = Array.from(this.events.values())

    if (filter) {
      if (filter.startDate && filter.endDate) {
        events = events.filter(e =>
          e.startTime >= filter.startDate! &&
          e.startTime <= filter.endDate!
        )
      }
      if (filter.type) {
        events = events.filter(e => e.type === filter.type)
      }
      if (filter.status) {
        events = events.filter(e => e.status === filter.status)
      }
      if (filter.customerId) {
        events = events.filter(e => e.customerId === filter.customerId)
      }
    }

    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  /**
   * 获取今日事件
   */
  getTodayEvents(): CalendarEvent[] {
    const today = dayjs()
    return this.getEvents({
      startDate: today.startOf('day').toDate(),
      endDate: today.endOf('day').toDate()
    })
  }

  /**
   * 获取本周事件
   */
  getWeekEvents(date: Date = new Date()): CalendarEvent[] {
    const week = dayjs(date)
    return this.getEvents({
      startDate: week.startOf('week').toDate(),
      endDate: week.endOf('week').toDate()
    })
  }

  /**
   * 获取本月事件
   */
  getMonthEvents(date: Date = new Date()): CalendarEvent[] {
    const month = dayjs(date)
    return this.getEvents({
      startDate: month.startOf('month').toDate(),
      endDate: month.endOf('month').toDate()
    })
  }

  /**
   * 检查时间冲突
   */
  checkConflicts(event: CalendarEvent): CalendarEvent[] {
    const conflicts: CalendarEvent[] = []

    this.events.forEach(existingEvent => {
      if (existingEvent.id === event.id) return
      if (existingEvent.status === 'cancelled') return

      const overlap = (
        event.startTime < existingEvent.endTime &&
        event.endTime > existingEvent.startTime
      )

      if (overlap) {
        conflicts.push(existingEvent)
      }
    })

    return conflicts
  }

  /**
   * 查找可用时间段
   */
  findAvailableSlots(
    date: Date,
    duration: number, // 分钟
    constraints?: {
      startHour?: number
      endHour?: number
      excludeWeekends?: boolean
    }
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const day = dayjs(date)

    // 使用工作时间或自定义约束
    const startHour = constraints?.startHour || this.workingHours.start
    const endHour = constraints?.endHour || this.workingHours.end

    // 检查是否是周末
    if (constraints?.excludeWeekends && (day.day() === 0 || day.day() === 6)) {
      return []
    }

    // 获取当天的所有事件
    const dayEvents = this.getEvents({
      startDate: day.startOf('day').toDate(),
      endDate: day.endOf('day').toDate()
    }).filter(e => e.status !== 'cancelled')

    // 生成时间段
    let currentTime = day.hour(startHour).minute(0)
    const endTime = day.hour(endHour).minute(0)

    while (currentTime.add(duration, 'minute').isBefore(endTime) ||
           currentTime.add(duration, 'minute').isSame(endTime)) {
      const slotStart = currentTime.toDate()
      const slotEnd = currentTime.add(duration, 'minute').toDate()

      // 检查是否与现有事件冲突
      const hasConflict = dayEvents.some(event =>
        (slotStart < event.endTime && slotEnd > event.startTime)
      )

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !hasConflict
      })

      currentTime = currentTime.add(30, 'minute') // 30分钟间隔
    }

    return slots
  }

  /**
   * 智能日程建议
   */
  suggestMeetingTime(
    duration: number,
    attendees: string[],
    preferences?: {
      preferredDays?: number[]
      preferredHours?: number[]
      avoidLunch?: boolean
    }
  ): TimeSlot[] {
    const suggestions: TimeSlot[] = []
    const today = dayjs()

    // 查找未来7天的可用时间
    for (let i = 1; i <= 7; i++) {
      const date = today.add(i, 'day')

      // 跳过周末
      if (date.day() === 0 || date.day() === 6) continue

      // 检查是否是首选日期
      if (preferences?.preferredDays &&
          !preferences.preferredDays.includes(date.day())) {
        continue
      }

      const availableSlots = this.findAvailableSlots(
        date.toDate(),
        duration,
        { excludeWeekends: true }
      ).filter(slot => slot.available)

      // 过滤首选时间
      let filteredSlots = availableSlots
      if (preferences?.preferredHours) {
        filteredSlots = availableSlots.filter(slot => {
          const hour = dayjs(slot.start).hour()
          return preferences.preferredHours!.includes(hour)
        })
      }

      // 避开午餐时间
      if (preferences?.avoidLunch) {
        filteredSlots = filteredSlots.filter(slot => {
          const hour = dayjs(slot.start).hour()
          return hour < 12 || hour >= 14
        })
      }

      suggestions.push(...filteredSlots.slice(0, 2)) // 每天最多2个建议

      if (suggestions.length >= 5) break // 总共5个建议
    }

    return suggestions
  }

  /**
   * 设置提醒
   */
  private scheduleReminders(event: CalendarEvent) {
    if (!event.reminders) return

    event.reminders.forEach(reminder => {
      const reminderTime = dayjs(event.startTime)
        .subtract(reminder.minutesBefore, 'minute')
        .toDate()

      const delay = reminderTime.getTime() - Date.now()
      if (delay > 0) {
        setTimeout(() => {
          console.log(`提醒: ${event.title} 将在 ${reminder.minutesBefore} 分钟后开始`)
        }, delay)
      }
    })
  }

  /**
   * 获取日历统计
   */
  getCalendarStats(dateRange?: { start: Date; end: Date }): {
    totalEvents: number
    upcomingEvents: number
    completedEvents: number
    cancelledEvents: number
    eventsByType: Record<string, number>
    busyHours: number
  } {
    let events = Array.from(this.events.values())

    if (dateRange) {
      events = events.filter(e =>
        e.startTime >= dateRange.start &&
        e.startTime <= dateRange.end
      )
    }

    const eventsByType: Record<string, number> = {}
    let busyHours = 0

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

      if (event.status !== 'cancelled') {
        const duration = dayjs(event.endTime).diff(event.startTime, 'hour', true)
        busyHours += duration
      }
    })

    return {
      totalEvents: events.length,
      upcomingEvents: events.filter(e =>
        e.status === 'scheduled' || e.status === 'confirmed'
      ).length,
      completedEvents: events.filter(e => e.status === 'completed').length,
      cancelledEvents: events.filter(e => e.status === 'cancelled').length,
      eventsByType,
      busyHours: Math.round(busyHours * 10) / 10
    }
  }

  /**
   * 导出日历（ICS格式）
   */
  exportToICS(events: CalendarEvent[]): string {
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart CRM//Calendar//EN',
      'CALSCALE:GREGORIAN'
    ]

    events.forEach(event => {
      icsLines.push('BEGIN:VEVENT')
      icsLines.push(`UID:${event.id}@smartcrm.com`)
      icsLines.push(`DTSTART:${this.formatICSDate(event.startTime)}`)
      icsLines.push(`DTEND:${this.formatICSDate(event.endTime)}`)
      icsLines.push(`SUMMARY:${event.title}`)

      if (event.description) {
        icsLines.push(`DESCRIPTION:${event.description}`)
      }
      if (event.location) {
        icsLines.push(`LOCATION:${event.location}`)
      }

      icsLines.push(`PRIORITY:${event.priority === 'high' ? 1 : event.priority === 'low' ? 9 : 5}`)
      icsLines.push(`STATUS:${event.status.toUpperCase()}`)

      if (event.attendees) {
        event.attendees.forEach(attendee => {
          icsLines.push(`ATTENDEE;CN=${attendee.name};PARTSTAT=${attendee.status.toUpperCase()}:mailto:${attendee.email}`)
        })
      }

      icsLines.push('END:VEVENT')
    })

    icsLines.push('END:VCALENDAR')

    return icsLines.join('\r\n')
  }

  private formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }
}

// 导出单例
export const calendarService = new CalendarService()