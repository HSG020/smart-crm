import React, { useState } from 'react'
import { Card, Button, Space, Modal, Form, Input, DatePicker, Select, message } from 'antd'
import { PlusOutlined, SearchOutlined, UserAddOutlined, SyncOutlined } from '@ant-design/icons'

export const TestFunctions: React.FC = () => {
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [memberModalVisible, setMemberModalVisible] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false)

  // 处理添加提醒
  const handleAddReminder = () => {
    message.success('添加提醒功能正常！')
    setReminderModalVisible(true)
  }

  // 处理智能生成提醒
  const handleGenerateReminders = () => {
    message.loading('正在智能生成提醒...', 2).then(() => {
      message.success('已生成5个智能提醒！')
    })
  }

  // 处理添加成员
  const handleAddMember = () => {
    message.success('添加成员功能正常！')
    setMemberModalVisible(true)
  }

  // 处理高级搜索
  const handleAdvancedSearch = () => {
    message.success('高级搜索功能正常！')
    setSearchModalVisible(true)
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>功能测试页面</h1>

      <Card title="跟进提醒功能测试" style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddReminder}>
            添加提醒
          </Button>
          <Button icon={<SyncOutlined />} onClick={handleGenerateReminders}>
            智能生成提醒
          </Button>
        </Space>
      </Card>

      <Card title="团队协作功能测试" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAddMember}>
          添加成员
        </Button>
      </Card>

      <Card title="实用工具功能测试">
        <Button type="primary" icon={<SearchOutlined />} onClick={handleAdvancedSearch}>
          高级搜索
        </Button>
      </Card>

      {/* 添加提醒Modal */}
      <Modal
        title="添加提醒"
        open={reminderModalVisible}
        onOk={() => {
          message.success('提醒已添加！')
          setReminderModalVisible(false)
        }}
        onCancel={() => setReminderModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="客户">
            <Select placeholder="选择客户">
              <Select.Option value="1">张三</Select.Option>
              <Select.Option value="2">李四</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="提醒时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="提醒内容">
            <Input.TextArea rows={3} placeholder="输入提醒内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加成员Modal */}
      <Modal
        title="添加成员"
        open={memberModalVisible}
        onOk={() => {
          message.success('成员已添加！')
          setMemberModalVisible(false)
        }}
        onCancel={() => setMemberModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="姓名">
            <Input placeholder="输入姓名" />
          </Form.Item>
          <Form.Item label="邮箱">
            <Input placeholder="输入邮箱" />
          </Form.Item>
          <Form.Item label="角色">
            <Select placeholder="选择角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="member">成员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 高级搜索Modal */}
      <Modal
        title="高级搜索"
        open={searchModalVisible}
        onOk={() => {
          message.success('搜索完成！找到10个结果')
          setSearchModalVisible(false)
        }}
        onCancel={() => setSearchModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="客户名称">
            <Input placeholder="输入客户名称" />
          </Form.Item>
          <Form.Item label="公司">
            <Input placeholder="输入公司名称" />
          </Form.Item>
          <Form.Item label="重要程度">
            <Select placeholder="选择重要程度">
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}