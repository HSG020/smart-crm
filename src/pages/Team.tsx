import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Button, Space, Modal, message, Tabs, Select, Table, Tag, Avatar } from 'antd'
import { PlusOutlined, UserAddOutlined, MessageOutlined, TrophyOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { TeamMemberCard } from '../components/TeamMemberCard'
import { TeamMemberForm } from '../components/TeamMemberForm'
import { TeamMessageBoard } from '../components/TeamMessageBoard'
import { useTeamStore } from '../store/teamStore'
import { useCustomerStore } from '../store/customerStore'
import { useOpportunityStore } from '../store/opportunityStore'
import { User, TeamMessage } from '../types'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { Option } = Select

export const Team: React.FC = () => {
  const {
    users,
    messages,
    conflicts,
    currentUser,
    loading,
    loadUsers,
    loadMessages,
    loadConflicts,
    addMessage,
    markMessageAsRead,
    setCurrentUser
  } = useTeamStore()

  const { customers, loadCustomers } = useCustomerStore()
  const { opportunities, loadOpportunities } = useOpportunityStore()

  const [activeTab, setActiveTab] = useState('members')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState<User | undefined>()

  useEffect(() => {
    loadUsers()
    loadMessages()
    loadConflicts()
    loadCustomers()
    loadOpportunities()
  }, [loadUsers, loadMessages, loadConflicts, loadCustomers, loadOpportunities])

  // 如果还没有设置当前用户，默认设置第一个用户
  useEffect(() => {
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0])
    }
  }, [users, currentUser, setCurrentUser])

  const handleSendMessage = async (content: string, customerId?: string) => {
    if (!currentUser) return
    
    const newMessage: TeamMessage = {
      id: `msg_${Date.now()}`,
      userId: currentUser.id,
      customerId,
      content,
      type: 'message',
      createdAt: new Date(),
      readBy: [currentUser.id] // 发送者自动标记为已读
    }

    try {
      await addMessage(newMessage)
      message.success('消息发送成功')
    } catch (error) {
      message.error('发送失败，请重试')
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    if (!currentUser) return
    
    try {
      await markMessageAsRead(messageId, currentUser.id)
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }

  const handleAssignCustomer = (userId: string) => {
    setSelectedUserId(userId)
    setShowAssignModal(true)
  }

  const handleAddMemberClick = () => {
    console.debug('添加成员按钮被点击')
    setEditingMember(undefined)
    setShowMemberForm(true)
    message.open({ type: 'info', content: '正在打开添加成员表单', duration: 1.5 })
  }

  // 计算团队业绩排行
  const getTeamRankings = () => {
    return users.map(user => {
      // 模拟计算每个用户的业绩数据
      const userOpportunities = opportunities.filter(() => Math.random() > 0.7) // 简化模拟
      const closedWon = userOpportunities.filter(o => o.stage === 'closed_won')
      const totalValue = closedWon.reduce((sum, o) => sum + o.value, 0)
      
      return {
        user,
        opportunityCount: userOpportunities.length,
        closedWonCount: closedWon.length,
        totalValue,
        conversionRate: userOpportunities.length > 0 ? (closedWon.length / userOpportunities.length * 100) : 0
      }
    }).sort((a, b) => b.totalValue - a.totalValue)
  }

  const teamRankings = getTeamRankings()

  // 获取未读消息数量
  const getUnreadCount = () => {
    if (!currentUser) return 0
    return messages.filter(msg => !msg.readBy.includes(currentUser.id)).length
  }

  const rankingColumns = [
    {
      title: '排名',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {index < 3 && <TrophyOutlined style={{ color: ['#f5222d', '#faad14', '#fa8c16'][index] }} />}
          <span style={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
            {index + 1}
          </span>
        </div>
      ),
      width: 80
    },
    {
      title: '成员',
      key: 'member',
      render: (record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={record.user.avatar} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.user.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.user.department}</div>
          </div>
        </div>
      )
    },
    {
      title: '销售机会',
      dataIndex: 'opportunityCount',
      key: 'opportunityCount'
    },
    {
      title: '成交数量',
      dataIndex: 'closedWonCount',
      key: 'closedWonCount'
    },
    {
      title: '成交金额',
      key: 'totalValue',
      render: (record: any) => `¥${record.totalValue.toLocaleString()}`,
      sorter: (a: any, b: any) => a.totalValue - b.totalValue
    },
    {
      title: '成交率',
      key: 'conversionRate',
      render: (record: any) => (
        <Tag color={record.conversionRate > 50 ? 'green' : 'orange'}>
          {record.conversionRate.toFixed(1)}%
        </Tag>
      ),
      sorter: (a: any, b: any) => a.conversionRate - b.conversionRate
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* 顶部统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {users.length}
              </div>
              <div style={{ color: '#666' }}>团队成员</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {messages.length}
              </div>
              <div style={{ color: '#666' }}>团队消息</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {getUnreadCount()}
              </div>
              <div style={{ color: '#666' }}>未读消息</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                {conflicts.length}
              </div>
              <div style={{ color: '#666' }}>客户冲突</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 当前用户选择器 */}
      {users.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <Space>
            <span>当前身份：</span>
            <Select
              value={currentUser?.id}
              onChange={(userId) => {
                const user = users.find(u => u.id === userId)
                if (user) setCurrentUser(user)
              }}
              style={{ width: 200 }}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <Space>
                    <Avatar src={user.avatar} size="small" />
                    {user.name} - {user.role === 'admin' ? '管理员' : user.role === 'manager' ? '经理' : '销售'}
                  </Space>
                </Option>
              ))}
            </Select>
          </Space>
        </Card>
      )}

      {/* 主要内容区域 */}
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'members',
            label: (
              <span>
                <UserAddOutlined />
                团队成员
              </span>
            ),
            children: (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddMemberClick}
                  >
                    添加成员
                  </Button>
                </Space>
                
                <Row gutter={[16, 16]}>
                  {users.map(user => (
                    <Col span={24} key={user.id}>
                      <TeamMemberCard
                        user={user}
                        customers={customers}
                        opportunities={opportunities}
                        onEdit={() => message.info('编辑功能开发中')}
                        onDelete={() => message.info('删除功能需要权限验证')}
                        onAssignCustomer={handleAssignCustomer}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )
          },
          {
            key: 'messages',
            label: (
              <span>
                <MessageOutlined />
                团队消息
                {getUnreadCount() > 0 && (
                  <span style={{ 
                    backgroundColor: '#f5222d', 
                    color: 'white', 
                    borderRadius: '10px', 
                    padding: '0 6px', 
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}>
                    {getUnreadCount()}
                  </span>
                )}
              </span>
            ),
            children: (
              <TeamMessageBoard
                messages={messages}
                users={users}
                customers={customers}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onMarkAsRead={handleMarkAsRead}
              />
            )
          },
          {
            key: 'rankings',
            label: (
              <span>
                <TrophyOutlined />
                业绩排行
              </span>
            ),
            children: (
              <Card title="团队业绩排行榜">
                <Table
                  columns={rankingColumns}
                  dataSource={teamRankings}
                  rowKey={(record) => record.user.id}
                  pagination={false}
                  size="middle"
                />
              </Card>
            )
          },
          {
            key: 'conflicts',
            label: (
              <span>
                <ExclamationCircleOutlined />
                客户冲突
                {conflicts.length > 0 && (
                  <span style={{ 
                    backgroundColor: '#faad14', 
                    color: 'white', 
                    borderRadius: '10px', 
                    padding: '0 6px', 
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}>
                    {conflicts.length}
                  </span>
                )}
              </span>
            ),
            children: (
              <Card title="客户分配冲突">
                {conflicts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                    <ExclamationCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>暂无客户冲突</div>
                  </div>
                ) : (
                  <div>冲突检测功能开发中...</div>
                )}
              </Card>
            )
          }
        ]}
      />

      {/* 客户分配模态框 */}
      <Modal
        title="分配客户"
        open={showAssignModal}
        onCancel={() => setShowAssignModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ padding: '16px 0' }}>
          <p>客户分配功能开发中，将支持：</p>
          <ul>
            <li>选择要分配的客户</li>
            <li>设置分配原因和备注</li>
            <li>发送分配通知</li>
            <li>记录分配历史</li>
          </ul>
        </div>
      </Modal>

      {/* 团队成员表单 */}
      <TeamMemberForm
        visible={showMemberForm}
        onCancel={() => {
          setShowMemberForm(false)
          setEditingMember(undefined)
        }}
        member={editingMember}
      />
    </div>
  )
}