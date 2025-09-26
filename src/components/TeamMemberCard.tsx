import React from 'react'
import { Card, Avatar, Tag, Button, Space, Typography, Progress, Tooltip } from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined, 
  MailOutlined,
  PhoneOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { User, Customer, Opportunity } from '../types'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

interface TeamMemberCardProps {
  user: User
  customers: Customer[]
  opportunities: Opportunity[]
  onEdit: (user: User) => void
  onDelete: (id: string) => void
  onAssignCustomer: (userId: string) => void
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  user,
  customers,
  opportunities,
  onEdit,
  onDelete,
  onAssignCustomer
}) => {
  // 计算团队成员的业绩数据
  const getUserStats = () => {
    // 这里简化处理，实际应用中需要更复杂的关联逻辑
    const userCustomers = customers.filter(c => 
      c.tags?.includes(`负责人:${user.name}`) || 
      Math.random() > 0.7 // 模拟数据
    )
    
    const userOpportunities = opportunities.filter(o => 
      userCustomers.some(c => c.id === o.customerId)
    )
    
    const closedWonOpportunities = userOpportunities.filter(o => o.stage === 'closed_won')
    const totalValue = closedWonOpportunities.reduce((sum, o) => sum + o.value, 0)
    
    const thisMonthOpportunities = closedWonOpportunities.filter(o => 
      dayjs(o.updatedAt).isAfter(dayjs().startOf('month'))
    )
    const monthlyValue = thisMonthOpportunities.reduce((sum, o) => sum + o.value, 0)
    
    return {
      customerCount: userCustomers.length,
      opportunityCount: userOpportunities.length,
      totalValue,
      monthlyValue,
      conversionRate: userOpportunities.length > 0 
        ? (closedWonOpportunities.length / userOpportunities.length * 100) 
        : 0
    }
  }

  const stats = getUserStats()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red'
      case 'manager': return 'blue'
      case 'sales': return 'green'
      default: return 'default'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '管理员'
      case 'manager': return '经理'
      case 'sales': return '销售'
      default: return role
    }
  }

  return (
    <Card
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧头像和基本信息 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
          <Avatar 
            size={64} 
            src={user.avatar} 
            icon={!user.avatar && <UserOutlined />}
            style={{ marginBottom: 8 }}
          />
          <Text strong style={{ textAlign: 'center', marginBottom: 4 }}>
            {user.name}
          </Text>
          <Tag color={getRoleColor(user.role)} size="small">
            {getRoleText(user.role)}
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
            {user.department}
          </Text>
        </div>

        {/* 中间业绩数据 */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <MailOutlined /> {user.email}
            </Text>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.customerCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>负责客户</div>
            </div>
            
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                {stats.opportunityCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>销售机会</div>
            </div>
            
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#faad14' }}>
                ¥{stats.totalValue.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>累计成交</div>
            </div>
            
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
                ¥{stats.monthlyValue.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>本月成交</div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: '12px' }}>成交率</Text>
              <Text strong style={{ fontSize: '12px' }}>{stats.conversionRate.toFixed(1)}%</Text>
            </div>
            <Progress 
              percent={stats.conversionRate} 
              size="small" 
              strokeColor={stats.conversionRate > 50 ? '#52c41a' : '#faad14'}
              showInfo={false}
            />
          </div>
        </div>

        {/* 右侧操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
          <Tooltip title="分配客户">
            <Button
              type="primary"
              size="small"
              icon={<UserOutlined />}
              onClick={() => onAssignCustomer(user.id)}
              block
            >
              分配
            </Button>
          </Tooltip>
          
          <Tooltip title="编辑信息">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(user)}
              block
            >
              编辑
            </Button>
          </Tooltip>
          
          {user.role !== 'admin' && (
            <Tooltip title="删除成员">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(user.id)}
                block
              >
                删除
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  )
}