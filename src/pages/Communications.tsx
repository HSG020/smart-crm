import React, { useEffect, useState } from 'react'
import { Card, Button, Space, Modal, message, Select, Row, Col, Statistic, DatePicker } from 'antd'
import { PlusOutlined, MessageOutlined, PhoneOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons'
import { CommunicationForm } from '../components/CommunicationForm'
import { CommunicationTimeline } from '../components/CommunicationTimeline'
import { useCommunicationStore } from '../store/communicationStore'
import { useCustomerStore } from '../store/customerStore'
import { Communication } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

type CommunicationFormData = Partial<Communication> & { customerId: string }

export const Communications: React.FC = () => {
  const {
    communications,
    loading,
    loadCommunications,
    addCommunication,
    updateCommunication,
    deleteCommunication,
    getCustomerCommunications,
    getRecentCommunications
  } = useCommunicationStore()

  const { customers, loadCustomers } = useCustomerStore()

  const [showForm, setShowForm] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  useEffect(() => {
    loadCommunications()
    loadCustomers()
  }, [loadCommunications, loadCustomers])

  const handleAddCommunication = () => {
    setEditingCommunication(null)
    setShowForm(true)
  }

  const handleEditCommunication = (communication: Communication) => {
    setEditingCommunication(communication)
    setShowForm(true)
  }

  const handleSubmitCommunication = async (communication: CommunicationFormData) => {
    try {
      if (editingCommunication) {
        const payload: Communication = {
          ...editingCommunication,
          ...communication,
          id: editingCommunication.id,
          customerId: communication.customerId,
          createdAt: communication.createdAt ?? editingCommunication.createdAt
        }
        await updateCommunication(payload)
        message.success('沟通记录更新成功')
      } else {
        const { id: _ignored, customerName: _customerName, ...rest } = communication
        await addCommunication({
          customerId: rest.customerId,
          type: rest.type ?? 'call',
          content: rest.content ?? '',
          result: rest.result ?? '',
          nextAction: rest.nextAction,
          attachments: rest.attachments,
          createdAt: rest.createdAt ?? new Date().toISOString()
        })
        message.success('沟通记录添加成功')
      }
      setShowForm(false)
      setEditingCommunication(null)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleDeleteCommunication = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条沟通记录吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCommunication(id)
          message.success('沟通记录删除成功')
        } catch (error) {
          message.error('删除失败，请重试')
        }
      }
    })
  }

  // 过滤沟通记录
  const getFilteredCommunications = () => {
    let filtered = communications

    // 按客户过滤
    if (selectedCustomerId) {
      filtered = getCustomerCommunications(selectedCustomerId)
    }

    // 按日期范围过滤
    if (dateRange) {
      const [start, end] = dateRange
      filtered = filtered.filter(comm => {
        const commDate = dayjs(comm.createdAt)
        return commDate.isAfter(start.startOf('day')) && commDate.isBefore(end.endOf('day'))
      })
    }

    return filtered
  }

  const filteredCommunications = getFilteredCommunications()

  // 统计数据
  const stats = {
    total: communications.length,
    thisWeek: getRecentCommunications(7).length,
    calls: communications.filter(c => c.type === 'call').length,
    meetings: communications.filter(c => c.type === 'meeting').length,
    emails: communications.filter(c => c.type === 'email').length
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总沟通次数"
              value={stats.total}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本周沟通"
              value={stats.thisWeek}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="电话沟通"
              value={stats.calls}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="会议次数"
              value={stats.meetings}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card
        title="沟通历史"
        extra={
          <Space>
            <Select
              placeholder="选择客户"
              style={{ width: 200 }}
              allowClear
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              showSearch
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.company}
                </Option>
              ))}
            </Select>
            
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
            
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCommunication}
            >
              添加记录
            </Button>
          </Space>
        }
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px 0' }}>
          <CommunicationTimeline
            communications={filteredCommunications}
            customers={customers}
            onEdit={handleEditCommunication}
            onDelete={handleDeleteCommunication}
          />
        </div>
      </Card>

      {/* 添加/编辑表单模态框 */}
      <Modal
        title={editingCommunication ? '编辑沟通记录' : '添加沟通记录'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditingCommunication(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CommunicationForm
          communication={editingCommunication}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSubmit={handleSubmitCommunication}
          onCancel={() => {
            setShowForm(false)
            setEditingCommunication(null)
          }}
        />
      </Modal>
    </div>
  )
}
