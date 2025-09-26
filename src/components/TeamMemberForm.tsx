import React, { useState } from 'react'
import { Form, Input, Select, Modal, message } from 'antd'
import { User } from '../types'
import { useTeamStore } from '../store/teamStore'

interface TeamMemberFormProps {
  visible: boolean
  onCancel: () => void
  member?: User
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({
  visible,
  onCancel,
  member
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { addUser, updateUser } = useTeamStore()

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const userData: User = {
        id: member?.id || `user_${Date.now()}`,
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        role: values.role,
        department: values.department || '',
        avatar: '',
        performanceMetrics: {
          totalCustomers: 0,
          totalCommunications: 0,
          totalOpportunities: 0,
          totalRevenue: 0,
          conversionRate: 0,
          avgResponseTime: 0
        },
        taskList: [],
        createdAt: member?.createdAt || new Date()
      }

      if (member) {
        await updateUser(userData)
        message.success('团队成员更新成功')
      } else {
        await addUser(userData)
        message.success('团队成员添加成功')
      }

      form.resetFields()
      onCancel()
    } catch (error) {
      console.error('Failed to save member:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={member ? '编辑成员' : '添加成员'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={member || {
          role: 'member'
        }}
      >
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>

        <Form.Item
          name="role"
          label="角色"
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Select placeholder="请选择角色">
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="manager">经理</Select.Option>
            <Select.Option value="member">成员</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="department"
          label="部门"
        >
          <Input placeholder="请输入部门" />
        </Form.Item>
      </Form>
    </Modal>
  )
}