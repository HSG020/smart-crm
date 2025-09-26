import React, { useEffect, useState } from 'react'
import { Card, Tabs, message, Button, Space, Modal } from 'antd'
import { 
  AppstoreOutlined, 
  SearchOutlined, 
  EnvironmentOutlined,
  CalendarOutlined,
  FileExcelOutlined
} from '@ant-design/icons'
import { BatchOperations } from '../components/BatchOperations'
import { AdvancedSearch } from '../components/AdvancedSearch'
import { CustomerMap } from '../components/CustomerMap'
import { useCustomerStore } from '../store/customerStore'
import { Customer } from '../types'

const { TabPane } = Tabs

export const Tools: React.FC = () => {
  const { customers, updateCustomer } = useCustomerStore()
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers)
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({})
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false)

  useEffect(() => {
    setFilteredCustomers(customers)
  }, [customers])

  const handleBatchUpdate = async (customerIds: string[], updates: Partial<Customer>) => {
    try {
      const updatePromises = customerIds.map(async (id) => {
        const customer = customers.find(c => c.id === id)
        if (customer) {
          const updatedCustomer = {
            ...customer,
            ...updates,
            updatedAt: new Date()
          }
          await updateCustomer(updatedCustomer)
        }
      })
      
      await Promise.all(updatePromises)
      message.success(`成功更新 ${customerIds.length} 个客户信息`)
    } catch (error) {
      throw error
    }
  }

  const handleOpenAdvancedSearch = () => {
    setShowAdvancedSearchModal(true)
    message.open({ type: 'info', content: '高级搜索已打开', duration: 1.5 })
  }

  const handleCloseAdvancedSearch = () => {
    setShowAdvancedSearchModal(false)
  }

  const handleAdvancedSearchResults = (filtered: Customer[]) => {
    setFilteredCustomers(filtered)
    message.success(`已应用高级搜索，共找到 ${filtered.length} 个客户`)
    setShowAdvancedSearchModal(false)
  }

  const getActiveFilterCount = () => {
    return Object.values(searchFilters).filter((value) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== '' && value !== null
    }).length
  }

  // 日历视图组件（简化版）
  const CalendarView = () => (
    <Card title="跟进计划日历">
      <div style={{ 
        height: '500px', 
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #d9d9d9',
        borderRadius: '6px'
      }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>日历视图开发中</div>
          <div style={{ fontSize: '14px' }}>将支持以下功能：</div>
          <div style={{ fontSize: '12px', marginTop: '16px', textAlign: 'left' }}>
            • 客户跟进计划展示<br />
            • 拖拽调整跟进时间<br />
            • 批量设置跟进计划<br />
            • 日/周/月视图切换<br />
            • 提醒事项管理<br />
            • 与系统日历同步
          </div>
        </div>
      </div>
    </Card>
  )

  // 数据导入导出工具
  const DataTools = () => (
    <Card title="数据导入导出工具">
      <div style={{ 
        height: '500px', 
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #d9d9d9',
        borderRadius: '6px'
      }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <FileExcelOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>数据工具开发中</div>
          <div style={{ fontSize: '14px' }}>将支持以下功能：</div>
          <div style={{ fontSize: '12px', marginTop: '16px', textAlign: 'left' }}>
            • Excel/CSV 文件导入<br />
            • 数据格式验证<br />
            • 重复数据检测<br />
            • 批量数据清洗<br />
            • 多格式数据导出<br />
            • 数据备份恢复<br />
            • 模板下载
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div style={{ padding: '24px' }}>
      <Card title="实用工具集">
        <Tabs
          defaultActiveKey="search"
          type="card"
          items={[
            {
              key: 'search',
              label: (
                <span>
                  <SearchOutlined />
                  高级搜索
                </span>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }} wrap>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleOpenAdvancedSearch}>
                      打开高级搜索
                    </Button>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      搜索结果：{filteredCustomers.length} / {customers.length} 个客户
                    </span>
                    {getActiveFilterCount() > 0 && (
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        已应用 {getActiveFilterCount()} 个筛选条件
                      </span>
                    )}
                  </Space>
                </div>
              )
            },
            {
              key: 'batch',
              label: (
                <span>
                  <AppstoreOutlined />
                  批量操作
                </span>
              ),
              children: (
                <BatchOperations
                  customers={customers}
                  onBatchUpdate={handleBatchUpdate}
                />
              )
            },
            {
              key: 'map',
              label: (
                <span>
                  <EnvironmentOutlined />
                  客户地图
                </span>
              ),
              children: (
                <CustomerMap
                  customers={customers}
                  onCustomerSelect={handleCustomerSelect}
                />
              )
            },
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined />
                  日历视图
                </span>
              ),
              children: <CalendarView />
            },
            {
              key: 'data',
              label: (
                <span>
                  <FileExcelOutlined />
                  数据工具
                </span>
              ),
              children: <DataTools />
            }
          ]}
        />
      </Card>

      <Modal
        title="高级搜索"
        open={showAdvancedSearchModal}
        onCancel={handleCloseAdvancedSearch}
        footer={null}
        width={960}
        destroyOnClose
      >
        <AdvancedSearch
          customers={customers}
          onFilterChange={handleAdvancedSearchResults}
          onFiltersChange={setSearchFilters}
        />
      </Modal>
    </div>
  )
}