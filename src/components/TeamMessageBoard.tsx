import React, { useState } from 'react'
import { Card, List, Avatar, Input, Button, Space, Tag, Typography, Empty } from 'antd'
import { SendOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons'
import { TeamMessage, User, Customer } from '../types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { TextArea } = Input
const { Text } = Typography

interface TeamMessageBoardProps {
  messages: TeamMessage[]
  users: User[]
  customers: Customer[]
  currentUser: User | null
  onSendMessage: (content: string, customerId?: string) => void
  onMarkAsRead: (messageId: string) => void
}

export const TeamMessageBoard: React.FC<TeamMessageBoardProps> = ({
  messages,
  users,
  customers,
  currentUser,
  onSendMessage,
  onMarkAsRead
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>()

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return
    
    onSendMessage(newMessage, selectedCustomer)
    setNewMessage('')
    setSelectedCustomer(undefined)
  }

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId)
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'orange'
      case 'assignment': return 'blue'
      case 'message': return 'default'
      default: return 'default'
    }
  }

  const getMessageTypeText = (type: string) => {
    switch (type) {
      case 'transfer': return '客户转交'
      case 'assignment': return '客户分配'
      case 'message': return '消息'
      default: return type
    }
  }

  const isUnread = (message: TeamMessage) => {
    return currentUser && !message.readBy.includes(currentUser.id)
  }

  return (
    <div>
      {/* 发送消息区域 */}
      <Card style={{ marginBottom: 16 }} title="发送消息">
        <div style={{ marginBottom: 12 }}>
          <TextArea
            rows={3}
            placeholder="输入消息内容..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onPressEnter={(e) => {
              if (e.ctrlKey || e.metaKey) {
                handleSendMessage()
              }
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Ctrl+Enter 快速发送
          </Text>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            发送
          </Button>
        </div>
      </Card>

      {/* 消息列表 */}
      <Card title={`团队消息 (${messages.length})`}>
        {messages.length === 0 ? (
          <Empty description="暂无团队消息" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={messages}
            renderItem={(message) => {
              const user = getUserById(message.userId)
              const customer = message.customerId ? getCustomerById(message.customerId) : null
              const unread = isUnread(message)
              
              return (
                <List.Item
                  style={{
                    backgroundColor: unread ? '#f0f9ff' : 'transparent',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: unread ? '1px solid #e6f7ff' : '1px solid transparent'
                  }}
                  onClick={() => {
                    if (unread && currentUser) {
                      onMarkAsRead(message.id)
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Avatar 
                      src={user?.avatar} 
                      icon={!user?.avatar && <UserOutlined />}
                      size="small"
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong>{user?.name || '未知用户'}</Text>
                        <Tag color={getMessageTypeColor(message.type)} size="small">
                          {getMessageTypeText(message.type)}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(message.createdAt).fromNow()}
                        </Text>
                        {unread && (
                          <Tag color="red" size="small">未读</Tag>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: 8 }}>
                        <Text>{message.content}</Text>
                      </div>
                      
                      {customer && (
                        <div style={{ padding: '8px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            相关客户：{customer.name} - {customer.company}
                          </Text>
                        </div>
                      )}
                      
                      <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                        已读：{message.readBy.length} 人
                      </div>
                    </div>
                  </div>
                </List.Item>
              )
            }}
          />
        )}
      </Card>
    </div>
  )
}