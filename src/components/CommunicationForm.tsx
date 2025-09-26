import React, { useEffect } from 'react'
import { Form, Input, Select, DatePicker, Button, Space, Upload, message } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import { Communication, Customer } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

interface CommunicationFormProps {
  communication?: Communication
  customers: Customer[]
  selectedCustomerId?: string
  onSubmit: (communication: Communication) => void
  onCancel: () => void
}

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  communication,
  customers,
  selectedCustomerId,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (communication) {
      form.setFieldsValue({
        ...communication,
        createdAt: dayjs(communication.createdAt)
      })
    } else if (selectedCustomerId) {
      form.setFieldsValue({ customerId: selectedCustomerId })
    }
  }, [communication, selectedCustomerId, form])

  const handleSubmit = (values: any) => {
    const communicationData: Communication = {
      id: communication?.id || `comm_${Date.now()}`,
      ...values,
      createdAt: values.createdAt ? values.createdAt.toDate() : new Date(),
      attachments: values.attachments || []
    }
    onSubmit(communicationData)
  }

  const uploadProps = {
    name: 'file',
    multiple: true,
    beforeUpload: () => false, // 阻止自动上传
    onChange: (info: any) => {
      const fileList = info.fileList.map((file: any) => ({
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: file.url || `local://${file.name}`
      }))
      form.setFieldsValue({ attachments: fileList })
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        type: 'call',
        createdAt: dayjs()
      }}
    >
      <Form.Item
        name="customerId"
        label="客户"
        rules={[{ required: true, message: '请选择客户' }]}
      >
        <Select 
          placeholder="请选择客户"
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
      </Form.Item>

      <Form.Item
        name="type"
        label="沟通方式"
        rules={[{ required: true, message: '请选择沟通方式' }]}
      >
        <Select>
          <Option value="call">电话</Option>
          <Option value="email">邮件</Option>
          <Option value="meeting">会议</Option>
          <Option value="wechat">微信</Option>
          <Option value="visit">拜访</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="content"
        label="沟通内容"
        rules={[{ required: true, message: '请输入沟通内容' }]}
      >
        <TextArea 
          rows={4} 
          placeholder="请详细描述本次沟通的内容要点..."
        />
      </Form.Item>

      <Form.Item
        name="result"
        label="沟通结果"
        rules={[{ required: true, message: '请输入沟通结果' }]}
      >
        <TextArea 
          rows={3} 
          placeholder="请总结本次沟通的结果和客户反馈..."
        />
      </Form.Item>

      <Form.Item
        name="nextAction"
        label="下一步行动"
      >
        <TextArea 
          rows={2} 
          placeholder="计划的下一步行动或跟进计划..."
        />
      </Form.Item>

      <Form.Item
        name="createdAt"
        label="沟通时间"
        rules={[{ required: true, message: '请选择沟通时间' }]}
      >
        <DatePicker 
          showTime 
          format="YYYY-MM-DD HH:mm"
          style={{ width: '100%' }} 
        />
      </Form.Item>

      <Form.Item
        name="attachments"
        label="附件"
      >
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传，可上传截图、录音、文档等
          </p>
        </Dragger>
      </Form.Item>

      <Space>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
          {communication ? '更新记录' : '保存记录'}
        </Button>
        <Button onClick={onCancel}>
          取消
        </Button>
      </Space>
    </Form>
  )
}