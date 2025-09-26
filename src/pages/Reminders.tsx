import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, Space, Badge, Tabs, message, Empty, Modal } from 'antd'
import {
  BellOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { ReminderCard } from '../components/ReminderCard'
import { ReminderForm } from '../components/ReminderForm'
import { useReminderStore } from '../store/reminderStore'
import { useCustomerStore } from '../store/customerStore'
import { generateFollowUpReminders, getBestContactTime } from '../utils/reminderUtils'
import { Customer } from '../types'

const { TabPane } = Tabs

export const Reminders: React.FC = () => {
  const {
    reminders,
    loading,
    loadReminders,
    completeReminder,
    addReminder,
    getTodayReminders,
    getOverdueReminders,
    getUpcomingReminders
  } = useReminderStore()

  const { customers, loadCustomers } = useCustomerStore()
  const [activeTab, setActiveTab] = useState('today')
  const [showReminderForm, setShowReminderForm] = useState(false)

  useEffect(() => {
    loadReminders()
    loadCustomers()
  }, [loadReminders, loadCustomers])

  const handleCompleteReminder = async (id: string) => {
    try {
      await completeReminder(id)
      message.success('提醒已标记为完成')
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleContact = (customer: Customer, type: 'phone' | 'message') => {
    const contactTime = getBestContactTime(customer)
    
    if (type === 'phone') {
      window.open(`tel:${customer.phone}`)
      message.info(`正在拨打${customer.name}的电话：${customer.phone}。${contactTime}`)
    } else {
      message.info(`准备联系${customer.name}。${contactTime}`)
    }
  }

  const handleGenerateReminders = async () => {
    try {
      const newReminders = generateFollowUpReminders(customers)
      
      for (const reminder of newReminders) {
        const existing = reminders.find(r => 
          r.customerId === reminder.customerId && 
          r.type === reminder.type &&
          Math.abs(new Date(r.reminderDate).getTime() - new Date(reminder.reminderDate).getTime()) < 24 * 60 * 60 * 1000
        )
        
        if (!existing) {
          await addReminder(reminder)
        }
      }
      
      message.success(`已生成${newReminders.length}个智能提醒`)
    } catch (error) {
      message.error('生成提醒失败，请重试')
    }
  }

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId)
  }

  const todayReminders = getTodayReminders()
  const overdueReminders = getOverdueReminders()
  const upcomingReminders = getUpcomingReminders()

  const stats = {
    total: reminders.filter(r => !r.completed).length,
    overdue: overdueReminders.length,
    today: todayReminders.length,
    upcoming: upcomingReminders.length
  }

  const renderReminderList = (reminderList: any[], emptyText: string) => {
    if (reminderList.length === 0) {
      return <Empty description={emptyText} />
    }

    return reminderList.map(reminder => (
      <ReminderCard
        key={reminder.id}
        reminder={reminder}
        customer={getCustomerById(reminder.customerId)}
        onComplete={handleCompleteReminder}
        onEdit={() => {}}
        onContact={handleContact}
      />
    ))
  }

  return (
    <div style={{ padding: '24px' }}>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理提醒"
              value={stats.total}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期提醒"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日提醒"
              value={stats.today}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="即将到期"
              value={stats.upcoming}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="跟进提醒"
        extra={
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={handleGenerateReminders}
              loading={loading}
            >
              智能生成提醒
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setShowReminderForm(true)
                message.info('正在打开添加提醒表单...')
              }}
            >
              添加提醒
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'today',
              label: (
                <Badge count={stats.today} size="small">
                  <span>今日提醒</span>
                </Badge>
              ),
              children: (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {renderReminderList(todayReminders, '今天没有提醒事项')}
                </div>
              )
            },
            {
              key: 'overdue',
              label: (
                <Badge count={stats.overdue} size="small">
                  <span style={{ color: stats.overdue > 0 ? '#cf1322' : undefined }}>
                    逾期提醒
                  </span>
                </Badge>
              ),
              children: (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {renderReminderList(overdueReminders, '没有逾期的提醒')}
                </div>
              )
            },
            {
              key: 'upcoming',
              label: (
                <Badge count={stats.upcoming} size="small">
                  <span>即将到期</span>
                </Badge>
              ),
              children: (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {renderReminderList(upcomingReminders, '暂无即将到期的提醒')}
                </div>
              )
            },
            {
              key: 'all',
              label: '全部提醒',
              children: (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {renderReminderList(
                    reminders.filter(r => !r.completed).sort((a, b) => 
                      new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
                    ),
                    '暂无提醒事项'
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      <ReminderForm
        visible={showReminderForm}
        onCancel={() => setShowReminderForm(false)}
      />
    </div>
  )
}