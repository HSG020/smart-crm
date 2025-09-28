import React from 'react'
import { Timeline, Card, Tag, Avatar, Typography, Space, Button, Tooltip } from 'antd'
import { 
  PhoneOutlined, 
  MailOutlined, 
  TeamOutlined, 
  MessageOutlined,
  EnvironmentOutlined,
  EditOutlined,
  DeleteOutlined,
  PaperClipOutlined
} from '@ant-design/icons'
import { Communication, Customer } from '../types'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

interface CommunicationTimelineProps {
  communications: Communication[]
  customers: Customer[]
  onEdit: (communication: Communication) => void
  onDelete: (id: string) => void
}

export const CommunicationTimeline: React.FC<CommunicationTimelineProps> = ({
  communications,
  customers,
  onEdit,
  onDelete
}) => {
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    return customer ? `${customer.name} (${customer.company})` : '未知客户'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneOutlined style={{ color: '#1890ff' }} />
      case 'email': return <MailOutlined style={{ color: '#faad14' }} />
      case 'meeting': return <TeamOutlined style={{ color: '#52c41a' }} />
      case 'wechat': return <MessageOutlined style={{ color: '#13c2c2' }} />
      case 'visit': return <EnvironmentOutlined style={{ color: '#722ed1' }} />
      default: return <MessageOutlined />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'call': return '电话'
      case 'email': return '邮件'
      case 'meeting': return '会议'
      case 'wechat': return '微信'
      case 'visit': return '拜访'
      default: return '其他'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'blue'
      case 'email': return 'orange'
      case 'meeting': return 'green'
      case 'wechat': return 'cyan'
      case 'visit': return 'purple'
      default: return 'default'
    }
  }

  const timelineItems = communications.map(comm => ({
    dot: (
      <Avatar 
        size="small" 
        icon={getTypeIcon(comm.type)}
        style={{ backgroundColor: '#fff', border: '2px solid #d9d9d9' }}
      />
    ),
    children: (
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Tag color={getTypeColor(comm.type)} style={{ marginRight: 8 }}>
                {getTypeText(comm.type)}
              </Tag>
              <Text strong>{getCustomerName(comm.customerId)}</Text>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                {dayjs(comm.createdAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#262626' }}>沟通内容：</Text>
              <Paragraph style={{ margin: 0, marginTop: 4 }}>
                {comm.content}
              </Paragraph>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#262626' }}>沟通结果：</Text>
              <Paragraph style={{ margin: 0, marginTop: 4 }}>
                {comm.result}
              </Paragraph>
            </div>
            
            {comm.nextAction && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ color: '#262626' }}>下一步行动：</Text>
                <Paragraph style={{ margin: 0, marginTop: 4, color: '#1890ff' }}>
                  {comm.nextAction}
                </Paragraph>
              </div>
            )}
            
            {comm.attachments && comm.attachments.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">
                  <PaperClipOutlined /> 附件：{comm.attachments.length} 个文件
                </Text>
              </div>
            )}
          </div>
          
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(comm)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(comm.id)}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>
    )
  }))

  if (communications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
        <MessageOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
        <div>暂无沟通记录</div>
      </div>
    )
  }

  return <Timeline items={timelineItems} />
}
