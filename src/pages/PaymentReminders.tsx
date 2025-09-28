/**
 * 回款提醒管理页面
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Statistic,
  Row,
  Col,
  DatePicker,
  Select,
  Input,
  message,
  Modal,
  Form,
  InputNumber,
  Badge,
  Tooltip,
  Tabs,
  Empty
} from 'antd'
import {
  PlusOutlined,
  DollarOutlined,
  BellOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { paymentService } from '@/services/paymentService'
import type { PaymentPlan, PaymentStatus, PaymentFilters } from '@/types/payment'
import PaymentPlanForm from '@/components/payment/PaymentPlanForm'
import PaymentDetailDrawer from '@/components/payment/PaymentDetailDrawer'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { TabPane } = Tabs

export const PaymentReminders: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [filters, setFilters] = useState<PaymentFilters>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [formVisible, setFormVisible] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      // 根据tab设置过滤条件
      const tabFilters: PaymentFilters = { ...filters }
      if (activeTab === 'pending') {
        tabFilters.status = ['pending']
      } else if (activeTab === 'overdue') {
        tabFilters.overdue_only = true
      } else if (activeTab === 'completed') {
        tabFilters.status = ['completed']
      }

      // 加载回款计划
      const { data: plans } = await paymentService.getPaymentPlans(tabFilters)
      if (plans) {
        setPaymentPlans(plans)
      }

      // 加载统计数据
      const stats = await paymentService.getPaymentStatistics(tabFilters)
      setStatistics(stats)

      // 检查并更新逾期状态
      await paymentService.checkAndUpdateOverdueStatus()
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters, activeTab])

  // 状态标签
  const getStatusTag = (status: PaymentStatus) => {
    const statusConfig = {
      pending: { color: 'blue', text: '待回款', icon: <ClockCircleOutlined /> },
      partial: { color: 'orange', text: '部分回款', icon: <ExclamationCircleOutlined /> },
      completed: { color: 'green', text: '已回款', icon: <CheckCircleOutlined /> },
      overdue: { color: 'red', text: '已逾期', icon: <WarningOutlined /> },
      cancelled: { color: 'default', text: '已取消', icon: null }
    }

    const config = statusConfig[status]
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // 表格列定义
  const columns: ColumnsType<PaymentPlan> = [
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
      fixed: 'left',
      width: 150,
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)}>
          {text || '未知客户'}
        </a>
      )
    },
    {
      title: '合同编号',
      dataIndex: 'contract_number',
      key: 'contract_number',
      width: 120,
      render: text => text || '-'
    },
    {
      title: '应收金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`,
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0)
    },
    {
      title: '已收金额',
      dataIndex: 'received_amount',
      key: 'received_amount',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <span style={{ color: value > 0 ? '#52c41a' : undefined }}>
          ¥{value?.toLocaleString() || 0}
        </span>
      )
    },
    {
      title: '回款进度',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const percent = record.total_amount
          ? Math.round((record.received_amount / record.total_amount) * 100)
          : 0
        return (
          <Progress
            percent={percent}
            size="small"
            status={record.status === 'completed' ? 'success' : 'active'}
          />
        )
      }
    },
    {
      title: '应收日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 110,
      render: (date) => {
        if (!date) return '-'
        const dueDate = dayjs(date)
        const now = dayjs()
        const isOverdue = dueDate.isBefore(now) && !['completed', 'cancelled'].includes(status)

        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dueDate.format('YYYY-MM-DD')}
          </span>
        )
      },
      sorter: (a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '待回款', value: 'pending' },
        { text: '部分回款', value: 'partial' },
        { text: '已回款', value: 'completed' },
        { text: '已逾期', value: 'overdue' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => getStatusTag(status)
    },
    {
      title: '期数',
      key: 'installment',
      width: 80,
      render: (_, record) => `${record.installment}/${record.total_installments}`
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BellOutlined />}
            onClick={() => handleSetReminder(record)}
          >
            提醒
          </Button>
        </Space>
      )
    }
  ]

  // 查看详情
  const handleViewDetail = (plan: PaymentPlan) => {
    setSelectedPlan(plan)
    setDetailVisible(true)
  }

  // 编辑
  const handleEdit = (plan: PaymentPlan) => {
    setEditingPlan(plan)
    setFormVisible(true)
  }

  // 设置提醒
  const handleSetReminder = (plan: PaymentPlan) => {
    // TODO: 实现提醒设置功能
    message.info('提醒功能开发中...')
  }

  // 批量操作
  const handleBulkAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的记录')
      return
    }
    // TODO: 实现批量操作
    message.info(`批量${action}功能开发中...`)
  }

  // 导出数据
  const handleExport = () => {
    // TODO: 实现导出功能
    message.info('导出功能开发中...')
  }

  return (
    <div className="payment-reminders-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="应收总额"
              value={statistics?.total_receivable || 0}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已收总额"
              value={statistics?.total_received || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="逾期金额"
              value={statistics?.total_overdue || 0}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(value) => `${value.toLocaleString()}`}
              suffix={
                <Tooltip title={`${statistics?.overdue_count || 0} 笔逾期`}>
                  <Badge count={statistics?.overdue_count || 0} showZero />
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="回款率"
              value={statistics?.collection_rate || 0}
              suffix="%"
              precision={1}
              valueStyle={{
                color: statistics?.collection_rate >= 80 ? '#52c41a' : '#faad14'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主体内容 */}
      <Card>
        {/* 操作栏 */}
        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPlan(null)
                setFormVisible(true)
              }}
            >
              新增回款计划
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>

          {/* 筛选条件 */}
          <Space style={{ float: 'right' }}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters({
                    ...filters,
                    due_date_from: dates[0].format('YYYY-MM-DD'),
                    due_date_to: dates[1].format('YYYY-MM-DD')
                  })
                } else {
                  setFilters({
                    ...filters,
                    due_date_from: undefined,
                    due_date_to: undefined
                  })
                }
              }}
            />
            <Input.Search
              placeholder="搜索客户或合同"
              allowClear
              onSearch={(value) => {
                setFilters({
                  ...filters,
                  search: value || undefined
                })
              }}
              style={{ width: 200 }}
            />
          </Space>
        </div>

        {/* 标签页 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                全部
                <Badge
                  count={paymentPlans.length}
                  showZero
                  style={{ marginLeft: 8 }}
                />
              </span>
            }
            key="all"
          />
          <TabPane
            tab={
              <span>
                待回款
                <Badge
                  count={statistics?.by_status?.pending?.count || 0}
                  showZero
                  style={{ marginLeft: 8 }}
                  color="blue"
                />
              </span>
            }
            key="pending"
          />
          <TabPane
            tab={
              <span>
                已逾期
                <Badge
                  count={statistics?.overdue_count || 0}
                  showZero
                  style={{ marginLeft: 8 }}
                  color="red"
                />
              </span>
            }
            key="overdue"
          />
          <TabPane
            tab={
              <span>
                已完成
                <Badge
                  count={statistics?.by_status?.completed?.count || 0}
                  showZero
                  style={{ marginLeft: 8 }}
                  color="green"
                />
              </span>
            }
            key="completed"
          />
        </Tabs>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={paymentPlans}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            defaultPageSize: 10
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
        />
      </Card>

      {/* 新增/编辑表单 */}
      <PaymentPlanForm
        visible={formVisible}
        editingPlan={editingPlan}
        onClose={() => {
          setFormVisible(false)
          setEditingPlan(null)
        }}
        onSuccess={() => {
          setFormVisible(false)
          setEditingPlan(null)
          loadData()
        }}
      />

      {/* 详情抽屉 */}
      <PaymentDetailDrawer
        visible={detailVisible}
        plan={selectedPlan}
        onClose={() => {
          setDetailVisible(false)
          setSelectedPlan(null)
        }}
        onUpdate={loadData}
      />
    </div>
  )
}

export default PaymentReminders