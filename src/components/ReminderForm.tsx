import React, { useState } from 'react'
import { Form, Input, DatePicker, Select, Modal, message } from 'antd'
import { Reminder } from '../types'
import { useReminderStore } from '../store/reminderStore'
import { useCustomerStore } from '../store/customerStore'
import dayjs from 'dayjs'

const { TextArea } = Input

interface ReminderFormProps {
  visible: boolean
  onCancel: () => void
  reminder?: Reminder
}

export const ReminderForm: React.FC<ReminderFormProps> = ({
  visible,
  onCancel,
  reminder
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { addReminder, updateReminder } = useReminderStore()
  const { customers } = useCustomerStore()

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const selectedCustomer = customers.find(c => c.id === values.customerId)

      const reminderData = {
        ...values,
        customerName: selectedCustomer?.name || '',
        reminderDate: values.reminderDate.toISOString(),
        type: values.type || 'phone'
      }

      if (reminder) {
        await updateReminder({
          ...reminder,
          ...reminderData
        })
        message.success('提醒更新成功')
      } else {
        await addReminder(reminderData)
        message.success('提醒添加成功')
      }

      form.resetFields()
      onCancel()
    } catch (error) {
      console.error('Failed to save reminder:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={reminder ? '编辑提醒' : '添加提醒'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={reminder ? {
          ...reminder,
          reminderDate: dayjs(reminder.reminderDate)
        } : {
          type: 'phone'
        }}
      >
        <Form.Item
          name="customerId"
          label="选择客户"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select
            placeholder="请选择客户"
            showSearch
            optionFilterProp="label"
            options={customers.map(c => ({
              value: c.id,
              label: c.name
            }))}
          />
        </Form.Item>

        <Form.Item
          name="reminderDate"
          label="提醒时间"
          rules={[{ required: true, message: '请选择提醒时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder="选择提醒时间"
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="提醒类型"
          rules={[{ required: true, message: '请选择提醒类型' }]}
        >
          <Select placeholder="请选择提醒类型">
            <Select.Option value="phone">电话跟进</Select.Option>
            <Select.Option value="meeting">会议</Select.Option>
            <Select.Option value="email">邮件</Select.Option>
            <Select.Option value="wechat">微信</Select.Option>
            <Select.Option value="visit">拜访</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="message"
          label="提醒内容"
          rules={[{ required: true, message: '请输入提醒内容' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入提醒内容"
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}