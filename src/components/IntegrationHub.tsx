import React, { useState, useEffect } from 'react'
import {
  Tabs,
  Card,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Modal,
  Drawer,
  Timeline,
  Calendar,
  Badge,
  Progress,
  Alert,
  Upload,
  Checkbox,
  Radio,
  Space,
  Divider,
  Tooltip,
  List,
  Avatar,
  Empty,
  Spin,
  notification,
  message
} from 'antd'
import {
  MailOutlined,
  CalendarOutlined,
  DashboardOutlined,
  PlusOutlined,
  SendOutlined,
  HistoryOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
  TeamOutlined,
  BulbOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  SyncOutlined,
  SettingOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { emailService, EmailTemplate, EmailMessage } from '../services/integrations/emailService'
import { calendarService, CalendarEvent, TimeSlot } from '../services/integrations/calendarService'

const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { Meta } = Card

interface IntegrationHubProps {
  className?: string
}

// Email composition component
const EmailComposer: React.FC = () => {
  const [form] = Form.useForm()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)

  useEffect(() => {
    setTemplates(emailService.getTemplates())
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      form.setFieldsValue({
        subject: template.subject,
        body: template.body
      })
    }
  }

  const handleSend = async (values: any) => {
    setLoading(true)
    try {
      const recipients = values.to.split(',').map((email: string) => email.trim())
      await emailService.sendEmail({
        to: recipients,
        cc: values.cc ? values.cc.split(',').map((email: string) => email.trim()) : undefined,
        subject: values.subject,
        body: values.body,
        templateId: selectedTemplate || undefined
      })
      message.success('邮件发送成功！')
      form.resetFields()
      setSelectedTemplate(null)
    } catch (error) {
      message.error('邮件发送失败：' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = () => {
    Modal.info({
      title: '定时发送',
      content: '定时发送功能正在开发中...'
    })
  }

  return (
    <Card title="邮件编写" extra={
      <Space>
        <Button icon={<FileTextOutlined />} onClick={() => setPreviewVisible(true)}>
          预览
        </Button>
        <Button type="primary" icon={<SendOutlined />} onClick={() => form.submit()} loading={loading}>
          发送
        </Button>
        <Button icon={<ClockCircleOutlined />} onClick={handleSchedule}>
          定时发送
        </Button>
      </Space>
    }>
      <Form form={form} layout="vertical" onFinish={handleSend}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="选择模板">
              <Select
                placeholder="选择邮件模板"
                allowClear
                onChange={handleTemplateSelect}
                value={selectedTemplate}
              >
                {templates.map(template => (
                  <Option key={template.id} value={template.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {template.category} | {template.variables.length} 个变量
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="优先级">
              <Select defaultValue="normal">
                <Option value="high">高优先级</Option>
                <Option value="normal">普通</Option>
                <Option value="low">低优先级</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="收件人"
          name="to"
          rules={[{ required: true, message: '请输入收件人邮箱' }]}
        >
          <Input placeholder="多个邮箱用逗号分隔" />
        </Form.Item>

        <Form.Item label="抄送" name="cc">
          <Input placeholder="多个邮箱用逗号分隔" />
        </Form.Item>

        <Form.Item
          label="主题"
          name="subject"
          rules={[{ required: true, message: '请输入邮件主题' }]}
        >
          <Input placeholder="邮件主题" />
        </Form.Item>

        <Form.Item
          label="邮件内容"
          name="body"
          rules={[{ required: true, message: '请输入邮件内容' }]}
        >
          <TextArea
            rows={10}
            placeholder="邮件内容..."
            showCount
            maxLength={5000}
          />
        </Form.Item>

        <Form.Item label="附件">
          <Upload>
            <Button icon={<UploadOutlined />}>上传附件</Button>
          </Upload>
        </Form.Item>
      </Form>

      <Modal
        title="邮件预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ border: '1px solid #d9d9d9', padding: '20px', borderRadius: '4px' }}>
          <h3>{form.getFieldValue('subject')}</h3>
          <Divider />
          <div style={{ whiteSpace: 'pre-line' }}>
            {form.getFieldValue('body')}
          </div>
        </div>
      </Modal>
    </Card>
  )
}

// Email history component
const EmailHistory: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<any>({})

  useEffect(() => {
    loadEmails()
  }, [filter])

  const loadEmails = () => {
    setLoading(true)
    setTimeout(() => {
      const history = emailService.getEmailHistory(filter)
      setEmails(history)
      setLoading(false)
    }, 500)
  }

  const getStatusColor = (status: EmailMessage['status']) => {
    const colors = {
      'draft': 'default',
      'sending': 'processing',
      'sent': 'success',
      'failed': 'error',
      'scheduled': 'warning'
    }
    return colors[status]
  }

  const getStatusText = (status: EmailMessage['status']) => {
    const texts = {
      'draft': '草稿',
      'sending': '发送中',
      'sent': '已发送',
      'failed': '发送失败',
      'scheduled': '已安排'
    }
    return texts[status]
  }

  const columns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EmailMessage['status']) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '收件人',
      dataIndex: 'to',
      key: 'to',
      render: (to: string[]) => (
        <div>
          {to.slice(0, 2).map(email => (
            <Tag key={email} style={{ marginBottom: '4px' }}>{email}</Tag>
          ))}
          {to.length > 2 && <Tag>+{to.length - 2} 更多</Tag>}
        </div>
      )
    },
    {
      title: '主题',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true
    },
    {
      title: '发送时间',
      dataIndex: 'sentTime',
      key: 'sentTime',
      width: 150,
      render: (time: Date) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: EmailMessage) => (
        <Space>
          <Button size="small" type="link">查看</Button>
          {record.status === 'failed' && (
            <Button size="small" type="link" danger>重发</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Card
      title="邮件历史"
      extra={
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilter({ ...filter, status: value })}
          >
            <Option value="sent">已发送</Option>
            <Option value="failed">发送失败</Option>
            <Option value="scheduled">已安排</Option>
          </Select>
          <Button icon={<SyncOutlined />} onClick={loadEmails}>刷新</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={emails}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />
    </Card>
  )
}

// Bulk email campaign component
const BulkEmailCampaign: React.FC = () => {
  const [form] = Form.useForm()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [recipients, setRecipients] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setTemplates(emailService.getTemplates())
  }, [])

  const handleFileUpload = (file: File) => {
    // 模拟CSV文件解析
    const sampleRecipients = [
      { email: 'customer1@example.com', name: '客户一', company: '公司A' },
      { email: 'customer2@example.com', name: '客户二', company: '公司B' },
      { email: 'customer3@example.com', name: '客户三', company: '公司C' },
    ]
    setRecipients(sampleRecipients)
    message.success(`成功导入 ${sampleRecipients.length} 个收件人`)
    return false // 阻止默认上传
  }

  const handleBulkSend = async (values: any) => {
    if (recipients.length === 0) {
      message.error('请先导入收件人列表')
      return
    }

    setSending(true)
    setProgress(0)

    try {
      const recipientData = recipients.map(r => ({
        email: r.email,
        variables: {
          customer_name: r.name,
          company_name: r.company
        }
      }))

      // 模拟批量发送进度
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      await emailService.bulkSend(recipientData, values.templateId)
      message.success('批量邮件发送完成！')
      setProgress(0)
      setRecipients([])
      form.resetFields()
    } catch (error) {
      message.error('批量发送失败：' + (error as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card title="批量邮件活动">
      <Form form={form} layout="vertical" onFinish={handleBulkSend}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="选择模板"
              name="templateId"
              rules={[{ required: true, message: '请选择邮件模板' }]}
            >
              <Select placeholder="选择邮件模板">
                {templates.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="发送计划">
              <Select defaultValue="now">
                <Option value="now">立即发送</Option>
                <Option value="schedule">定时发送</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="收件人列表">
          <Upload
            accept=".csv,.xlsx"
            beforeUpload={handleFileUpload}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              导入收件人 (CSV/Excel)
            </Button>
          </Upload>

          {recipients.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message={`已导入 ${recipients.length} 个收件人`}
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Table
                size="small"
                dataSource={recipients.slice(0, 5)}
                columns={[
                  { title: '邮箱', dataIndex: 'email', key: 'email' },
                  { title: '姓名', dataIndex: 'name', key: 'name' },
                  { title: '公司', dataIndex: 'company', key: 'company' }
                ]}
                pagination={false}
              />
              {recipients.length > 5 && (
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  ... 还有 {recipients.length - 5} 个收件人
                </div>
              )}
            </div>
          )}
        </Form.Item>

        {sending && (
          <Form.Item>
            <Progress percent={progress} status="active" />
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              正在发送邮件...
            </div>
          </Form.Item>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={sending}
            disabled={recipients.length === 0}
            size="large"
            block
          >
            {sending ? '发送中...' : '开始批量发送'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

// Email statistics component
const EmailStats: React.FC = () => {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = () => {
    setLoading(true)
    setTimeout(() => {
      const statistics = emailService.getEmailStats()
      setStats(statistics)
      setLoading(false)
    }, 500)
  }

  if (loading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '50px' }} />
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总邮件数"
              value={stats.total}
              prefix={<MailOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="发送成功"
              value={stats.sent}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="发送失败"
              value={stats.failed}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待发送"
              value={stats.scheduled}
              valueStyle={{ color: '#d46b08' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="邮件打开率">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={Math.round(stats.openRate * 100)}
                format={percent => `${percent}%`}
                strokeColor="#52c41a"
              />
              <div style={{ marginTop: '16px', color: '#666' }}>
                平均打开率
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="邮件点击率">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={Math.round(stats.clickRate * 100)}
                format={percent => `${percent}%`}
                strokeColor="#1890ff"
              />
              <div style={{ marginTop: '16px', color: '#666' }}>
                平均点击率
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

// Calendar view component
const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [eventModalVisible, setEventModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    loadEvents()
  }, [selectedDate, viewMode])

  const loadEvents = () => {
    let eventList: CalendarEvent[] = []

    switch (viewMode) {
      case 'day':
        eventList = calendarService.getEvents({
          startDate: selectedDate.startOf('day').toDate(),
          endDate: selectedDate.endOf('day').toDate()
        })
        break
      case 'week':
        eventList = calendarService.getWeekEvents(selectedDate.toDate())
        break
      case 'month':
        eventList = calendarService.getMonthEvents(selectedDate.toDate())
        break
    }

    setEvents(eventList)
  }

  const getEventColor = (event: CalendarEvent) => {
    const colors = {
      'meeting': '#1890ff',
      'call': '#52c41a',
      'task': '#faad14',
      'reminder': '#722ed1',
      'holiday': '#eb2f96'
    }
    return colors[event.type] || '#d9d9d9'
  }

  const dateCellRender = (value: Dayjs) => {
    const dayEvents = events.filter(event =>
      dayjs(event.startTime).isSame(value, 'day')
    )

    return (
      <div>
        {dayEvents.slice(0, 3).map(event => (
          <div
            key={event.id}
            style={{
              backgroundColor: getEventColor(event),
              color: 'white',
              padding: '2px 4px',
              margin: '1px 0',
              borderRadius: '2px',
              fontSize: '11px',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              setSelectedEvent(event)
              setEventModalVisible(true)
            }}
          >
            {event.title}
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div style={{ fontSize: '11px', color: '#666' }}>
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <Card
        title="日历视图"
        extra={
          <Space>
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="day">日</Radio.Button>
              <Radio.Button value="week">周</Radio.Button>
              <Radio.Button value="month">月</Radio.Button>
            </Radio.Group>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedEvent(null)
                setEventModalVisible(true)
              }}
            >
              新建事件
            </Button>
          </Space>
        }
      >
        <Calendar
          value={selectedDate}
          onSelect={setSelectedDate}
          dateCellRender={dateCellRender}
        />
      </Card>

      <Modal
        title={selectedEvent ? '事件详情' : '新建事件'}
        open={eventModalVisible}
        onCancel={() => setEventModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedEvent ? (
          <div>
            <h3>{selectedEvent.title}</h3>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <strong>开始时间：</strong>
                {dayjs(selectedEvent.startTime).format('YYYY-MM-DD HH:mm')}
              </Col>
              <Col span={12}>
                <strong>结束时间：</strong>
                {dayjs(selectedEvent.endTime).format('YYYY-MM-DD HH:mm')}
              </Col>
            </Row>
            <br />
            <Row gutter={16}>
              <Col span={12}>
                <strong>类型：</strong>
                <Tag color={getEventColor(selectedEvent)}>{selectedEvent.type}</Tag>
              </Col>
              <Col span={12}>
                <strong>状态：</strong>
                <Tag>{selectedEvent.status}</Tag>
              </Col>
            </Row>
            {selectedEvent.description && (
              <>
                <br />
                <strong>描述：</strong>
                <p>{selectedEvent.description}</p>
              </>
            )}
            {selectedEvent.location && (
              <>
                <strong>地点：</strong>
                <p>{selectedEvent.location}</p>
              </>
            )}
            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <>
                <strong>参与者：</strong>
                <div style={{ marginTop: '8px' }}>
                  {selectedEvent.attendees.map(attendee => (
                    <Tag key={attendee.email} style={{ marginBottom: '4px' }}>
                      {attendee.name} ({attendee.email})
                    </Tag>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <EventForm onSave={() => {
            setEventModalVisible(false)
            loadEvents()
          }} />
        )}
      </Modal>
    </div>
  )
}

// Event creation form
const EventForm: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await calendarService.createEvent({
        title: values.title,
        description: values.description,
        location: values.location,
        startTime: values.timeRange[0].toDate(),
        endTime: values.timeRange[1].toDate(),
        type: values.type,
        priority: values.priority,
        category: values.category,
        createdBy: 'current-user'
      })
      message.success('事件创建成功！')
      form.resetFields()
      onSave()
    } catch (error) {
      message.error('创建失败：' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="事件标题"
        name="title"
        rules={[{ required: true, message: '请输入事件标题' }]}
      >
        <Input placeholder="事件标题" />
      </Form.Item>

      <Form.Item
        label="时间范围"
        name="timeRange"
        rules={[{ required: true, message: '请选择时间范围' }]}
      >
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="类型" name="type" initialValue="meeting">
            <Select>
              <Option value="meeting">会议</Option>
              <Option value="call">电话</Option>
              <Option value="task">任务</Option>
              <Option value="reminder">提醒</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="优先级" name="priority" initialValue="medium">
            <Select>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="地点" name="location">
        <Input placeholder="事件地点" />
      </Form.Item>

      <Form.Item label="描述" name="description">
        <TextArea rows={3} placeholder="事件描述" />
      </Form.Item>

      <Form.Item label="分类" name="category" initialValue="sales">
        <Select>
          <Option value="sales">销售</Option>
          <Option value="support">支持</Option>
          <Option value="internal">内部</Option>
          <Option value="personal">个人</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          创建事件
        </Button>
      </Form.Item>
    </Form>
  )
}

// Available time slots finder
const TimeSlotFinder: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [duration, setDuration] = useState(60)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  const findSlots = () => {
    setLoading(true)
    setTimeout(() => {
      const slots = calendarService.findAvailableSlots(
        selectedDate.toDate(),
        duration,
        {
          startHour: 9,
          endHour: 18,
          excludeWeekends: true
        }
      )
      setTimeSlots(slots)
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    findSlots()
  }, [selectedDate, duration])

  const handleBookSlot = (slot: TimeSlot) => {
    Modal.confirm({
      title: '预订时间段',
      content: `确定要预订 ${dayjs(slot.start).format('HH:mm')} - ${dayjs(slot.end).format('HH:mm')} 的时间段吗？`,
      onOk: () => {
        message.success('时间段预订成功！')
        findSlots()
      }
    })
  }

  return (
    <Card title="可用时间段查找">
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={12}>
          <div style={{ marginBottom: '8px' }}>选择日期：</div>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={12}>
          <div style={{ marginBottom: '8px' }}>会议时长（分钟）：</div>
          <Select
            value={duration}
            onChange={setDuration}
            style={{ width: '100%' }}
          >
            <Option value={30}>30分钟</Option>
            <Option value={60}>1小时</Option>
            <Option value={90}>1.5小时</Option>
            <Option value={120}>2小时</Option>
          </Select>
        </Col>
      </Row>

      <Divider />

      <Spin spinning={loading}>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {timeSlots.length === 0 ? (
            <Empty description="当天没有可用时间段" />
          ) : (
            <List
              dataSource={timeSlots}
              renderItem={(slot) => (
                <List.Item
                  actions={slot.available ? [
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleBookSlot(slot)}
                    >
                      预订
                    </Button>
                  ] : []}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        status={slot.available ? 'success' : 'error'}
                        text={slot.available ? '可用' : '已占用'}
                      />
                    }
                    title={`${dayjs(slot.start).format('HH:mm')} - ${dayjs(slot.end).format('HH:mm')}`}
                    description={`时长: ${duration} 分钟`}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Spin>
    </Card>
  )
}

// Communication dashboard with recent activities
const CommunicationDashboard: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = () => {
    setLoading(true)
    setTimeout(() => {
      // Mock activity data
      const mockActivities = [
        {
          id: 1,
          type: 'email',
          title: '发送邮件给客户A',
          description: '关于产品演示的邮件已发送',
          time: dayjs().subtract(1, 'hour'),
          status: 'success',
          icon: <MailOutlined />
        },
        {
          id: 2,
          type: 'meeting',
          title: '客户会议',
          description: '与重要客户B的产品讨论会议',
          time: dayjs().subtract(2, 'hour'),
          status: 'success',
          icon: <CalendarOutlined />
        },
        {
          id: 3,
          type: 'call',
          title: '跟进电话',
          description: '联系潜在客户C了解需求',
          time: dayjs().subtract(3, 'hour'),
          status: 'success',
          icon: <UserOutlined />
        },
        {
          id: 4,
          type: 'email',
          title: '邮件发送失败',
          description: '发送给客户D的邮件因地址错误而失败',
          time: dayjs().subtract(4, 'hour'),
          status: 'error',
          icon: <MailOutlined />
        }
      ]
      setActivities(mockActivities)
      setLoading(false)
    }, 500)
  }

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'green' : status === 'error' ? 'red' : 'blue'
  }

  return (
    <Row gutter={16}>
      <Col span={16}>
        <Card title="最近活动" loading={loading}>
          <Timeline>
            {activities.map(activity => (
              <Timeline.Item
                key={activity.id}
                color={getStatusColor(activity.status)}
                dot={activity.icon}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {activity.title}
                  </div>
                  <div style={{ color: '#666', marginBottom: '4px' }}>
                    {activity.description}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {activity.time.fromNow()}
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Col>

      <Col span={8}>
        <Card title="快速操作" style={{ marginBottom: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<MailOutlined />}
              block
              onClick={() => message.info('跳转到邮件编写')}
            >
              发送邮件
            </Button>
            <Button
              icon={<CalendarOutlined />}
              block
              onClick={() => message.info('跳转到日程安排')}
            >
              安排会议
            </Button>
            <Button
              icon={<UserOutlined />}
              block
              onClick={() => message.info('跳转到客户管理')}
            >
              联系客户
            </Button>
            <Button
              icon={<BulbOutlined />}
              block
              onClick={() => message.info('跳转到任务提醒')}
            >
              创建提醒
            </Button>
          </Space>
        </Card>

        <Card title="集成状态">
          <List
            size="small"
            dataSource={[
              { name: '邮件服务', status: 'connected', color: 'success' },
              { name: '日历服务', status: 'connected', color: 'success' },
              { name: '通讯录', status: 'connected', color: 'success' },
              { name: '客户系统', status: 'disconnected', color: 'error' }
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={
                    <Badge
                      status={item.color as any}
                      text={item.status === 'connected' ? '已连接' : '未连接'}
                    />
                  }
                />
                <Button size="small" type="link">
                  {item.status === 'connected' ? '管理' : '连接'}
                </Button>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  )
}

// Main IntegrationHub component
const IntegrationHub: React.FC<IntegrationHubProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className={className} style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          集成中心
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          统一管理邮件、日历和通讯功能
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        tabBarStyle={{ marginBottom: '24px' }}
      >
        <TabPane
          tab={
            <span>
              <DashboardOutlined />
              通讯总览
            </span>
          }
          key="dashboard"
        >
          <CommunicationDashboard />
        </TabPane>

        <TabPane
          tab={
            <span>
              <MailOutlined />
              邮件中心
            </span>
          }
          key="email"
        >
          <Tabs defaultActiveKey="compose" type="card">
            <TabPane tab="邮件编写" key="compose">
              <EmailComposer />
            </TabPane>
            <TabPane tab="邮件历史" key="history">
              <EmailHistory />
            </TabPane>
            <TabPane tab="批量邮件" key="bulk">
              <BulkEmailCampaign />
            </TabPane>
            <TabPane tab="邮件统计" key="stats">
              <EmailStats />
            </TabPane>
          </Tabs>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              日历集成
            </span>
          }
          key="calendar"
        >
          <Tabs defaultActiveKey="calendar" type="card">
            <TabPane tab="日历视图" key="calendar">
              <CalendarView />
            </TabPane>
            <TabPane tab="时间段查找" key="timeslots">
              <TimeSlotFinder />
            </TabPane>
          </Tabs>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default IntegrationHub