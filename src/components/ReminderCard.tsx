import React from 'react'
import { Card, Tag, Button, Space, Avatar, Typography, Tooltip } from 'antd'
import { 
  CheckOutlined, 
  ClockCircleOutlined, 
  PhoneOutlined,
  MessageOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons'
import { Reminder, Customer } from '../types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text, Paragraph } = Typography

interface ReminderCardProps {
  reminder: Reminder
  customer?: Customer
  onComplete: (id: string) => void
  onEdit: (reminder: Reminder) => void
  onContact: (customer: Customer, type: 'phone' | 'message') => void
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  customer,
  onComplete,
  onEdit,
  onContact
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'follow_up': return <PhoneOutlined />
      case 'birthday': return '🎂'
      case 'festival': return '🎊'
      case 'contract': return '📄'
      default: return <ClockCircleOutlined />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'follow_up': return 'blue'
      case 'birthday': return 'magenta'
      case 'festival': return 'orange'
      case 'contract': return 'green'
      default: return 'default'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'follow_up': return '跟进提醒'
      case 'birthday': return '生日提醒'
      case 'festival': return '节日提醒'
      case 'contract': return '合同提醒'
      default: return '其他提醒'
    }
  }

  const isOverdue = dayjs(reminder.reminderDate).isBefore(dayjs(), 'day')
  const isToday = dayjs(reminder.reminderDate).isSame(dayjs(), 'day')

  return (
    <Card
      size="small"
      style={{ 
        marginBottom: 12,
        border: isOverdue ? '1px solid #ff4d4f' : isToday ? '1px solid #faad14' : undefined,
        backgroundColor: reminder.completed ? '#f6f6f6' : undefined
      }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Avatar size="small" style={{ marginRight: 8, backgroundColor: '#1890ff' }}>
              {customer ? customer.name.charAt(0) : '?'}
            </Avatar>
            <div>
              <Text strong style={{ 
                textDecoration: reminder.completed ? 'line-through' : 'none',
                color: reminder.completed ? '#999' : undefined
              }}>
                {reminder.title}
              </Text>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {customer ? `${customer.name} - ${customer.company}` : '客户信息不存在'}
              </div>
            </div>
          </div>
          
          <Paragraph 
            style={{ 
              margin: 0, 
              fontSize: '13px',
              color: reminder.completed ? '#999' : '#666'
            }}
          >
            {reminder.description}
          </Paragraph>
          
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag 
              icon={getTypeIcon(reminder.type)} 
              color={getTypeColor(reminder.type)}
              size="small"
            >
              {getTypeText(reminder.type)}
            </Tag>
            
            <span style={{ fontSize: '12px', color: '#999' }}>
              {isOverdue && !reminder.completed && (
                <Text type="danger">
                  <ExclamationCircleOutlined /> 已逾期 {dayjs(reminder.reminderDate).fromNow()}
                </Text>
              )}
              {isToday && !reminder.completed && (
                <Text type="warning">
                  <ClockCircleOutlined /> 今天
                </Text>
              )}
              {!isOverdue && !isToday && (
                <Text type="secondary">
                  {dayjs(reminder.reminderDate).format('MM-DD HH:mm')}
                </Text>
              )}
            </span>
          </div>
        </div>
        
        <Space size="small">
          {!reminder.completed && customer && (
            <>
              <Tooltip title="打电话">
                <Button
                  type="text"
                  size="small"
                  icon={<PhoneOutlined />}
                  onClick={() => onContact(customer, 'phone')}
                />
              </Tooltip>
              <Tooltip title="发消息">
                <Button
                  type="text"
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => onContact(customer, 'message')}
                />
              </Tooltip>
              <Tooltip title="标记完成">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => onComplete(reminder.id)}
                />
              </Tooltip>
            </>
          )}
          {reminder.completed && (
            <Tag color="success" size="small">
              已完成
            </Tag>
          )}
        </Space>
      </div>
    </Card>
  )
}