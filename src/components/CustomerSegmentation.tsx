import React, { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Typography, Table, Tag, Statistic, Progress, Space, Select, Button, List, Avatar, Tooltip } from 'antd'
import {
  GroupOutlined,
  CrownOutlined,
  TeamOutlined,
  FireOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  StarOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Customer } from '../types'
import { useCommunicationStore } from '../store/communicationStore'
import { useOpportunityStore } from '../store/opportunityStore'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface CustomerSegmentationProps {
  customers: Customer[]
  onSegmentClick?: (segment: string, customerIds: string[]) => void
}

interface Segment {
  id: string
  name: string
  description: string
  color: string
  icon: React.ReactNode
  customers: Customer[]
  metrics: {
    avgValue: number
    avgEngagement: number
    growthRate: number
    churnRisk: number
  }
}

interface CustomerCLV {
  customerId: string
  customerName: string
  historicalValue: number
  predictedValue: number
  totalCLV: number
  confidence: number
  retentionProbability: number
  avgPurchaseValue: number
  purchaseFrequency: number
  customerLifespan: number
}

export const CustomerSegmentation: React.FC<CustomerSegmentationProps> = ({
  customers,
  onSegmentClick
}) => {
  const { communications } = useCommunicationStore()
  const { opportunities } = useOpportunityStore()
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'clv' | 'value' | 'engagement'>('clv')

  // RFM分析 - 计算每个客户的RFM分数
  const calculateRFMScore = (customer: Customer) => {
    // Recency - 最近一次联系
    const daysSinceContact = customer.lastContactDate
      ? dayjs().diff(dayjs(customer.lastContactDate), 'day')
      : 999

    let recencyScore = 5
    if (daysSinceContact <= 7) recencyScore = 5
    else if (daysSinceContact <= 14) recencyScore = 4
    else if (daysSinceContact <= 30) recencyScore = 3
    else if (daysSinceContact <= 60) recencyScore = 2
    else recencyScore = 1

    // Frequency - 沟通频率
    const customerComms = communications.filter(c => c.customerId === customer.id)
    const commFrequency = customerComms.length

    let frequencyScore = 1
    if (commFrequency >= 20) frequencyScore = 5
    else if (commFrequency >= 10) frequencyScore = 4
    else if (commFrequency >= 5) frequencyScore = 3
    else if (commFrequency >= 2) frequencyScore = 2
    else frequencyScore = 1

    // Monetary - 价值
    const customerOpps = opportunities.filter(o => o.customerId === customer.id)
    const totalValue = customerOpps.reduce((sum, o) => sum + (o.value || 0), 0)

    let monetaryScore = 1
    if (totalValue >= 100000) monetaryScore = 5
    else if (totalValue >= 50000) monetaryScore = 4
    else if (totalValue >= 20000) monetaryScore = 3
    else if (totalValue >= 5000) monetaryScore = 2
    else monetaryScore = 1

    return {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      total: recencyScore + frequencyScore + monetaryScore
    }
  }

  // 计算客户生命周期价值 (CLV)
  const calculateCLV = (customer: Customer): CustomerCLV => {
    const customerOpps = opportunities.filter(o => o.customerId === customer.id)
    const customerComms = communications.filter(c => c.customerId === customer.id)

    // 历史价值
    const historicalValue = customerOpps
      .filter(o => o.stage === 'closed-won')
      .reduce((sum, o) => sum + (o.value || 0), 0)

    // 潜在价值
    const potentialValue = customerOpps
      .filter(o => o.stage !== 'closed-won' && o.stage !== 'closed-lost')
      .reduce((sum, o) => sum + (o.value || 0) * o.probability / 100, 0)

    // 平均购买价值
    const wonOpps = customerOpps.filter(o => o.stage === 'closed-won')
    const avgPurchaseValue = wonOpps.length > 0
      ? historicalValue / wonOpps.length
      : potentialValue

    // 购买频率 (基于历史数据预测)
    const customerAge = dayjs().diff(dayjs(customer.createdAt), 'month') || 1
    const purchaseFrequency = wonOpps.length / customerAge

    // 客户保留概率 (基于互动和状态)
    let retentionProbability = 0.5
    if (customer.status === 'signed') retentionProbability = 0.9
    else if (customer.status === 'following') retentionProbability = 0.7
    else if (customer.status === 'potential') retentionProbability = 0.4
    else if (customer.status === 'lost') retentionProbability = 0.1

    // 调整保留概率基于互动
    const recentComms = customerComms.filter(c =>
      dayjs(c.date).isAfter(dayjs().subtract(30, 'day'))
    ).length
    if (recentComms > 5) retentionProbability *= 1.2
    else if (recentComms > 2) retentionProbability *= 1.1
    else if (recentComms === 0) retentionProbability *= 0.7
    retentionProbability = Math.min(0.95, retentionProbability)

    // 预测客户生命周期 (月)
    const avgCustomerLifespan = 24 // 假设平均24个月
    const customerLifespan = avgCustomerLifespan * retentionProbability

    // 计算预测价值
    const predictedValue = avgPurchaseValue * purchaseFrequency * customerLifespan

    // 总CLV
    const totalCLV = historicalValue + predictedValue

    // 置信度 (基于数据完整性)
    let confidence = 0.5
    if (wonOpps.length > 0) confidence += 0.3
    if (customerComms.length > 10) confidence += 0.2
    confidence = Math.min(1, confidence)

    return {
      customerId: customer.id,
      customerName: customer.name,
      historicalValue,
      predictedValue,
      totalCLV,
      confidence,
      retentionProbability,
      avgPurchaseValue,
      purchaseFrequency,
      customerLifespan
    }
  }

  // 客户分群
  const segmentCustomers = (): Segment[] => {
    const segments: Segment[] = []

    // 计算所有客户的RFM和CLV
    const customerAnalysis = customers.map(customer => ({
      customer,
      rfm: calculateRFMScore(customer),
      clv: calculateCLV(customer)
    }))

    // VIP客户 - RFM总分>=12 或 CLV>100000
    const vipCustomers = customerAnalysis
      .filter(a => a.rfm.total >= 12 || a.clv.totalCLV > 100000)
      .map(a => a.customer)

    segments.push({
      id: 'vip',
      name: 'VIP客户',
      description: '高价值、高频互动的核心客户群体',
      color: '#f5222d',
      icon: <CrownOutlined />,
      customers: vipCustomers,
      metrics: {
        avgValue: vipCustomers.length > 0
          ? customerAnalysis
            .filter(a => vipCustomers.includes(a.customer))
            .reduce((sum, a) => sum + a.clv.totalCLV, 0) / vipCustomers.length
          : 0,
        avgEngagement: 95,
        growthRate: 15,
        churnRisk: 5
      }
    })

    // 成长型客户 - RFM总分8-11
    const growingCustomers = customerAnalysis
      .filter(a => a.rfm.total >= 8 && a.rfm.total < 12 && !vipCustomers.includes(a.customer))
      .map(a => a.customer)

    segments.push({
      id: 'growing',
      name: '成长型客户',
      description: '有潜力成为VIP的客户群体',
      color: '#fa8c16',
      icon: <RiseOutlined />,
      customers: growingCustomers,
      metrics: {
        avgValue: growingCustomers.length > 0
          ? customerAnalysis
            .filter(a => growingCustomers.includes(a.customer))
            .reduce((sum, a) => sum + a.clv.totalCLV, 0) / growingCustomers.length
          : 0,
        avgEngagement: 70,
        growthRate: 25,
        churnRisk: 20
      }
    })

    // 新客户 - 创建时间<30天
    const newCustomers = customers.filter(c =>
      dayjs(c.createdAt).isAfter(dayjs().subtract(30, 'day')) &&
      !vipCustomers.includes(c) &&
      !growingCustomers.includes(c)
    )

    segments.push({
      id: 'new',
      name: '新客户',
      description: '最近30天内新增的客户',
      color: '#52c41a',
      icon: <UserOutlined />,
      customers: newCustomers,
      metrics: {
        avgValue: newCustomers.length > 0
          ? customerAnalysis
            .filter(a => newCustomers.includes(a.customer))
            .reduce((sum, a) => sum + a.clv.totalCLV, 0) / newCustomers.length
          : 0,
        avgEngagement: 50,
        growthRate: 40,
        churnRisk: 30
      }
    })

    // 休眠客户 - 超过60天未联系
    const dormantCustomers = customers.filter(c => {
      const daysSinceContact = c.lastContactDate
        ? dayjs().diff(dayjs(c.lastContactDate), 'day')
        : 999
      return daysSinceContact > 60 &&
        !vipCustomers.includes(c) &&
        !growingCustomers.includes(c) &&
        !newCustomers.includes(c)
    })

    segments.push({
      id: 'dormant',
      name: '休眠客户',
      description: '超过60天未互动，需要重新激活',
      color: '#8c8c8c',
      icon: <ClockCircleOutlined />,
      customers: dormantCustomers,
      metrics: {
        avgValue: dormantCustomers.length > 0
          ? customerAnalysis
            .filter(a => dormantCustomers.includes(a.customer))
            .reduce((sum, a) => sum + a.clv.totalCLV, 0) / dormantCustomers.length
          : 0,
        avgEngagement: 20,
        growthRate: -10,
        churnRisk: 70
      }
    })

    // 流失风险客户
    const atRiskCustomers = customers.filter(c =>
      c.status === 'lost' ||
      (c.status === 'potential' && dayjs(c.createdAt).isBefore(dayjs().subtract(90, 'day')))
    )

    segments.push({
      id: 'at-risk',
      name: '流失风险',
      description: '有流失风险或已流失的客户',
      color: '#ff4d4f',
      icon: <FallOutlined />,
      customers: atRiskCustomers,
      metrics: {
        avgValue: atRiskCustomers.length > 0
          ? customerAnalysis
            .filter(a => atRiskCustomers.includes(a.customer))
            .reduce((sum, a) => sum + a.clv.totalCLV, 0) / atRiskCustomers.length
          : 0,
        avgEngagement: 10,
        growthRate: -25,
        churnRisk: 90
      }
    })

    return segments
  }

  const segments = useMemo(() => segmentCustomers(), [customers, communications, opportunities])

  // 获取当前选中分群的客户CLV列表
  const currentSegmentCLVs = useMemo(() => {
    const currentSegment = selectedSegment === 'all'
      ? customers
      : segments.find(s => s.id === selectedSegment)?.customers || []

    return currentSegment.map(customer => calculateCLV(customer))
      .sort((a, b) => {
        switch (sortBy) {
          case 'clv':
            return b.totalCLV - a.totalCLV
          case 'value':
            return b.historicalValue - a.historicalValue
          case 'engagement':
            return b.retentionProbability - a.retentionProbability
          default:
            return 0
        }
      })
  }, [selectedSegment, segments, customers, sortBy])

  const totalCLV = currentSegmentCLVs.reduce((sum, c) => sum + c.totalCLV, 0)
  const avgCLV = currentSegmentCLVs.length > 0 ? totalCLV / currentSegmentCLVs.length : 0

  return (
    <div>
      {/* 分群概览 */}
      <Card title="客户分群分析" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {segments.map(segment => (
            <Col span={8} key={segment.id}>
              <Card
                hoverable
                onClick={() => {
                  setSelectedSegment(segment.id)
                  onSegmentClick?.(segment.id, segment.customers.map(c => c.id))
                }}
                style={{
                  borderColor: selectedSegment === segment.id ? segment.color : undefined,
                  borderWidth: selectedSegment === segment.id ? 2 : 1
                }}
              >
                <Row align="middle" gutter={16}>
                  <Col span={6}>
                    <Avatar
                      size={48}
                      style={{ backgroundColor: segment.color }}
                      icon={segment.icon}
                    />
                  </Col>
                  <Col span={18}>
                    <Title level={5} style={{ margin: 0 }}>{segment.name}</Title>
                    <Text type="secondary">{segment.customers.length} 个客户</Text>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 0, marginTop: 4, fontSize: '12px' }}
                    >
                      {segment.description}
                    </Paragraph>
                  </Col>
                </Row>
                <Row gutter={8} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="平均价值"
                      value={segment.metrics.avgValue}
                      prefix="¥"
                      precision={0}
                      valueStyle={{ fontSize: '14px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="流失风险"
                      value={segment.metrics.churnRisk}
                      suffix="%"
                      valueStyle={{
                        fontSize: '14px',
                        color: segment.metrics.churnRisk > 50 ? '#ff4d4f' : '#52c41a'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* CLV分析 */}
      <Card
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <DollarOutlined />
                客户生命周期价值 (CLV) 分析
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">排序：</Text>
                <Select value={sortBy} onChange={setSortBy} style={{ width: 120 }}>
                  <Option value="clv">总CLV</Option>
                  <Option value="value">历史价值</Option>
                  <Option value="engagement">保留概率</Option>
                </Select>
              </Space>
            </Col>
          </Row>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="总CLV"
              value={totalCLV}
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="平均CLV"
              value={avgCLV}
              prefix="¥"
              precision={0}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="客户数量"
              value={currentSegmentCLVs.length}
              suffix="个"
            />
          </Col>
        </Row>

        <Table
          dataSource={currentSegmentCLVs.slice(0, 10)}
          rowKey="customerId"
          pagination={false}
          columns={[
            {
              title: '客户',
              dataIndex: 'customerName',
              key: 'customerName',
              width: 150
            },
            {
              title: '历史价值',
              dataIndex: 'historicalValue',
              key: 'historicalValue',
              render: (value: number) => `¥${value.toLocaleString()}`,
              sorter: (a, b) => a.historicalValue - b.historicalValue
            },
            {
              title: '预测价值',
              dataIndex: 'predictedValue',
              key: 'predictedValue',
              render: (value: number) => `¥${Math.round(value).toLocaleString()}`,
              sorter: (a, b) => a.predictedValue - b.predictedValue
            },
            {
              title: '总CLV',
              dataIndex: 'totalCLV',
              key: 'totalCLV',
              render: (value: number) => (
                <Text strong style={{ color: '#1890ff' }}>
                  ¥{Math.round(value).toLocaleString()}
                </Text>
              ),
              sorter: (a, b) => a.totalCLV - b.totalCLV
            },
            {
              title: '保留概率',
              dataIndex: 'retentionProbability',
              key: 'retentionProbability',
              render: (value: number) => (
                <Progress
                  percent={Math.round(value * 100)}
                  size="small"
                  strokeColor={value > 0.7 ? '#52c41a' : value > 0.4 ? '#faad14' : '#ff4d4f'}
                />
              ),
              sorter: (a, b) => a.retentionProbability - b.retentionProbability
            },
            {
              title: '置信度',
              dataIndex: 'confidence',
              key: 'confidence',
              render: (value: number) => (
                <Tag color={value > 0.7 ? 'green' : value > 0.4 ? 'orange' : 'red'}>
                  {Math.round(value * 100)}%
                </Tag>
              ),
              sorter: (a, b) => a.confidence - b.confidence
            }
          ]}
        />

        {currentSegmentCLVs.length > 10 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              仅显示前10条记录，共{currentSegmentCLVs.length}条
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}