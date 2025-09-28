import React, { useState } from 'react'
import { Card, Button, Space, Modal, Form, Input, Select, message, Table, Tag, Checkbox } from 'antd'
import { 
  SendOutlined, 
  DownloadOutlined, 
  UploadOutlined,
  AppstoreOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons'
import { Customer } from '../types'

const { TextArea } = Input
const { Option } = Select

interface BatchOperationsProps {
  customers: Customer[]
  onBatchUpdate: (customerIds: string[], updates: Partial<Customer>) => void
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  customers,
  onBatchUpdate
}) => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showBatchMessage, setShowBatchMessage] = useState(false)
  const [showBatchUpdate, setShowBatchUpdate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form] = Form.useForm()
  const [updateForm] = Form.useForm()

  // 批量发送消息
  const handleBatchMessage = async (values: any) => {
    try {
      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id))
      
      // 模拟发送消息
      for (const customer of selectedCustomerData) {
        console.log(`发送${values.type}给${customer.name}: ${values.content}`)
      }
      
      message.success(`成功向${selectedCustomers.length}个客户发送${values.type === 'sms' ? '短信' : '邮件'}`)
      setShowBatchMessage(false)
      form.resetFields()
      setSelectedCustomers([])
    } catch (error) {
      message.error('发送失败，请重试')
    }
  }

  // 批量更新客户信息
  const handleBatchUpdate = async (values: any) => {
    try {
      const updates: Partial<Customer> = {}
      
      if (values.importance) updates.importance = values.importance
      if (values.status) updates.status = values.status
      if (values.industry) updates.industry = values.industry
      if (values.tags) updates.tags = values.tags
      
      await onBatchUpdate(selectedCustomers, updates)
      message.success(`成功更新${selectedCustomers.length}个客户信息`)
      setShowBatchUpdate(false)
      updateForm.resetFields()
      setSelectedCustomers([])
    } catch (error) {
      message.error('更新失败，请重试')
    }
  }

  // 导出客户数据
  const handleExport = () => {
    const exportData = customers.map(customer => ({
      姓名: customer.name,
      公司: customer.company,
      职位: customer.position,
      电话: customer.phone,
      邮箱: customer.email,
      行业: customer.industry,
      重要程度: customer.importance === 'high' ? '高' : customer.importance === 'medium' ? '中' : '低',
      状态: customer.status,
      标签: customer.tags?.join(', ') || '',
      创建时间: new Date(customer.createdAt).toLocaleDateString()
    }))

    // 转换为CSV格式
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n')

    // 下载文件
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `客户数据_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success('客户数据导出成功')
  }

  // 导入客户数据
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        message.info('导入功能开发中，支持CSV和Excel格式')
        // 实际实现需要使用文件读取库
      }
    }
    input.click()
  }

  const columns = [
    {
      title: '选择',
      key: 'select',
      render: (_: any, record: Customer) => (
        <Checkbox
          checked={selectedCustomers.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedCustomers([...selectedCustomers, record.id])
            } else {
              setSelectedCustomers(selectedCustomers.filter(id => id !== record.id))
            }
          }}
        />
      ),
      width: 60
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '重要程度',
      dataIndex: 'importance',
      key: 'importance',
      render: (importance: string) => (
        <Tag color={importance === 'high' ? 'red' : importance === 'medium' ? 'orange' : 'blue'}>
          {importance === 'high' ? '高' : importance === 'medium' ? '中' : '低'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          potential: '潜在客户',
          following: '跟进中',
          signed: '已签约',
          lost: '已流失'
        }
        return statusMap[status] || status
      }
    }
  ]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id))
    } else {
      setSelectedCustomers([])
    }
  }

  return (
    <div>
      {/* 操作工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<AppstoreOutlined />}
            onClick={() => setShowBatchMessage(true)}
            disabled={selectedCustomers.length === 0}
          >
            批量发送消息 ({selectedCustomers.length})
          </Button>
          
          <Button 
            icon={<AppstoreOutlined />}
            onClick={() => setShowBatchUpdate(true)}
            disabled={selectedCustomers.length === 0}
          >
            批量更新信息 ({selectedCustomers.length})
          </Button>
          
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出数据
          </Button>
          
          <Button 
            icon={<UploadOutlined />}
            onClick={handleImport}
          >
            导入数据
          </Button>

          <Checkbox
            checked={selectedCustomers.length === customers.length && customers.length > 0}
            indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < customers.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            全选 ({customers.length})
          </Checkbox>
        </Space>
      </Card>

      {/* 客户列表 */}
      <Card title="客户列表">
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 批量发送消息模态框 */}
      <Modal
        title="批量发送消息"
        open={showBatchMessage}
        onCancel={() => setShowBatchMessage(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBatchMessage}
        >
          <Form.Item
            name="type"
            label="消息类型"
            rules={[{ required: true, message: '请选择消息类型' }]}
          >
            <Select placeholder="选择消息类型">
              <Option value="sms">
                <Space>
                  <PhoneOutlined />
                  短信
                </Space>
              </Option>
              <Option value="email">
                <Space>
                  <MailOutlined />
                  邮件
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="主题"
          >
            <Input placeholder="请输入消息主题（邮件必填）" />
          </Form.Item>

          <Form.Item
            name="content"
            label="消息内容"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="请输入要发送的消息内容，可以使用 {name}、{company} 等占位符"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                发送给 {selectedCustomers.length} 个客户
              </Button>
              <Button onClick={() => setShowBatchMessage(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量更新信息模态框 */}
      <Modal
        title="批量更新客户信息"
        open={showBatchUpdate}
        onCancel={() => setShowBatchUpdate(false)}
        footer={null}
        width={500}
      >
        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleBatchUpdate}
        >
          <Form.Item
            name="importance"
            label="重要程度"
          >
            <Select placeholder="选择重要程度" allowClear>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="客户状态"
          >
            <Select placeholder="选择客户状态" allowClear>
              <Option value="potential">潜在客户</Option>
              <Option value="following">跟进中</Option>
              <Option value="signed">已签约</Option>
              <Option value="lost">已流失</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="industry"
            label="行业"
          >
            <Select placeholder="选择行业" allowClear>
              <Option value="互联网">互联网</Option>
              <Option value="金融">金融</Option>
              <Option value="制造业">制造业</Option>
              <Option value="房地产">房地产</Option>
              <Option value="教育">教育</Option>
              <Option value="医疗">医疗</Option>
              <Option value="零售">零售</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="添加标签"
              allowClear
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新 {selectedCustomers.length} 个客户
              </Button>
              <Button onClick={() => setShowBatchUpdate(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
