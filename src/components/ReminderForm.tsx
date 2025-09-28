import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, DatePicker, Select, message } from 'antd'
import dayjs from 'dayjs'
import { useReminderStore } from '../store/reminderStore'
import { useCustomerStore } from '../store/customerStore'
import { Reminder } from '../types'

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
  const [saving, setSaving] = useState(false)
  const { addReminder, updateReminder } = useReminderStore()
  const { customers } = useCustomerStore()

  useEffect(() => {
    if (!visible) {
      form.resetFields()
      return
    }

    if (reminder) {
      form.setFieldsValue({
        customerId: reminder.customerId,
        reminderDate: reminder.reminderDate ? dayjs(reminder.reminderDate) : undefined,
        type: reminder.type || 'follow_up',
        title: reminder.title,
        description: reminder.description
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ type: 'follow_up' })
    }
  }, [visible, reminder, form])

  const handleClose = () => {
    form.resetFields()
    onCancel()
  }

  const handleOk = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      const customer = customers.find((c) => c.id === values.customerId)

      const payload = {
        customerId: values.customerId,
        reminderDate: values.reminderDate?.toISOString(),
        title: values.title,
        description: values.description,
        type: values.type,
        customerName: customer?.name || '',
        completed: reminder?.completed ?? false
      } as any

      if (reminder) {
        await updateReminder({
          ...reminder,
          ...payload
        })
        message.success('提醒更新成功')
      } else {
        await addReminder(payload)
        message.success('提醒添加成功')
      }

      handleClose()
    } catch (error) {
      console.error('保存提醒失败', error)
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={reminder ? '编辑提醒' : '添加提醒'}
      open={visible}
      onCancel={handleClose}
      onOk={handleOk}
      confirmLoading={saving}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="customerId"
          label="选择客户"
          rules={[{ required: true, message: '请选择客户' }]}
        >
          <Select placeholder="请选择客户" showSearch optionFilterProp="label">
            {customers.map((customer) => (
              <Select.Option key={customer.id} value={customer.id} label={customer.name}>
                {customer.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="提醒标题"
          rules={[{ required: true, message: '请输入提醒标题' }]}
        >
          <Input placeholder="例如：跟进张三报价" maxLength={80} />
        </Form.Item>

        <Form.Item
          name="reminderDate"
          label="提醒时间"
          rules={[{ required: true, message: '请选择提醒时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm"
            placeholder="选择提醒时间"
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="提醒类型"
          rules={[{ required: true, message: '请选择提醒类型' }]}
        >
          <Select placeholder="请选择提醒类型">
            <Select.Option value="follow_up">跟进提醒</Select.Option>
            <Select.Option value="birthday">生日提醒</Select.Option>
            <Select.Option value="festival">节日提醒</Select.Option>
            <Select.Option value="contract">合同提醒</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="提醒内容"
          rules={[{ required: true, message: '请输入提醒内容' }]}
        >
          <TextArea rows={4} placeholder="请输入提醒内容" maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
