import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, Typography, Modal, Progress, Space } from 'antd'
import { UserOutlined, BellOutlined, MessageOutlined, TrophyOutlined, ThunderboltOutlined, ExperimentOutlined } from '@ant-design/icons'
import { useCustomerStore } from '../store/customerStore'
import { useReminderStore } from '../store/reminderStore'
import { useCommunicationStore } from '../store/communicationStore'
import { useOpportunityStore } from '../store/opportunityStore'
import { useFeedbackStore } from '../store/feedbackStore'
import { generateAllDemoData } from '../utils/demoDataGenerator'

const { Title, Paragraph } = Typography

interface WelcomeProps {
  onNavigate?: (key: string) => void
}

export const Welcome: React.FC<WelcomeProps> = ({ onNavigate }) => {
  const { customers, loadCustomers, addCustomer } = useCustomerStore()
  const { reminders, loadReminders, getTodayReminders, getOverdueReminders, addReminder } = useReminderStore()
  const { communications, loadCommunications, addCommunication } = useCommunicationStore()
  const { opportunities, loadOpportunities, addOpportunity } = useOpportunityStore()
  const feedback = useFeedbackStore()
  const [loading, setLoading] = useState(true)
  const [generateModalVisible, setGenerateModalVisible] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          loadCustomers(),
          loadReminders(),
          loadCommunications(),
          loadOpportunities()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [loadCustomers, loadReminders, loadCommunications, loadOpportunities])

  // 生成演示数据
  const handleGenerateDemoData = async () => {
    setGenerating(true)
    setGenerateProgress(0)

    try {
      const demoData = generateAllDemoData()

      // 分步骤添加数据，显示进度
      setGenerateProgress(10)
      feedback.info('开始生成演示数据...')

      // 添加客户
      for (let i = 0; i < demoData.customers.length; i++) {
        await addCustomer(demoData.customers[i], { silent: true })
        setGenerateProgress(10 + (i / demoData.customers.length) * 30)
      }

      // 重新加载客户以获取ID
      await loadCustomers()
      const updatedCustomers = useCustomerStore.getState().customers

      setGenerateProgress(40)

      // 添加提醒
      for (let i = 0; i < Math.min(demoData.reminders.length, updatedCustomers.length * 2); i++) {
        const customer = updatedCustomers[i % updatedCustomers.length]
        const reminder = {
          ...demoData.reminders[i],
          customerId: customer.id,
          customerName: customer.name
        }
        await addReminder(reminder)
        setGenerateProgress(40 + (i / demoData.reminders.length) * 20)
      }

      setGenerateProgress(60)

      // 添加沟通记录
      for (let i = 0; i < Math.min(demoData.communications.length, updatedCustomers.length * 3); i++) {
        const customer = updatedCustomers[i % updatedCustomers.length]
        const communication = {
          ...demoData.communications[i],
          customerId: customer.id,
          customerName: customer.name
        }
        await addCommunication(communication)
        setGenerateProgress(60 + (i / demoData.communications.length) * 20)
      }

      setGenerateProgress(80)

      // 添加销售机会
      for (let i = 0; i < Math.min(demoData.opportunities.length, updatedCustomers.length); i++) {
        const customer = updatedCustomers[i]
        const opportunity = {
          ...demoData.opportunities[i],
          customerId: customer.id,
          customerName: customer.name
        }
        await addOpportunity(opportunity)
        setGenerateProgress(80 + (i / demoData.opportunities.length) * 20)
      }

      setGenerateProgress(100)

      // 重新加载所有数据
      await Promise.all([
        loadCustomers(),
        loadReminders(),
        loadCommunications(),
        loadOpportunities()
      ])

      feedback.success('演示数据生成成功！', `已创建 ${demoData.stats.totalCustomers} 个客户和相关数据`)
      setGenerateModalVisible(false)
    } catch (error) {
      console.error('Failed to generate demo data:', error)
      feedback.error('生成演示数据失败', '请检查网络连接和数据库配置')
    } finally {
      setGenerating(false)
      setGenerateProgress(0)
    }
  }

  const pendingReminders = [...getTodayReminders(), ...getOverdueReminders()].length
  const opportunityCount = customers.filter(c => c.status === 'following' || c.status === 'potential').length

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1} style={{ color: '#1890ff' }}>
          欢迎使用智能客户关系管理系统
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          专门解决客户跟进遗漏问题的智能CRM系统，帮助销售人员更好地管理客户关系，提高成交率
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="客户总数"
              value={customers.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待跟进"
              value={pendingReminders}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="沟通记录"
              value={communications.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="成交机会"
              value={opportunityCount}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <Title level={3}>快速开始</Title>
        {customers.length === 0 && (
          <Card
            style={{
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            <Row align="middle" gutter={24}>
              <Col flex="1">
                <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
                  <ThunderboltOutlined /> 快速体验系统功能
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 0 }}>
                  一键生成演示数据，包含客户、提醒、沟通记录等，让您快速了解系统的强大功能
                </Paragraph>
              </Col>
              <Col>
                <Button
                  size="large"
                  icon={<ExperimentOutlined />}
                  onClick={() => setGenerateModalVisible(true)}
                  style={{ fontWeight: 'bold' }}
                >
                  生成演示数据
                </Button>
              </Col>
            </Row>
          </Card>
        )}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <UserOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>添加客户</Title>
              <Paragraph>开始录入您的客户信息，建立完整的客户档案</Paragraph>
              <Button type="primary" onClick={() => onNavigate?.('customers')}>立即开始</Button>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <BellOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={4}>设置提醒</Title>
              <Paragraph>智能提醒系统帮您不错过任何重要的客户跟进</Paragraph>
              <Button type="primary" onClick={() => onNavigate?.('reminders')}>查看提醒</Button>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <MessageOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4}>记录沟通</Title>
              <Paragraph>详细记录每次沟通内容，建立完整的客户交流历史</Paragraph>
              <Button type="primary" onClick={() => onNavigate?.('communications')}>添加记录</Button>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <TrophyOutlined style={{ fontSize: '32px', color: '#eb2f96', marginBottom: '16px' }} />
              <Title level={4}>销售机会</Title>
              <Paragraph>跟踪销售机会，提高成交转化率</Paragraph>
              <Button type="primary" onClick={() => onNavigate?.('sales')}>查看机会</Button>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            <ExperimentOutlined />
            <span>生成演示数据</span>
          </Space>
        }
        open={generateModalVisible}
        onCancel={() => !generating && setGenerateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setGenerateModalVisible(false)} disabled={generating}>
            取消
          </Button>,
          <Button
            key="generate"
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={generating}
            onClick={handleGenerateDemoData}
          >
            {generating ? '生成中...' : '开始生成'}
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Paragraph>
            即将为您生成以下演示数据：
          </Paragraph>
          <ul>
            <li>20个示例客户（包含完整信息）</li>
            <li>30条跟进提醒（不同类型）</li>
            <li>50条沟通记录（多种渠道）</li>
            <li>15个销售机会（不同阶段）</li>
          </ul>
          {generating && (
            <>
              <Progress percent={generateProgress} status="active" />
              <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                正在生成数据，请稍候...
              </Paragraph>
            </>
          )}
          <Paragraph type="warning">
            注意：演示数据仅用于测试和演示，您可以随时删除这些数据。
          </Paragraph>
        </Space>
      </Modal>
    </div>
  )
}