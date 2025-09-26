import React, { useEffect } from 'react'
import { Form, Input, Select, DatePicker, Tag, Button, Row, Col, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Customer } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (customer: Customer) => void
  onCancel: () => void
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        ...customer,
        birthday: customer.birthday ? dayjs(customer.birthday) : null,
        lastContactDate: customer.lastContactDate ? dayjs(customer.lastContactDate) : null,
        nextFollowUpDate: customer.nextFollowUpDate ? dayjs(customer.nextFollowUpDate) : null,
      })
    }
  }, [customer, form])

  const handleSubmit = (values: any) => {
    const customerData: Customer = {
      id: customer?.id || `customer_${Date.now()}`,
      ...values,
      birthday: values.birthday ? values.birthday.toDate() : undefined,
      lastContactDate: values.lastContactDate ? values.lastContactDate.toDate() : undefined,
      nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate.toDate() : undefined,
      tags: values.tags || [],
      createdAt: customer?.createdAt || new Date(),
      updatedAt: new Date()
    }
    onSubmit(customerData)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        importance: 'medium',
        status: 'prospect',
        tags: []
      }}
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
          <Form.Item
            name="position"
            label="职位"
          >
            <Input placeholder="请输入职位" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="industry"
            label="行业"
          >
            <Select placeholder="请选择行业">
              <Option value="互联网">互联网</Option>
              <Option value="金融">金融</Option>
              <Option value="制造业">制造业</Option>
              <Option value="房地产">房地产</Option>
              <Option value="教育">教育</Option>
              <Option value="医疗">医疗</Option>
              <Option value="零售">零售</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="importance"
            label="重要程度"
          >
            <Select>
              <Option value="high">
                <Tag color="red">高</Tag>
              </Option>
              <Option value="medium">
                <Tag color="orange">中</Tag>
              </Option>
              <Option value="low">
                <Tag color="blue">低</Tag>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label="客户状态"
          >
            <Select>
              <Option value="prospect">潜在客户</Option>
              <Option value="contacted">已联系</Option>
              <Option value="negotiating">洽谈中</Option>
              <Option value="closed">已成交</Option>
              <Option value="lost">已失去</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="birthday"
            label="生日"
          >
            <DatePicker placeholder="请选择生日" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="lastContactDate"
            label="最后联系时间"
          >
            <DatePicker placeholder="请选择最后联系时间" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="nextFollowUpDate"
            label="下次跟进时间"
          >
            <DatePicker placeholder="请选择下次跟进时间" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address"
        label="地址"
      >
        <Input placeholder="请输入地址" />
      </Form.Item>

      <Form.Item
        name="notes"
        label="备注"
      >
        <TextArea rows={4} placeholder="请输入备注信息" />
      </Form.Item>

      <Form.Item
        name="tags"
        label="标签"
      >
        <Select
          mode="tags"
          placeholder="请输入标签"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Space>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
          {customer ? '更新客户' : '添加客户'}
        </Button>
        <Button onClick={onCancel}>
          取消
        </Button>
      </Space>
    </Form>
  )
}