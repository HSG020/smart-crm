import React, { useEffect } from 'react'
import { Form, Input, Select, DatePicker, Tag, Button, Row, Col, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Customer } from '../types'

type CustomerFormData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

const { Option } = Select
const { TextArea } = Input

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (customer: CustomerFormData) => void
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
    const customerData: CustomerFormData = {
      id: customer?.id,
      ...values,
      birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
      lastContactDate: values.lastContactDate ? values.lastContactDate.toISOString() : undefined,
      nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate.toISOString() : undefined,
      tags: values.tags || []
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
        status: 'potential',
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
              <Option value="potential">潜在客户</Option>
              <Option value="following">跟进中</Option>
              <Option value="signed">已签约</Option>
              <Option value="lost">已流失</Option>
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
