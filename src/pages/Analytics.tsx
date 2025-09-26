import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, DatePicker, Space, Select, Divider } from 'antd'
import { 
  TrophyOutlined, 
  UserOutlined, 
  DollarOutlined, 
  PhoneOutlined,
  RiseOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { AnalyticsCharts } from '../components/AnalyticsCharts'
import { useCustomerStore } from '../store/customerStore'
import { useCommunicationStore } from '../store/communicationStore'
import { useOpportunityStore } from '../store/opportunityStore'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

export const Analytics: React.FC = () => {
  const { customers, loadCustomers } = useCustomerStore()
  const { communications, loadCommunications } = useCommunicationStore()
  const { opportunities, loadOpportunities } = useOpportunityStore()

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [selectedPeriod, setSelectedPeriod] = useState('30')

  useEffect(() => {
    loadCustomers()
    loadCommunications()
    loadOpportunities()
  }, [loadCustomers, loadCommunications, loadOpportunities])

  // 根据选择的时间段过滤数据
  const getFilteredData = () => {
    const [start, end] = dateRange
    
    const filteredCustomers = customers.filter(c => {
      const createDate = dayjs(c.createdAt)
      return createDate.isAfter(start) && createDate.isBefore(end)
    })

    const filteredCommunications = communications.filter(c => {
      const createDate = dayjs(c.createdAt)
      return createDate.isAfter(start) && createDate.isBefore(end)
    })

    const filteredOpportunities = opportunities.filter(o => {
      const createDate = dayjs(o.createdAt)
      return createDate.isAfter(start) && createDate.isBefore(end)
    })

    return { filteredCustomers, filteredCommunications, filteredOpportunities }
  }

  const { filteredCustomers, filteredCommunications, filteredOpportunities } = getFilteredData()

  // 计算关键指标
  const calculateMetrics = () => {
    // 总客户数
    const totalCustomers = customers.length
    const newCustomers = filteredCustomers.length

    // 总沟通次数
    const totalCommunications = filteredCommunications.length

    // 转化率计算
    const closedWonOpportunities = opportunities.filter(o => o.stage === 'closed_won')
    const totalOpportunities = opportunities.length
    const conversionRate = totalOpportunities > 0 ? (closedWonOpportunities.length / totalOpportunities * 100) : 0

    // 成交金额
    const closedWonValue = closedWonOpportunities.reduce((sum, o) => sum + o.value, 0)
    const avgDealSize = closedWonOpportunities.length > 0 ? closedWonValue / closedWonOpportunities.length : 0

    // 管道价值
    const pipelineValue = opportunities
      .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
      .reduce((sum, o) => sum + o.value, 0)

    // 平均跟进频率
    const activeCustomers = customers.filter(c => c.lastContactDate)
    const avgFollowUpDays = activeCustomers.length > 0 
      ? activeCustomers.reduce((sum, c) => {
          const daysSinceContact = dayjs().diff(dayjs(c.lastContactDate), 'day')
          return sum + daysSinceContact
        }, 0) / activeCustomers.length
      : 0

    // 客户重要度分布
    const highImportanceCustomers = customers.filter(c => c.importance === 'high').length
    const mediumImportanceCustomers = customers.filter(c => c.importance === 'medium').length
    const lowImportanceCustomers = customers.filter(c => c.importance === 'low').length

    // 沟通方式分布
    const communicationTypes = filteredCommunications.reduce((acc, comm) => {
      acc[comm.type] = (acc[comm.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalCustomers,
      newCustomers,
      totalCommunications,
      conversionRate,
      avgDealSize,
      closedWonValue,
      pipelineValue,
      avgFollowUpDays,
      highImportanceCustomers,
      mediumImportanceCustomers,
      lowImportanceCustomers,
      communicationTypes
    }
  }

  const metrics = calculateMetrics()

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    const end = dayjs()
    let start = dayjs()

    switch (value) {
      case '7':
        start = end.subtract(7, 'day')
        break
      case '30':
        start = end.subtract(30, 'day')
        break
      case '90':
        start = end.subtract(90, 'day')
        break
      case '365':
        start = end.subtract(365, 'day')
        break
    }

    setDateRange([start, end])
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 时间选择器 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <span>时间范围：</span>
          <Select 
            value={selectedPeriod} 
            onChange={handlePeriodChange}
            style={{ width: 120 }}
          >
            <Option value="7">最近7天</Option>
            <Option value="30">最近30天</Option>
            <Option value="90">最近90天</Option>
            <Option value="365">最近一年</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates)}
            format="YYYY-MM-DD"
          />
        </Space>
      </Card>

      {/* 关键指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总客户数"
              value={metrics.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#666' }}>
                  (+{metrics.newCustomers})
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="沟通次数"
              value={metrics.totalCommunications}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="转化率"
              value={metrics.conversionRate}
              precision={1}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ 
                color: metrics.conversionRate > 20 ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均成交金额"
              value={metrics.avgDealSize}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="成交总金额"
              value={metrics.closedWonValue}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#f5222d' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管道价值"
              value={metrics.pipelineValue}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均跟进间隔"
              value={metrics.avgFollowUpDays}
              precision={1}
              suffix="天"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ 
                color: metrics.avgFollowUpDays > 7 ? '#f5222d' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="重要客户占比"
              value={
                metrics.totalCustomers > 0 
                  ? (metrics.highImportanceCustomers / metrics.totalCustomers * 100)
                  : 0
              }
              precision={1}
              suffix="%"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 客户重要度分布 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="客户重要度分布" size="small">
            <Row gutter={8}>
              <Col span={8}>
                <Statistic
                  title="高"
                  value={metrics.highImportanceCustomers}
                  valueStyle={{ color: '#f5222d', fontSize: '20px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="中"
                  value={metrics.mediumImportanceCustomers}
                  valueStyle={{ color: '#faad14', fontSize: '20px' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="低"
                  value={metrics.lowImportanceCustomers}
                  valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card title="沟通方式分布" size="small">
            <Row gutter={8}>
              {Object.entries(metrics.communicationTypes).map(([type, count]) => {
                const typeNames: Record<string, string> = {
                  call: '电话',
                  email: '邮件',
                  meeting: '会议',
                  wechat: '微信',
                  visit: '拜访'
                }
                return (
                  <Col span={4} key={type}>
                    <Statistic
                      title={typeNames[type] || type}
                      value={count}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                )
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider>数据分析图表</Divider>

      {/* 图表区域 */}
      <AnalyticsCharts
        customers={customers}
        communications={communications}
        opportunities={opportunities}
      />
    </div>
  )
}