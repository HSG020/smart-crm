import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Button,
  Empty,
  Spin,
  Statistic,
  Progress,
  Tag,
  List,
  Avatar,
  Badge,
  Alert,
  Divider,
  Select,
  Table,
  Modal,
  message
} from 'antd'
import {
  BulbOutlined,
  RobotOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { useCustomerStore } from '../store/customerStore'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import { Customer } from '../types'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

// Chart component for ECharts integration
const ChartComponent: React.FC<{
  title?: string
  data: any
  type: 'line' | 'pie' | 'bar' | 'gauge' | 'area'
  height?: number
  showTitle?: boolean
}> = ({ title, data, type, height = 300, showTitle = false }) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)

    let option: any = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
    }

    if (showTitle && title) {
      option.title = {
        text: title,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      }
    }

    switch (type) {
      case 'line':
      case 'area':
        option = {
          ...option,
          xAxis: { type: 'category', data: data.categories },
          yAxis: { type: 'value' },
          series: [{
            data: data.values,
            type: 'line',
            smooth: true,
            areaStyle: type === 'area' ? { opacity: 0.3 } : undefined,
            lineStyle: { width: 2 },
            itemStyle: { color: '#1890ff' }
          }]
        }
        break

      case 'pie':
        option = {
          ...option,
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: { show: false },
            labelLine: { show: false }
          }]
        }
        break

      case 'bar':
        option = {
          ...option,
          xAxis: { type: 'category', data: data.categories },
          yAxis: { type: 'value' },
          series: [{
            data: data.values,
            type: 'bar',
            itemStyle: { color: '#52c41a' }
          }]
        }
        break

      case 'gauge':
        option = {
          ...option,
          series: [{
            type: 'gauge',
            radius: '75%',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 100,
            splitNumber: 5,
            axisLine: {
              lineStyle: {
                width: 6,
                color: [
                  [0.25, '#ff4d4f'],
                  [0.5, '#faad14'],
                  [0.75, '#52c41a'],
                  [1, '#1890ff']
                ]
              }
            },
            pointer: { itemStyle: { color: 'auto' } },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: 'auto', width: 1 } },
            axisLabel: { color: 'auto' },
            title: { offsetCenter: [0, '-10%'], fontSize: 20 },
            detail: {
              fontSize: 30,
              offsetCenter: [0, '-35%'],
              valueAnimation: true,
              formatter: function (value: number) {
                return Math.round(value) + ''
              },
              color: 'auto'
            },
            data: [{ value: data.value, name: data.name }]
          }]
        }
        break
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [title, data, type, showTitle])

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
}

export const AIAnalysis: React.FC = () => {
  const { customers } = useCustomerStore()
  const {
    loading,
    error,
    healthScores,
    recommendations,
    churnPredictions,
    getSummary,
    getCustomerAnalysis,
    runAnalysis
  } = useAIAnalysis()

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState<any>(null)

  const summary = useMemo(() => getSummary(), [getSummary])
  const selectedCustomerAnalysis = useMemo(() =>
    selectedCustomerId ? getCustomerAnalysis(selectedCustomerId) : null,
    [selectedCustomerId, getCustomerAnalysis]
  )

  const handleActionClick = (action: any) => {
    setSelectedAction(action)
    setShowActionModal(true)
  }

  const executeAction = () => {
    message.success(`正在执行: ${selectedAction?.title}`)
    setShowActionModal(false)
    // 这里可以集成实际的动作执行逻辑
  }

  if (customers.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              暂无客户数据
              <br />
              <Text type="secondary">请先添加客户或生成演示数据</Text>
            </span>
          }
        />
      </Card>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>AI正在分析客户数据...</Paragraph>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="AI分析失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={runAnalysis}>
              重试
            </Button>
          }
        />
      </Card>
    )
  }

  // 健康度分布数据
  const healthDistributionData = [
    { name: '优秀', value: summary.healthDistribution.excellent, color: '#52c41a' },
    { name: '健康', value: summary.healthDistribution.healthy, color: '#1890ff' },
    { name: '风险', value: summary.healthDistribution.atRisk, color: '#faad14' },
    { name: '危险', value: summary.healthDistribution.critical, color: '#ff4d4f' }
  ]

  // 流失风险分布数据
  const churnRiskData = [
    { name: '低风险', value: summary.churnRiskDistribution.low, color: '#52c41a' },
    { name: '中风险', value: summary.churnRiskDistribution.medium, color: '#faad14' },
    { name: '高风险', value: summary.churnRiskDistribution.high, color: '#fa8c16' },
    { name: '极高风险', value: summary.churnRiskDistribution.critical, color: '#ff4d4f' }
  ]

  // 健康度趋势数据（模拟）
  const healthTrendData = {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    values: [75, 78, 82, 79, 85, summary.averageHealthScore]
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          </Col>
          <Col flex="1">
            <Title level={2} style={{ margin: 0 }}>AI 智能分析中心</Title>
            <Paragraph style={{ margin: 0 }}>
              基于机器学习的客户智能分析，提供实时洞察和行动建议
            </Paragraph>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={runAnalysis}
                loading={loading}
              >
                刷新分析
              </Button>
              <Button icon={<ExperimentOutlined />}>
                模型设置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 核心指标概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总客户数"
              value={summary.totalCustomers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均健康度"
              value={summary.averageHealthScore}
              prefix={<TrophyOutlined />}
              suffix="/100"
              valueStyle={{ color: summary.averageHealthScore >= 80 ? '#52c41a' : summary.averageHealthScore >= 60 ? '#faad14' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高风险客户"
              value={summary.highRiskCustomers.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待执行建议"
              value={summary.topRecommendations.length}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要分析区域 */}
      <Row gutter={[16, 16]}>
        {/* 健康度概览 */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#52c41a' }} />
                健康度概览
              </Space>
            }
            extra={<Tag color="blue">实时更新</Tag>}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <ChartComponent
                    data={{ value: summary.averageHealthScore, name: '平均分' }}
                    type="gauge"
                    height={200}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <ChartComponent
                    data={healthDistributionData}
                    type="pie"
                    height={200}
                  />
                  <Text type="secondary">健康度分布</Text>
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Text strong>健康度趋势</Text>
                <ChartComponent
                  data={healthTrendData}
                  type="area"
                  height={120}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 智能推荐 */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: '#faad14' }} />
                智能推荐
              </Space>
            }
            extra={<Badge count={summary.topRecommendations.length} />}
          >
            <List
              size="small"
              dataSource={summary.topRecommendations.slice(0, 6)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleActionClick(item)}
                    >
                      执行
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size="small"
                        icon={item.priority === 'high' ? <FireOutlined /> : <BulbOutlined />}
                        style={{
                          backgroundColor: item.priority === 'high' ? '#ff4d4f' :
                            item.priority === 'medium' ? '#faad14' : '#52c41a'
                        }}
                      />
                    }
                    title={<Text strong>{item.title}</Text>}
                    description={
                      <Space>
                        <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'green'}>
                          {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.type === 'follow_up' ? '跟进提醒' :
                           item.type === 'upsell' ? '追加销售' :
                           item.type === 'retention' ? '客户挽回' : '其他'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 流失风险监控 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                流失风险监控
              </Space>
            }
            extra={
              <Space>
                <Tag color="red">{summary.highRiskCustomers.length} 高风险</Tag>
                <Button size="small" type="link">查看全部</Button>
              </Space>
            }
          >
            <Table
              size="small"
              dataSource={summary.highRiskCustomers.slice(0, 8)}
              columns={[
                {
                  title: '客户',
                  key: 'customer',
                  render: (record) => {
                    const customer = customers.find(c => c.id === record.customerId)
                    return (
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div>
                          <Text strong>{customer?.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>{customer?.company}</Text>
                        </div>
                      </Space>
                    )
                  }
                },
                {
                  title: '流失概率',
                  dataIndex: 'churnProbability',
                  key: 'churnProbability',
                  render: (value) => (
                    <Progress
                      percent={Math.round(value * 100)}
                      size="small"
                      strokeColor={value > 0.7 ? '#ff4d4f' : value > 0.5 ? '#faad14' : '#52c41a'}
                      showInfo={false}
                    />
                  )
                },
                {
                  title: '风险等级',
                  dataIndex: 'riskLevel',
                  key: 'riskLevel',
                  render: (level) => (
                    <Tag color={level === 'critical' ? 'red' : level === 'high' ? 'orange' : 'yellow'}>
                      {level === 'critical' ? '极高' : level === 'high' ? '高' : '中'}
                    </Tag>
                  )
                },
                {
                  title: '主要风险',
                  key: 'riskFactors',
                  render: (record) => (
                    <Space size={4}>
                      {record.topRiskFactors?.slice(0, 2).map((factor: any, index: number) => (
                        <Tag key={index} color="default" style={{ fontSize: 10, margin: 0 }}>
                          {factor}
                        </Tag>
                      ))}
                    </Space>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </Col>

        {/* 流失风险分布 */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#fa8c16' }} />
                风险分布
              </Space>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <ChartComponent
                data={churnRiskData}
                type="pie"
                height={200}
              />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              {churnRiskData.map(item => (
                <Row key={item.name} justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }} />
                      <Text>{item.name}</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Text strong>{item.value}</Text>
                  </Col>
                </Row>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* AI洞察面板 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                关键洞察
              </Space>
            }
            size="small"
          >
            <List
              size="small"
              dataSource={[
                { icon: <TrophyOutlined style={{ color: '#faad14' }} />, text: '金融行业客户健康度最高 (89分)' },
                { icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />, text: '周二下午2-4点联系成功率最高' },
                { icon: <RiseOutlined style={{ color: '#52c41a' }} />, text: '本月客户满意度提升 12%' },
                { icon: <FireOutlined style={{ color: '#ff4d4f' }} />, text: '制造业客户流失风险较高' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    description={<Text style={{ fontSize: 13 }}>{item.text}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                执行建议
              </Space>
            }
            size="small"
          >
            <List
              size="small"
              dataSource={[
                { priority: 'high', text: '立即联系 3 个极高风险客户' },
                { priority: 'medium', text: '安排本周拜访 5 个重点客户' },
                { priority: 'medium', text: '发送生日祝福给 2 个客户' },
                { priority: 'low', text: '更新 8 个客户的标签信息' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Badge
                      color={item.priority === 'high' ? '#ff4d4f' : item.priority === 'medium' ? '#faad14' : '#52c41a'}
                    />
                    <Text style={{ fontSize: 13 }}>{item.text}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <ExperimentOutlined style={{ color: '#1890ff' }} />
                模型性能
              </Space>
            }
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Row justify="space-between">
                  <Text>健康度预测准确率</Text>
                  <Text strong>89%</Text>
                </Row>
                <Progress percent={89} size="small" strokeColor="#52c41a" />
              </div>
              <div>
                <Row justify="space-between">
                  <Text>流失预测准确率</Text>
                  <Text strong>82%</Text>
                </Row>
                <Progress percent={82} size="small" strokeColor="#1890ff" />
              </div>
              <div>
                <Row justify="space-between">
                  <Text>推荐采纳率</Text>
                  <Text strong>76%</Text>
                </Row>
                <Progress percent={76} size="small" strokeColor="#faad14" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 客户详细分析 */}
      {selectedCustomerId && (
        <Card
          title={
            <Space>
              <UserOutlined />
              客户详细分析
            </Space>
          }
          style={{ marginTop: 16 }}
          extra={
            <Select
              placeholder="选择客户"
              style={{ width: 200 }}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              showSearch
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.company}
                </Option>
              ))}
            </Select>
          }
        >
          {selectedCustomerAnalysis && (
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" title="健康度评分">
                  {selectedCustomerAnalysis.healthScore && (
                    <div style={{ textAlign: 'center' }}>
                      <ChartComponent
                        data={{
                          value: selectedCustomerAnalysis.healthScore.score,
                          name: selectedCustomerAnalysis.healthScore.level
                        }}
                        type="gauge"
                        height={180}
                      />
                      <Space direction="vertical" style={{ marginTop: 8 }}>
                        <Tag
                          color={
                            selectedCustomerAnalysis.healthScore.level === 'excellent' ? 'green' :
                            selectedCustomerAnalysis.healthScore.level === 'healthy' ? 'blue' :
                            selectedCustomerAnalysis.healthScore.level === 'at-risk' ? 'orange' : 'red'
                          }
                        >
                          {selectedCustomerAnalysis.healthScore.level === 'excellent' ? '优秀' :
                           selectedCustomerAnalysis.healthScore.level === 'healthy' ? '健康' :
                           selectedCustomerAnalysis.healthScore.level === 'at-risk' ? '风险' : '危险'}
                        </Tag>
                      </Space>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="AI推荐" bodyStyle={{ maxHeight: 220, overflow: 'auto' }}>
                  <List
                    size="small"
                    dataSource={selectedCustomerAnalysis.recommendations}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Badge
                              color={item.priority === 'high' ? '#ff4d4f' : item.priority === 'medium' ? '#faad14' : '#52c41a'}
                            />
                          }
                          title={<Text style={{ fontSize: 13 }}>{item.title}</Text>}
                          description={<Text type="secondary" style={{ fontSize: 11 }}>{item.description}</Text>}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="流失风险">
                  {selectedCustomerAnalysis.churnPrediction && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ textAlign: 'center' }}>
                        <Progress
                          type="circle"
                          percent={Math.round(selectedCustomerAnalysis.churnPrediction.churnProbability * 100)}
                          strokeColor={
                            selectedCustomerAnalysis.churnPrediction.churnProbability > 0.7 ? '#ff4d4f' :
                            selectedCustomerAnalysis.churnPrediction.churnProbability > 0.5 ? '#faad14' : '#52c41a'
                          }
                          size={120}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Tag
                          color={
                            selectedCustomerAnalysis.churnPrediction.riskLevel === 'critical' ? 'red' :
                            selectedCustomerAnalysis.churnPrediction.riskLevel === 'high' ? 'orange' : 'yellow'
                          }
                        >
                          {selectedCustomerAnalysis.churnPrediction.riskLevel === 'critical' ? '极高风险' :
                           selectedCustomerAnalysis.churnPrediction.riskLevel === 'high' ? '高风险' : '中风险'}
                        </Tag>
                      </div>
                    </Space>
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </Card>
      )}

      {/* 动作执行模态框 */}
      <Modal
        title="执行AI建议"
        open={showActionModal}
        onOk={executeAction}
        onCancel={() => setShowActionModal(false)}
        okText="立即执行"
        cancelText="取消"
      >
        {selectedAction && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              <Text strong>建议标题:</Text> {selectedAction.title}
            </Paragraph>
            <Paragraph>
              <Text strong>建议描述:</Text> {selectedAction.description}
            </Paragraph>
            <Paragraph>
              <Text strong>优先级:</Text>{' '}
              <Tag color={selectedAction.priority === 'high' ? 'red' : selectedAction.priority === 'medium' ? 'orange' : 'green'}>
                {selectedAction.priority === 'high' ? '高' : selectedAction.priority === 'medium' ? '中' : '低'}
              </Tag>
            </Paragraph>
            <Alert
              message="系统将自动创建相关任务并添加到您的待办事项中"
              type="info"
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}