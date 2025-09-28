import React, { useEffect, useState } from 'react'
import { Card, Button, Input, Space, Modal, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, SearchOutlined, UserOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons'
import { CustomerForm } from '../components/CustomerForm'
import { CustomerList } from '../components/CustomerList'
import { useCustomerStore } from '../store/customerStore'
import { Customer } from '../types'

const { Search } = Input

type CustomerFormData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

export const Customers: React.FC = () => {
  const {
    customers,
    loading,
    searchTerm,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setSearchTerm,
    getFilteredCustomers
  } = useCustomerStore()

  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setShowForm(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleSubmitCustomer = async (formData: CustomerFormData) => {
    try {
      if (editingCustomer) {
        const payload: Customer = {
          ...editingCustomer,
          ...formData,
          id: editingCustomer.id,
          createdAt: editingCustomer.createdAt,
          updatedAt: new Date().toISOString()
        }
        await updateCustomer(payload)
        message.success('客户信息更新成功')
      } else {
        const { id: _ignored, ...rest } = formData
        await addCustomer(rest)
        message.success('客户添加成功')
      }
      setShowForm(false)
      setEditingCustomer(null)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleDeleteCustomer = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCustomer(id)
          message.success('客户删除成功')
        } catch (error) {
          message.error('删除失败，请重试')
        }
      }
    })
  }

  const handleViewCustomer = (customer: Customer) => {
    console.log('View customer:', customer)
  }

  const filteredCustomers = getFilteredCustomers()

  const now = new Date()
  const stats = {
    total: customers.length,
    highImportance: customers.filter(c => c.importance === 'high').length,
    needFollowUp: customers.filter(c => c.nextFollowUpDate && new Date(c.nextFollowUpDate) <= now).length,
    potential: customers.filter(c => c.status === 'potential').length
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总客户数"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="重要客户"
              value={stats.highImportance}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待跟进"
              value={stats.needFollowUp}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="潜在客户"
              value={stats.potential}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="客户管理"
        extra={
          <Space>
            <Search
              placeholder="搜索客户姓名、公司、电话、邮箱"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCustomer}
            >
              添加客户
            </Button>
          </Space>
        }
      >
        <CustomerList
          customers={filteredCustomers}
          loading={loading}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
          onView={handleViewCustomer}
        />
      </Card>

      <Modal
        title={editingCustomer ? '编辑客户' : '添加客户'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditingCustomer(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmitCustomer}
          onCancel={() => {
            setShowForm(false)
            setEditingCustomer(null)
          }}
        />
      </Modal>
    </div>
  )
}
