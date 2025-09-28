import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Progress, Tag, Tooltip, Typography, List, Avatar, Space, Button, Statistic, Badge } from 'antd'
import {
  HeartOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MessageOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { Customer } from '../types'
import { useCommunicationStore } from '../store/communicationStore'
import { useOpportunityStore } from '../store/opportunityStore'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

interface CustomerHealthAnalysisProps {
  customer: Customer
  onActionClick?: (action: string) => void
}

interface HealthScore {
  overall: number
  engagement: number
  value: number
  risk: number
  activity: number
}

interface ChurnPrediction {
  probability: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
}

interface NextAction {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'offer'
  estimatedImpact: number
}

export const CustomerHealthAnalysis: React.FC<CustomerHealthAnalysisProps> = ({ customer, onActionClick }) => {
  const { communications } = useCommunicationStore()
  const { opportunities } = useOpportunityStore()
  const [loading, setLoading] = useState(false)

  // 计算客户沟通记录
  const customerCommunications = useMemo(() =>
    communications.filter(c => c.customerId === customer.id),
    [communications, customer.id]
  )

  // 计算客户销售机会
  const customerOpportunities = useMemo(() =>
    opportunities.filter(o => o.customerId === customer.id),
    [opportunities, customer.id]
  )

  // 计算健康分数
  const calculateHealthScore = (): HealthScore => {
    let engagement = 0
    let value = 0
    let risk = 0
    let activity = 0

    // 互动分数 (基于沟通频率和最近活动)
    const recentComms = customerCommunications.filter(c =>
      dayjs(c.date).isAfter(dayjs().subtract(30, 'day'))
    ).length
    engagement = Math.min(100, recentComms * 20)

    // 价值分数 (基于客户重要性和机会)
    if (customer.importance === 'high') value += 50
    if (customer.importance === 'medium') value += 30
    if (customer.importance === 'low') value += 10

    const totalOpportunityValue = customerOpportunities.reduce((sum, o) => sum + (o.value || 0), 0)
    value += Math.min(50, totalOpportunityValue / 10000)

    // 风险分数 (基于状态和最后联系时间)
    const daysSinceContact = customer.lastContactDate
      ? dayjs().diff(dayjs(customer.lastContactDate), 'day')
      : 999

    if (daysSinceContact < 7) risk = 90
    else if (daysSinceContact < 14) risk = 70
    else if (daysSinceContact < 30) risk = 50
    else if (daysSinceContact < 60) risk = 30
    else risk = 10

    if (customer.status === 'lost') risk = 0
    if (customer.status === 'signed') risk = 100

    // 活跃度分数
    activity = customerCommunications.length * 10
    activity = Math.min(100, activity)

    // 综合分数
    const overall = Math.round((engagement * 0.3 + value * 0.3 + risk * 0.2 + activity * 0.2))

    return { overall, engagement, value, risk, activity }
  }

  // 预测流失概率
  const predictChurn = (): ChurnPrediction => {
    const factors: string[] = []
    let probability = 0

    // 检查沟通频率
    const daysSinceContact = customer.lastContactDate
      ? dayjs().diff(dayjs(customer.lastContactDate), 'day')
      : 999

    if (daysSinceContact > 60) {
      probability += 40
      factors.push('超过60天未联系')
    } else if (daysSinceContact > 30) {
      probability += 20
      factors.push('超过30天未联系')
    }

    // 检查客户状态
    if (customer.status === 'lost') {
      probability = 100
      factors.push('客户已流失')
    } else if (customer.status === 'potential') {
      probability += 30
      factors.push('仍是潜在客户')
    }

    // 检查互动质量
    const negativeComms = customerCommunications.filter(c =>
      c.content?.includes('不满') ||
      c.content?.includes('投诉') ||
      c.content?.includes('取消')
    ).length

    if (negativeComms > 0) {
      probability += negativeComms * 10
      factors.push('存在负面反馈')
    }

    // 检查机会进展
    const stagnantOpportunities = customerOpportunities.filter(o =>
      o.stage === 'negotiation' &&
      dayjs().diff(dayjs(o.updatedAt), 'day') > 30
    ).length

    if (stagnantOpportunities > 0) {
      probability += 15
      factors.push('销售机会停滞')
    }

    // 没有销售机会
    if (customerOpportunities.length === 0 && customer.status !== 'signed') {
      probability += 10
      factors.push('无销售机会')
    }

    probability = Math.min(100, probability)

    let riskLevel: ChurnPrediction['riskLevel'] = 'low'
    if (probability >= 80) riskLevel = 'critical'
    else if (probability >= 60) riskLevel = 'high'
    else if (probability >= 40) riskLevel = 'medium'

    return { probability, riskLevel, factors }
  }

  // 生成下一步行动建议
  const generateNextActions = (): NextAction[] => {
    const actions: NextAction[] = []
    const daysSinceContact = customer.lastContactDate
      ? dayjs().diff(dayjs(customer.lastContactDate), 'day')
      : 999

    // 根据时间间隔建议
    if (daysSinceContact > 30) {
      actions.push({
        id: 'reactivate',
        title: '重新激活客户',
        description: '客户已久未联系，建议进行回访了解现状',
        priority: 'high',
        type: 'call',
        estimatedImpact: 80
      })
    } else if (daysSinceContact > 14) {
      actions.push({
        id: 'follow-up',
        title: '定期跟进',
        description: '保持联系频率，了解客户需求变化',
        priority: 'medium',
        type: 'email',
        estimatedImpact: 60
      })
    }

    // 根据客户状态建议
    if (customer.status === 'potential') {
      actions.push({
        id: 'qualify',
        title: '需求挖掘',
        description: '深入了解客户需求，推进到下一阶段',
        priority: 'high',
        type: 'meeting',
        estimatedImpact: 85
      })
    } else if (customer.status === 'following') {
      actions.push({
        id: 'propose',
        title: '提交方案',
        description: '准备并提交定制化解决方案',
        priority: 'high',
        type: 'offer',
        estimatedImpact: 90
      })
    }

    // 根据机会阶段建议
    const activeOpportunity = customerOpportunities.find(o => o.stage !== 'closed-won' && o.stage !== 'closed-lost')
    if (activeOpportunity) {
      if (activeOpportunity.stage === 'qualification') {
        actions.push({
          id: 'demo',
          title: '产品演示',
          description: '安排产品演示，展示价值主张',
          priority: 'high',
          type: 'meeting',
          estimatedImpact: 75
        })
      } else if (activeOpportunity.stage === 'negotiation') {
        actions.push({
          id: 'close',
          title: '推进成交',
          description: '处理客户疑虑，推动签约',
          priority: 'high',
          type: 'call',
          estimatedImpact: 95
        })
      }
    }

    // 根据客户重要性建议
    if (customer.importance === 'high' && !activeOpportunity) {
      actions.push({
        id: 'upsell',
        title: '挖掘新机会',
        description: '探索交叉销售或增值服务机会',
        priority: 'medium',
        type: 'meeting',
        estimatedImpact: 70
      })
    }

    return actions.slice(0, 3) // 返回前3个建议
  }

  const healthScore = calculateHealthScore()
  const churnPrediction = predictChurn()
  const nextActions = generateNextActions()

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    if (score >= 40) return '#ff7a45'
    return '#ff4d4f'
  }

  const getRiskColor = (level: ChurnPrediction['riskLevel']) => {
    const colors = {
      low: 'green',
      medium: 'orange',
      high: 'red',
      critical: 'magenta'
    }
    return colors[level]
  }

  const getPriorityColor = (priority: NextAction['priority']) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'blue'
    }
    return colors[priority]
  }

  const getActionIcon = (type: NextAction['type']) => {
    const icons = {
      call: <PhoneOutlined />,
      email: <MessageOutlined />,
      meeting: <ClockCircleOutlined />,
      'follow-up': <CheckCircleOutlined />,
      offer: <DollarOutlined />
    }
    return icons[type]
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 健康分数卡片 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <HeartOutlined style={{ color: getHealthColor(healthScore.overall) }} />
                客户健康分析
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={healthScore.overall}
                    strokeColor={getHealthColor(healthScore.overall)}
                    format={() => (
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{healthScore.overall}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>综合健康度</div>
                      </div>
                    )}
                  />
                </div>
              </Col>
              <Col span={18}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary">互动频率</Text>
                        <Progress percent={healthScore.engagement} size="small" />
                      </div>
                      <div>
                        <Text type="secondary">客户价值</Text>
                        <Progress percent={healthScore.value} size="small" />
                      </div>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary">风险评估</Text>
                        <Progress percent={healthScore.risk} size="small" />
                      </div>
                      <div>
                        <Text type="secondary">活跃程度</Text>
                        <Progress percent={healthScore.activity} size="small" />
                      </div>
                    </Space>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 流失预测卡片 */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                流失风险预测
              </Space>
            }
          >
            <Statistic
              value={churnPrediction.probability}
              suffix="%"
              prefix={churnPrediction.probability > 60 ? <FallOutlined /> : <RiseOutlined />}
              valueStyle={{
                color: churnPrediction.probability > 60 ? '#ff4d4f' : '#52c41a'
              }}
            />
            <div style={{ marginTop: 16 }}>
              <Tag color={getRiskColor(churnPrediction.riskLevel)}>
                {churnPrediction.riskLevel === 'low' && '低风险'}
                {churnPrediction.riskLevel === 'medium' && '中风险'}
                {churnPrediction.riskLevel === 'high' && '高风险'}
                {churnPrediction.riskLevel === 'critical' && '极高风险'}
              </Tag>
            </div>
            {churnPrediction.factors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">风险因素：</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {churnPrediction.factors.map((factor, index) => (
                    <li key={index}>
                      <Text type="danger">{factor}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </Col>

        {/* 下一步行动建议 */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined />
                智能行动建议
              </Space>
            }
          >
            <List
              dataSource={nextActions}
              renderItem={action => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => onActionClick?.(action.id)}
                    >
                      执行
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: getPriorityColor(action.priority)
                        }}
                      >
                        {getActionIcon(action.type)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        {action.title}
                        <Tag color={getPriorityColor(action.priority)}>
                          {action.priority === 'high' && '高优先级'}
                          {action.priority === 'medium' && '中优先级'}
                          {action.priority === 'low' && '低优先级'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{action.description}</div>
                        <Progress
                          percent={action.estimatedImpact}
                          size="small"
                          format={() => `预期效果 ${action.estimatedImpact}%`}
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}