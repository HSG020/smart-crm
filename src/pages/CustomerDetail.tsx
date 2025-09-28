import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tabs,
  Timeline,
  Tag,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useCustomerStore } from '../store/customerStore'
import { useCommunicationStore } from '../store/communicationStore'
import { useOpportunityStore } from '../store/opportunityStore'
import { Customer } from '../types'
import dayjs from 'dayjs'

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { customers, loadCustomers, updateCustomer, deleteCustomer } = useCustomerStore()
  const { communications, loadCommunications } = useCommunicationStore()
  const { opportunities, loadOpportunities } = useOpportunityStore()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Load all necessary data
        await Promise.all([
          loadCustomers(),
          loadCommunications(),
          loadOpportunities()
        ])

        // Find the specific customer
        const foundCustomer = customers.find(c => c.id === id)
        if (foundCustomer) {
          setCustomer(foundCustomer)
          form.setFieldsValue({
            ...foundCustomer,
            lastContactDate: foundCustomer.lastContactDate ? dayjs(foundCustomer.lastContactDate) : null,
            nextFollowUpDate: foundCustomer.nextFollowUpDate ? dayjs(foundCustomer.nextFollowUpDate) : null,
            birthday: foundCustomer.birthday ? dayjs(foundCustomer.birthday) : null
          })
        }
      } catch (error) {
        message.error('加载客户信息失败')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, loadCustomers, loadCommunications, loadOpportunities])

  // Update customer when customers list changes
  useEffect(() => {
    const foundCustomer = customers.find(c => c.id === id)
    if (foundCustomer) {
      setCustomer(foundCustomer)
    }
  }, [customers, id])

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除客户 "${customer?.name}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCustomer(id!)
          message.success('客户删除成功')
          navigate('/customers')
        } catch (error) {
          message.error('删除失败，请重试')
        }
      }
    })
  }

  const handleEdit = async (values: any) => {
    try {
      const updatedCustomer: Customer = {
        ...customer!,
        ...values,
        lastContactDate: values.lastContactDate?.toISOString(),
        nextFollowUpDate: values.nextFollowUpDate?.toISOString(),
        birthday: values.birthday?.format('YYYY-MM-DD'),
        updatedAt: new Date().toISOString()
      }

      await updateCustomer(updatedCustomer)
      message.success('客户信息更新成功')
      setEditModalVisible(false)
      setCustomer(updatedCustomer)
    } catch (error) {
      message.error('更新失败，请重试')
    }
  }

  // Get related data
  const customerCommunications = communications.filter(c => c.customerId === id)
  const customerOpportunities = opportunities.filter(o => o.customerId === id)

  const totalOpportunityValue = customerOpportunities.reduce((sum, o) => sum + o.value, 0)
  const closedWonOpportunities = customerOpportunities.filter(o => o.stage === 'closed_won')
  const closedWonValue = closedWonOpportunities.reduce((sum, o) => sum + o.value, 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载客户信息中..." />
      </div>
    )
  }

  if (!customer) {
    return (
      <Card>
        <Empty description="客户不存在">
          <Button onClick={() => navigate('/customers')}>返回客户列表</Button>
        </Empty>
      </Card>
    )
  }

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/customers')}
            >
              返回列表
            </Button>
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <h2 style={{ margin: 0 }}>{customer.name}</h2>
              <p style={{ margin: 0, color: '#666' }}>
                {customer.position} · {customer.company}
              </p>
            </div>
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditModalVisible(true)}
            >
              编辑
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除
            </Button>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="商机总数"
              value={customerOpportunities.length}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="商机总金额"
              value={totalOpportunityValue}
              prefix="¥"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成交金额"
              value={closedWonValue}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="沟通次数"
              value={customerCommunications.length}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Tabs defaultActiveKey="info">
          {/* Basic Info Tab */}
          <Tabs.TabPane tab="基本信息" key="info">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="姓名">{customer.name}</Descriptions.Item>
              <Descriptions.Item label="公司">{customer.company}</Descriptions.Item>
              <Descriptions.Item label="职位">{customer.position || '-'}</Descriptions.Item>
              <Descriptions.Item label="行业">{customer.industry || '-'}</Descriptions.Item>

              <Descriptions.Item label="联系电话">
                <Space>
                  <PhoneOutlined />
                  {customer.phone || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space>
                  <MailOutlined />
                  {customer.email || '-'}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="重要程度">
                <Tag color={
                  customer.importance === 'high' ? 'red' :
                  customer.importance === 'medium' ? 'orange' : 'blue'
                }>
                  {customer.importance === 'high' ? '高' :
                   customer.importance === 'medium' ? '中' : '低'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户状态">
                <Tag color={
                  customer.status === 'signed' ? 'green' :
                  customer.status === 'following' ? 'orange' :
                  customer.status === 'lost' ? 'red' : 'blue'
                }>
                  {customer.status === 'potential' ? '潜在客户' :
                   customer.status === 'following' ? '跟进中' :
                   customer.status === 'signed' ? '已签约' : '已流失'}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="最后联系时间">
                {customer.lastContactDate ? dayjs(customer.lastContactDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下次跟进时间">
                {customer.nextFollowUpDate ? dayjs(customer.nextFollowUpDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>

              <Descriptions.Item label="生日">
                {customer.birthday ? dayjs(customer.birthday).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                {customer.address || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="标签" span={2}>
                {customer.tags && customer.tags.length > 0 ? (
                  <Space wrap>
                    {customer.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                ) : '-'}
              </Descriptions.Item>

              <Descriptions.Item label="备注" span={2}>
                {customer.notes || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Tabs.TabPane>

          {/* Communication History Tab */}
          <Tabs.TabPane tab={`沟通记录 (${customerCommunications.length})`} key="communications">
            {customerCommunications.length > 0 ? (
              <Timeline mode="left">
                {customerCommunications.map(comm => (
                  <Timeline.Item
                    key={comm.id}
                    label={dayjs(comm.createdAt).format('YYYY-MM-DD HH:mm')}
                  >
                    <Card size="small">
                      <Tag color={
                        comm.type === 'phone' ? 'blue' :
                        comm.type === 'email' ? 'green' :
                        comm.type === 'meeting' ? 'orange' :
                        comm.type === 'wechat' ? 'purple' : 'default'
                      }>
                        {comm.type === 'phone' ? '电话' :
                         comm.type === 'email' ? '邮件' :
                         comm.type === 'meeting' ? '会议' :
                         comm.type === 'wechat' ? '微信' : '其他'}
                      </Tag>
                      <p style={{ marginTop: 8 }}>{comm.content}</p>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无沟通记录" />
            )}
          </Tabs.TabPane>

          {/* Opportunities Tab */}
          <Tabs.TabPane tab={`销售机会 (${customerOpportunities.length})`} key="opportunities">
            {customerOpportunities.length > 0 ? (
              <div>
                {customerOpportunities.map(opp => (
                  <Card key={opp.id} style={{ marginBottom: 16 }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <h3>{opp.name}</h3>
                        <Space>
                          <Tag color={
                            opp.stage === 'lead' ? 'blue' :
                            opp.stage === 'qualified' ? 'cyan' :
                            opp.stage === 'proposal' ? 'orange' :
                            opp.stage === 'negotiation' ? 'purple' :
                            opp.stage === 'closed_won' ? 'green' : 'red'
                          }>
                            {opp.stage === 'lead' ? '线索' :
                             opp.stage === 'qualified' ? '已确认' :
                             opp.stage === 'proposal' ? '方案' :
                             opp.stage === 'negotiation' ? '谈判' :
                             opp.stage === 'closed_won' ? '成交' : '失败'}
                          </Tag>
                          <span>预计金额: ¥{opp.value.toLocaleString()}</span>
                          <span>可能性: {opp.probability}%</span>
                          {opp.expectedCloseDate && (
                            <span>预计成交: {dayjs(opp.expectedCloseDate).format('YYYY-MM-DD')}</span>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="暂无销售机会" />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Edit Modal */}
      <Modal
        title="编辑客户信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company"
                label="公司名称"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="职位">
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="行业">
                <Input placeholder="请输入行业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="importance" label="重要程度">
                <Select placeholder="请选择重要程度">
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="low">低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="客户状态">
                <Select placeholder="请选择客户状态">
                  <Select.Option value="potential">潜在客户</Select.Option>
                  <Select.Option value="following">跟进中</Select.Option>
                  <Select.Option value="signed">已签约</Select.Option>
                  <Select.Option value="lost">已流失</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lastContactDate" label="最后联系时间">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextFollowUpDate" label="下次跟进时间">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="birthday" label="生日">
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>

          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
