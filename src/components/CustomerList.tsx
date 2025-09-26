import React from 'react'
import { Table, Tag, Button, Space, Tooltip, Avatar } from 'antd'
import { EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import { Customer } from '../types'
import dayjs from 'dayjs'

interface CustomerListProps {
  customers: Customer[]
  loading: boolean
  onEdit: (customer: Customer) => void
  onDelete: (id: string) => void
  onView: (customer: Customer) => void
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  onEdit,
  onDelete,
  onView
}) => {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'default'
      case 'contacted': return 'processing'
      case 'negotiating': return 'warning'
      case 'closed': return 'success'
      case 'lost': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'prospect': return '潜在客户'
      case 'contacted': return '已联系'
      case 'negotiating': return '洽谈中'
      case 'closed': return '已成交'
      case 'lost': return '已失去'
      default: return status
    }
  }

  const columns = [
    {
      title: '客户',
      key: 'customer',
      render: (record: Customer) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.position}</div>
          </div>
        </Space>
      )
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company'
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry'
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (record: Customer) => (
        <Space>
          <Tooltip title={record.phone}>
            <Button
              type="text"
              icon={<PhoneOutlined />}
              size="small"
              onClick={() => window.open(`tel:${record.phone}`)}
            />
          </Tooltip>
          {record.email && (
            <Tooltip title={record.email}>
              <Button
                type="text"
                icon={<MailOutlined />}
                size="small"
                onClick={() => window.open(`mailto:${record.email}`)}
              />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '重要程度',
      dataIndex: 'importance',
      key: 'importance',
      render: (importance: string) => (
        <Tag color={getImportanceColor(importance)}>
          {importance === 'high' ? '高' : importance === 'medium' ? '中' : '低'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '最后联系',
      dataIndex: 'lastContactDate',
      key: 'lastContactDate',
      render: (date: Date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '下次跟进',
      dataIndex: 'nextFollowUpDate',
      key: 'nextFollowUpDate',
      render: (date: Date) => {
        if (!date) return '-'
        const isOverdue = dayjs(date).isBefore(dayjs(), 'day')
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dayjs(date).format('YYYY-MM-DD')}
          </span>
        )
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space size="small">
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags?.length > 2 && (
            <Tag size="small">+{tags.length - 2}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Customer) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.id)}
          />
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={customers}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 个客户`
      }}
      onRow={(record) => ({
        onClick: () => onView(record),
        style: { cursor: 'pointer' }
      })}
    />
  )
}