/**
 * 回款详情抽屉组件
 */

import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Descriptions,
  Space,
  Button,
  Tabs,
  Table,
  Timeline,
  Tag,
  Progress,
  Statistic,
  Row,
  Col,
  Card,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Input,
  Select,
  message,
  Empty,
  Alert,
  List,
  Avatar,
  Typography,
  Divider,
  Popconfirm
} from 'antd'
import {
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { PaymentPlan, PaymentRecord, ReminderRule, PaymentStatus } from '@/types/payment'
import { paymentService } from '@/services/paymentService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { TabPane } = Tabs
const { Text, Title } = Typography

interface PaymentDetailDrawerProps {
  visible: boolean
  plan: PaymentPlan | null
  onClose: () => void
  onUpdate: () => void
}

const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  visible,
  plan,
  onClose,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([])
  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [recordForm] = Form.useForm()
  const [reminderForm] = Form.useForm()

  useEffect(() => {
    if (visible && plan) {
      loadDetailData()
    }
  }, [visible, plan])

  // 加载详细数据
  const loadDetailData = async () => {
    if (!plan) return

    setLoading(true)
    try {
      const { data } = await paymentService.getPaymentPlan(plan.id)
      if (data) {
        setPaymentRecords(data.payment_records || [])
        setReminderRules(data.reminder_rules || [])
      }
    } catch (error) {
      message.error('加载详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取状态配置
  const getStatusConfig = (status: PaymentStatus) => {
    const configs = {
      pending: { color: 'blue', text: '待回款', icon: <ClockCircleOutlined /> },
      partial: { color: 'orange', text: '部分回款', icon: <ExclamationCircleOutlined /> },
      completed: { color: 'green', text: '已回款', icon: <CheckCircleOutlined /> },
      overdue: { color: 'red', text: '已逾期', icon: <WarningOutlined /> },
      cancelled: { color: 'default', text: '已取消', icon: null }
    }
    return configs[status] || configs.pending
  }

  // 添加回款记录
  const handleAddRecord = async () => {
    if (!plan) return

    try {
      const values = await recordForm.validateFields()
      setLoading(true)

      const result = await paymentService.addPaymentRecord({
        payment_plan_id: plan.id,
        amount: values.amount,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        payment_method: values.payment_method,
        transaction_number: values.transaction_number,
        notes: values.notes
      })

      if (result.error) {
        throw result.error
      }

      message.success('添加回款记录成功')
      setRecordModalVisible(false)
      recordForm.resetFields()
      loadDetailData()
      onUpdate()
    } catch (error: any) {
      message.error(error.message || '添加失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除回款记录
  const handleDeleteRecord = async (recordId: string) => {
    try {
      setLoading(true)
      const result = await paymentService.deletePaymentRecord(recordId)

      if (result.error) {
        throw result.error
      }

      message.success('删除回款记录成功')
      loadDetailData()
      onUpdate()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 添加提醒规则
  const handleAddReminder = async () => {
    if (!plan) return

    try {
      const values = await reminderForm.validateFields()
      setLoading(true)

      const result = await paymentService.createReminderRule({
        payment_plan_id: plan.id,
        name: values.name,
        enabled: true,
        trigger_days_before: values.trigger_days_before,
        frequency: values.frequency,
        channels: values.channels,
        recipients: values.recipients || [],
        message_template: values.message_template
      })

      if (result.error) {
        throw result.error
      }

      message.success('添加提醒规则成功')
      setReminderModalVisible(false)
      reminderForm.resetFields()
      loadDetailData()
    } catch (error: any) {
      message.error(error.message || '添加失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除提醒规则
  const handleDeleteReminder = async (ruleId: string) => {
    try {
      setLoading(true)
      const result = await paymentService.deleteReminderRule(ruleId)

      if (result.error) {
        throw result.error
      }

      message.success('删除提醒规则成功')
      loadDetailData()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  if (!plan) return null

  const statusConfig = getStatusConfig(plan.status)
  const progress = plan.total_amount
    ? Math.round((plan.received_amount / plan.total_amount) * 100)
    : 0

  return (
    <Drawer
      title={
        <Space>
          <DollarOutlined />
          回款计划详情
        </Space>
      }
      placement="right"
      width={800}
      visible={visible}
      onClose={onClose}
      bodyStyle={{ padding: 0 }}
    >
      {/* 顶部统计卡片 */}
      <div style={{ padding: '16px 24px', background: '#f0f2f5' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="应收总额"
                value={plan.total_amount}
                prefix="¥"
                precision={2}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="已收金额"
                value={plan.received_amount}
                prefix="¥"
                precision={2}
                valueStyle={{ fontSize: 20, color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="剩余应收"
                value={plan.remaining_amount}
                prefix="¥"
                precision={2}
                valueStyle={{
                  fontSize: 20,
                  color: plan.remaining_amount > 0 ? '#ff4d4f' : '#52c41a'
                }}
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>回款进度</span>
            <span>{progress}%</span>
          </div>
          <Progress
            percent={progress}
            status={plan.status === 'completed' ? 'success' : 'active'}
            strokeWidth={10}
          />
        </div>
      </div>

      {/* 标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '0 24px' }}>
        <TabPane tab="基本信息" key="detail">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="客户名称">
              {plan.customer_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="合同编号">
              {plan.contract_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="应收日期">
              <CalendarOutlined style={{ marginRight: 4 }} />
              {plan.due_date ? dayjs(plan.due_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际回款日期">
              {plan.actual_date ? dayjs(plan.actual_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="期数">
              第 {plan.installment} 期 / 共 {plan.total_installments} 期
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="货币单位">
              {plan.currency || 'CNY'}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {plan.owner_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {plan.created_at ? dayjs(plan.created_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {plan.updated_at ? dayjs(plan.updated_at).fromNow() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {plan.notes || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* 逾期提醒 */}
          {plan.status === 'overdue' && (
            <Alert
              message="回款已逾期"
              description={`已逾期 ${dayjs().diff(dayjs(plan.due_date), 'day')} 天，请及时跟进处理`}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              回款记录
              <Badge count={paymentRecords.length} style={{ marginLeft: 8 }} />
            </span>
          }
          key="records"
        >
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                recordForm.resetFields()
                setRecordModalVisible(true)
              }}
            >
              添加回款记录
            </Button>
          </div>

          {paymentRecords.length > 0 ? (
            <Timeline>
              {paymentRecords.map(record => (
                <Timeline.Item
                  key={record.id}
                  dot={<DollarOutlined style={{ fontSize: 16 }} />}
                  color="green"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>¥{record.amount.toLocaleString()}</Text>
                        <Text type="secondary" style={{ marginLeft: 12 }}>
                          {dayjs(record.payment_date).format('YYYY-MM-DD')}
                        </Text>
                      </div>
                      {record.payment_method && (
                        <div>
                          <Text type="secondary">支付方式：{record.payment_method}</Text>
                        </div>
                      )}
                      {record.transaction_number && (
                        <div>
                          <Text type="secondary">交易号：{record.transaction_number}</Text>
                        </div>
                      )}
                      {record.notes && (
                        <div>
                          <Text type="secondary">备注：{record.notes}</Text>
                        </div>
                      )}
                      {record.verified && (
                        <Tag color="green" icon={<CheckCircleOutlined />}>已核实</Tag>
                      )}
                    </div>
                    <Popconfirm
                      title="确定删除这条回款记录吗？"
                      onConfirm={() => handleDeleteRecord(record.id)}
                    >
                      <Button type="link" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Empty description="暂无回款记录" />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              提醒设置
              <Badge count={reminderRules.length} style={{ marginLeft: 8 }} />
            </span>
          }
          key="reminders"
        >
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                reminderForm.resetFields()
                setReminderModalVisible(true)
              }}
            >
              添加提醒规则
            </Button>
          </div>

          {reminderRules.length > 0 ? (
            <List
              dataSource={reminderRules}
              renderItem={rule => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteReminder(rule.id)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} />}
                    title={rule.name}
                    description={
                      <Space direction="vertical" size="small">
                        <Text>提前 {rule.trigger_days_before} 天提醒</Text>
                        <Text>频率：{rule.frequency === 'once' ? '一次' : rule.frequency}</Text>
                        <Space>
                          渠道：
                          {rule.channels.map(channel => (
                            <Tag key={channel}>{channel}</Tag>
                          ))}
                        </Space>
                        {rule.enabled ? (
                          <Tag color="green">已启用</Tag>
                        ) : (
                          <Tag>已禁用</Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无提醒规则" />
          )}
        </TabPane>
      </Tabs>

      {/* 添加回款记录弹窗 */}
      <Modal
        title="添加回款记录"
        visible={recordModalVisible}
        onOk={handleAddRecord}
        onCancel={() => setRecordModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={recordForm} layout="vertical">
          <Form.Item
            name="amount"
            label="回款金额"
            rules={[
              { required: true, message: '请输入回款金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入回款金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/¥\s?|(,*)/g, '')}
              precision={2}
              max={plan.remaining_amount}
            />
          </Form.Item>
          <Form.Item
            name="payment_date"
            label="回款日期"
            rules={[{ required: true, message: '请选择回款日期' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="payment_method"
            label="支付方式"
          >
            <Select placeholder="请选择支付方式">
              <Select.Option value="银行转账">银行转账</Select.Option>
              <Select.Option value="支票">支票</Select.Option>
              <Select.Option value="现金">现金</Select.Option>
              <Select.Option value="承兑汇票">承兑汇票</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="transaction_number"
            label="交易号"
          >
            <Input placeholder="请输入交易号" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加提醒规则弹窗 */}
      <Modal
        title="添加提醒规则"
        visible={reminderModalVisible}
        onOk={handleAddReminder}
        onCancel={() => setReminderModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={reminderForm} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="如：到期前3天提醒" />
          </Form.Item>
          <Form.Item
            name="trigger_days_before"
            label="提前天数"
            rules={[
              { required: true, message: '请输入提前天数' },
              { type: 'number', min: 0, message: '天数不能为负' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="提前几天提醒"
              min={0}
              max={365}
            />
          </Form.Item>
          <Form.Item
            name="frequency"
            label="提醒频率"
            rules={[{ required: true, message: '请选择提醒频率' }]}
          >
            <Select placeholder="请选择提醒频率">
              <Select.Option value="once">一次</Select.Option>
              <Select.Option value="daily">每天</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="channels"
            label="提醒渠道"
            rules={[{ required: true, message: '请选择提醒渠道' }]}
          >
            <Select mode="multiple" placeholder="请选择提醒渠道">
              <Select.Option value="system">系统内提醒</Select.Option>
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="message_template"
            label="消息模板"
          >
            <Input.TextArea
              rows={3}
              placeholder="提醒消息内容，支持变量：{customer_name}, {amount}, {due_date}"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  )
}

export default PaymentDetailDrawer