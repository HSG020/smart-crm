import React, { useState } from 'react'
import { Card, Form, Input, Select, DatePicker, Button, Space, Collapse, Row, Col, Tag } from 'antd'
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons'
import { Customer } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { Panel } = Collapse

interface SearchFilters {
  name?: string
  company?: string
  phone?: string
  email?: string
  industry?: string
  importance?: string
  status?: string
  tags?: string[]
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
  lastContactDateRange?: [dayjs.Dayjs, dayjs.Dayjs]
  nextFollowUpDateRange?: [dayjs.Dayjs, dayjs.Dayjs]
}

interface AdvancedSearchProps {
  customers: Customer[]
  onFilterChange: (filteredCustomers: Customer[]) => void
  onFiltersChange?: (filters: SearchFilters) => void
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  customers,
  onFilterChange,
  onFiltersChange
}) => {
  const [form] = Form.useForm()
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({})
  const [isCollapsed, setIsCollapsed] = useState(true)

  const handleSearch = (values: any) => {
    const filters: SearchFilters = {
      ...values,
      dateRange: values.dateRange,
      lastContactDateRange: values.lastContactDateRange,
      nextFollowUpDateRange: values.nextFollowUpDateRange
    }

    setActiveFilters(filters)
    onFiltersChange?.(filters)

    // 应用筛选条件
    let filteredCustomers = customers

    // 基本信息筛选
    if (filters.name) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.name.toLowerCase().includes(filters.name!.toLowerCase())
      )
    }

    if (filters.company) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.company.toLowerCase().includes(filters.company!.toLowerCase())
      )
    }

    if (filters.phone) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.phone.includes(filters.phone!)
      )
    }

    if (filters.email) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.email?.toLowerCase().includes(filters.email!.toLowerCase())
      )
    }

    if (filters.industry) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.industry === filters.industry
      )
    }

    if (filters.importance) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.importance === filters.importance
      )
    }

    if (filters.status) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.status === filters.status
      )
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      filteredCustomers = filteredCustomers.filter(c => 
        filters.tags!.some(tag => c.tags?.includes(tag))
      )
    }

    // 日期范围筛选
    if (filters.dateRange) {
      const [start, end] = filters.dateRange
      filteredCustomers = filteredCustomers.filter(c => {
        const createDate = dayjs(c.createdAt)
        return createDate.isAfter(start.startOf('day')) && createDate.isBefore(end.endOf('day'))
      })
    }

    if (filters.lastContactDateRange && filters.lastContactDateRange.length === 2) {
      const [start, end] = filters.lastContactDateRange
      filteredCustomers = filteredCustomers.filter(c => {
        if (!c.lastContactDate) return false
        const contactDate = dayjs(c.lastContactDate)
        return contactDate.isAfter(start.startOf('day')) && contactDate.isBefore(end.endOf('day'))
      })
    }

    if (filters.nextFollowUpDateRange && filters.nextFollowUpDateRange.length === 2) {
      const [start, end] = filters.nextFollowUpDateRange
      filteredCustomers = filteredCustomers.filter(c => {
        if (!c.nextFollowUpDate) return false
        const followUpDate = dayjs(c.nextFollowUpDate)
        return followUpDate.isAfter(start.startOf('day')) && followUpDate.isBefore(end.endOf('day'))
      })
    }

    onFilterChange(filteredCustomers)
  }

  const handleClear = () => {
    form.resetFields()
    setActiveFilters({})
    onFiltersChange?.({})
    onFilterChange(customers)
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== ''
    }).length
  }

  const renderActiveFilters = () => {
    const filters = []

    if (activeFilters.name) {
      filters.push(<Tag key="name" closable onClose={() => {
        form.setFieldsValue({ name: undefined })
        handleSearch({ ...activeFilters, name: undefined })
      }}>姓名: {activeFilters.name}</Tag>)
    }

    if (activeFilters.company) {
      filters.push(<Tag key="company" closable onClose={() => {
        form.setFieldsValue({ company: undefined })
        handleSearch({ ...activeFilters, company: undefined })
      }}>公司: {activeFilters.company}</Tag>)
    }

    if (activeFilters.industry) {
      filters.push(<Tag key="industry" closable onClose={() => {
        form.setFieldsValue({ industry: undefined })
        handleSearch({ ...activeFilters, industry: undefined })
      }}>行业: {activeFilters.industry}</Tag>)
    }

    if (activeFilters.importance) {
      const importanceText = activeFilters.importance === 'high' ? '高' : 
                           activeFilters.importance === 'medium' ? '中' : '低'
      filters.push(<Tag key="importance" closable onClose={() => {
        form.setFieldsValue({ importance: undefined })
        handleSearch({ ...activeFilters, importance: undefined })
      }}>重要程度: {importanceText}</Tag>)
    }

    if (activeFilters.status) {
      const statusMap: Record<string, string> = {
        potential: '潜在客户',
        following: '跟进中',
        signed: '已签约',
        lost: '已流失'
      }
      filters.push(<Tag key="status" closable onClose={() => {
        form.setFieldsValue({ status: undefined })
        handleSearch({ ...activeFilters, status: undefined })
      }}>状态: {statusMap[activeFilters.status] || activeFilters.status}</Tag>)
    }

    return filters
  }

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined />
            高级搜索
            {getActiveFilterCount() > 0 && (
              <Tag color="blue">{getActiveFilterCount()} 个筛选条件</Tag>
            )}
          </div>
        }
        extra={
          <Button 
            type="text" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? '展开' : '收起'}
          </Button>
        }
        size="small"
      >
        <Collapse 
          activeKey={isCollapsed ? [] : ['search']} 
          ghost 
          onChange={(keys) => setIsCollapsed(keys.length === 0)}
        >
          <Panel header="" key="search" showArrow={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSearch}
              size="small"
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="name" label="客户姓名">
                    <Input placeholder="输入客户姓名" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="company" label="公司名称">
                    <Input placeholder="输入公司名称" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="phone" label="电话号码">
                    <Input placeholder="输入电话号码" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="email" label="邮箱地址">
                    <Input placeholder="输入邮箱地址" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="industry" label="行业">
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
                </Col>
                <Col span={6}>
                  <Form.Item name="importance" label="重要程度">
                    <Select placeholder="选择重要程度" allowClear>
                      <Option value="high">高</Option>
                      <Option value="medium">中</Option>
                      <Option value="low">低</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="status" label="客户状态">
                    <Select placeholder="选择客户状态" allowClear>
                      <Option value="potential">潜在客户</Option>
                      <Option value="following">跟进中</Option>
                      <Option value="signed">已签约</Option>
                      <Option value="lost">已流失</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="tags" label="标签">
                    <Select mode="multiple" placeholder="选择标签" allowClear>
                      {/* 这里应该从已有客户中提取所有标签 */}
                      <Option value="重要客户">重要客户</Option>
                      <Option value="老客户">老客户</Option>
                      <Option value="新客户">新客户</Option>
                      <Option value="潜在客户">潜在客户</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="dateRange" label="创建时间">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="lastContactDateRange" label="最后联系时间">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="nextFollowUpDateRange" label="下次跟进时间">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    搜索
                  </Button>
                  <Button onClick={handleClear} icon={<ClearOutlined />}>
                    清空
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Panel>
        </Collapse>

        {/* 显示活跃的筛选条件 */}
        {getActiveFilterCount() > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              当前筛选条件：
            </div>
            <Space wrap>
              {renderActiveFilters()}
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}
