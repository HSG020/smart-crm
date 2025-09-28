import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Tabs,
  message,
  Button,
  Space,
  Modal,
  Upload,
  Select,
  Alert,
  Typography,
  Divider,
  Table,
  Result,
  List,
  Spin
} from 'antd'
import {
  AppstoreOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  UploadOutlined,
  DownloadOutlined,
  RobotOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { BatchOperations } from '../components/BatchOperations'
import { AdvancedSearch } from '../components/AdvancedSearch'
import { CustomerMap } from '../components/CustomerMap'
import { WorkflowIntegration } from '../components/WorkflowIntegration'
import { useCustomerStore } from '../store/customerStore'
import { Customer } from '../types'
import dayjs from 'dayjs'
import { loadXLSX } from '../utils/xlsxLoader'

const { Title, Text } = Typography
const { Dragger } = Upload

interface FieldDefinition {
  key: keyof Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  label: string
  required?: boolean
  type?: 'date' | 'tags'
  example?: string
}

const CUSTOMER_FIELDS: FieldDefinition[] = [
  { key: 'name', label: '客户姓名', required: true, example: '张三' },
  { key: 'company', label: '公司名称', required: true, example: '星辰科技' },
  { key: 'phone', label: '联系电话', required: true, example: '13800138000' },
  { key: 'email', label: '邮箱', example: 'zhangsan@example.com' },
  { key: 'position', label: '职位', example: '销售总监' },
  { key: 'industry', label: '行业', example: '互联网' },
  { key: 'importance', label: '重要程度', example: '高/中/低' },
  { key: 'status', label: '客户状态', example: '潜在/洽谈/已成交等' },
  { key: 'lastContactDate', label: '最后联系时间', type: 'date', example: '2024-03-21' },
  { key: 'nextFollowUpDate', label: '下次跟进时间', type: 'date', example: '2024-04-05' },
  { key: 'birthday', label: '生日', type: 'date', example: '1990-06-15' },
  { key: 'address', label: '地址', example: '上海市浦东新区' },
  { key: 'tags', label: '标签', type: 'tags', example: '重要客户,VIP' },
  { key: 'notes', label: '备注', example: '重点跟进客户' }
]

const REQUIRED_FIELD_KEYS = CUSTOMER_FIELDS.filter((field) => field.required).map((field) => field.key)

const IMPORT_HINTS = [
  '支持 .xlsx / .xls / .csv 文件，系统会取第一张工作表',
  '表头会用于字段映射，请确保第一行是列名',
  '手机号或邮箱重复的记录会自动跳过，并在结果中列出',
  '日期字段请使用 YYYY-MM-DD 或 Excel 日期格式'
]

const TEMPLATE_ROWS = [
  {
    客户姓名: '张三',
    公司名称: '星辰科技',
    联系电话: '13800138000',
    邮箱: 'zhangsan@example.com',
    职位: '销售总监',
    行业: '互联网',
    重要程度: '高',
    客户状态: '潜在客户',
    最后联系时间: '2024-03-01',
    下次跟进时间: '2024-03-15',
    标签: '重要客户,VIP'
  },
  {
    客户姓名: '李四',
    公司名称: '华光制造',
    联系电话: '13900139000',
    邮箱: 'lisi@example.com',
    职位: '采购经理',
    行业: '制造业',
    重要程度: '中',
    客户状态: '已联系',
    最后联系时间: '2024-02-20',
    下次跟进时间: '2024-03-10',
    标签: '老客户'
  }
]

const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['name', '姓名', '客户姓名'],
  company: ['company', '公司', '公司名称', '企业名称'],
  phone: ['phone', '手机号', '手机', '联系电话', '电话'],
  email: ['email', '邮箱', '邮件'],
  position: ['position', '职位', '岗位'],
  industry: ['industry', '行业'],
  importance: ['importance', '重要程度', '级别', '级别(高/中/低)'],
  status: ['status', '客户状态', '阶段', '状态'],
  lastContactDate: ['lastcontactdate', '最后联系时间', '最近联系时间'],
  nextFollowUpDate: ['nextfollowupdate', '下次跟进时间', '下次联系时间'],
  birthday: ['birthday', '生日'],
  address: ['address', '地址'],
  tags: ['tags', '标签', 'tag'],
  notes: ['notes', '备注', '说明']
}

const NORMALIZE = (value: string) => value.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '').toLowerCase()

const toSafeString = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD')
  return String(value).trim()
}

const parseDateLike = (value: unknown) => {
  if (value === null || value === undefined || value === '') return undefined
  const numericValue = typeof value === 'number' ? value : undefined
  if (numericValue !== undefined) {
    // Excel stores dates as serial numbers from 1900-01-00
    const excelDate = dayjs('1899-12-30').add(numericValue, 'day')
    if (excelDate.isValid()) {
      return excelDate.toISOString()
    }
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.toISOString() : undefined
}

const mapImportance = (value: string) => {
  const normalized = value.toLowerCase()
  if (['高', '重要', 'high'].some((item) => normalized.includes(item))) return 'high'
  if (['低', 'low'].some((item) => normalized.includes(item))) return 'low'
  if (['中', 'normal', 'medium'].some((item) => normalized.includes(item))) return 'medium'
  return undefined
}

const mapStatus = (value: string) => {
  const normalized = value.toLowerCase()
  if (normalized.includes('潜') || normalized.includes('prospect')) return 'potential'
  if (normalized.includes('跟') || normalized.includes('进行') || normalized.includes('follow')) return 'following'
  if (normalized.includes('签') || normalized.includes('成') || normalized.includes('closed') || normalized.includes('signed')) return 'signed'
  if (normalized.includes('失') || normalized.includes('lost')) return 'lost'
  return undefined
}

const splitTags = (value: string) =>
  value
    .split(/[\s,，;；、|]+/)
    .map((item) => item.trim())
    .filter(Boolean)

export const Tools: React.FC = () => {
  const {
    customers,
    updateCustomer,
    addCustomer,
    loadCustomers
  } = useCustomerStore()

  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers)
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({})

  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'result'>('upload')
  const [uploading, setUploading] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importRows, setImportRows] = useState<any[]>([])
  const [importColumns, setImportColumns] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [processingImport, setProcessingImport] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    created: number
    duplicates: { row: number; reason: string }[]
    errors: { row: number; reason: string }[]
  }>({ created: 0, duplicates: [], errors: [] })

  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null)
  const [templateExporting, setTemplateExporting] = useState<'csv' | 'xlsx' | null>(null)

  useEffect(() => {
    setFilteredCustomers(customers)
  }, [customers])

  useEffect(() => {
    if (customers.length === 0) {
      loadCustomers()
    }
  }, [customers.length, loadCustomers])

  const handleBatchUpdate = async (customerIds: string[], updates: Partial<Customer>) => {
    try {
      const updatePromises = customerIds.map(async (id) => {
        const customer = customers.find((c) => c.id === id)
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
      message.error('批量更新失败，请重试')
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    message.info(`已选择客户：${customer.name} - ${customer.company}`)
  }

  const handleOpenAdvancedSearch = () => {
    setShowAdvancedSearchModal(true)
    message.open({ type: 'info', content: '高级搜索已打开', duration: 1.5 })
  }

  const handleAdvancedSearchResults = (filtered: Customer[]) => {
    setFilteredCustomers(filtered)
    message.success(`已应用高级搜索，共找到 ${filtered.length} 个客户`)
    setShowAdvancedSearchModal(false)
  }

  const getActiveFilterCount = () =>
    Object.values(searchFilters).filter((value) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== '' && value !== null
    }).length

  const resetImportState = () => {
    setImportStep('upload')
    setImportRows([])
    setImportColumns([])
    setColumnMapping({})
    setImportFileName('')
    setImportSummary({ created: 0, duplicates: [], errors: [] })
    setUploading(false)
    setProcessingImport(false)
  }

  const openImportModal = () => {
    resetImportState()
    setShowImportModal(true)
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    resetImportState()
  }

  const suggestMapping = (columns: string[]) => {
    const suggestion: Record<string, string> = {}
    const used = new Set<string>()

    columns.forEach((column) => {
      const normalized = NORMALIZE(column)
      Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
        if (suggestion[field] || used.has(column)) return
        if (aliases.some((alias) => normalized.includes(NORMALIZE(alias)))) {
          suggestion[field] = column
          used.add(column)
        }
      })
    })

    return suggestion
  }

  const handleFileUpload: UploadProps['beforeUpload'] = async (file) => {
    setUploading(true)
    try {
      const XLSX = await loadXLSX()
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        message.error('文件中未找到工作表')
        return Upload.LIST_IGNORE
      }
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (rows.length === 0) {
        message.error('文件中未找到数据')
        return Upload.LIST_IGNORE
      }

      const columns = Object.keys(rows[0])
      setImportRows(rows)
      setImportColumns(columns)
      setColumnMapping(suggestMapping(columns))
      setImportFileName(file.name)
      setImportStep('mapping')
      message.success(`已读取文件 ${file.name}，共 ${rows.length} 条记录`)
    } catch (error: any) {
      console.error('解析文件失败', error)
      message.error(`解析文件失败：${error.message || '未知错误'}`)
      return Upload.LIST_IGNORE
    } finally {
      setUploading(false)
    }
    return Upload.LIST_IGNORE
  }

  const isReadyToImport = REQUIRED_FIELD_KEYS.every((key) => columnMapping[key])

  const previewColumns = useMemo(
    () =>
      importColumns.map((column) => ({
        title: column,
        dataIndex: column,
        key: column
      })),
    [importColumns]
  )

  const previewData = useMemo(
    () => importRows.slice(0, 5).map((row, index) => ({ key: index, ...row })),
    [importRows]
  )

  const buildPayloadFromRow = (row: any) => {
    const payload: Record<string, any> = {
      importance: 'medium',
      status: 'potential',
      tags: []
    }

    CUSTOMER_FIELDS.forEach((field) => {
      const column = columnMapping[field.key as string]
      if (!column) return

      const rawValue = row[column]
      const stringValue = toSafeString(rawValue)

      if (field.required && !stringValue) {
        return
      }

      switch (field.type) {
        case 'date': {
          const parsed = parseDateLike(rawValue)
          if (parsed) {
            payload[field.key] = parsed
          }
          break
        }
        case 'tags': {
          payload[field.key] = splitTags(stringValue)
          break
        }
        default: {
          if (field.key === 'importance') {
            payload[field.key] = mapImportance(stringValue) || 'medium'
          } else if (field.key === 'status') {
            payload[field.key] = mapStatus(stringValue) || 'potential'
          } else {
            payload[field.key] = stringValue || undefined
          }
          break
        }
      }
    })

    if (Array.isArray(payload.tags) && payload.tags.length === 0) {
      delete payload.tags
    }

    return payload
  }

  const handleStartImport = async () => {
    setProcessingImport(true)
    const duplicates: { row: number; reason: string }[] = []
    const errors: { row: number; reason: string }[] = []
    let created = 0

    const existingPhones = new Set(
      customers
        .map((customer) => toSafeString(customer.phone))
        .filter(Boolean)
    )

    const existingEmails = new Set(
      customers
        .map((customer) => toSafeString(customer.email).toLowerCase())
        .filter(Boolean)
    )

    const filePhones = new Set<string>()
    const fileEmails = new Set<string>()

    const hide = message.loading('正在导入客户数据...', 0)

    try {
      for (let index = 0; index < importRows.length; index += 1) {
        const row = importRows[index]
        const rowNumber = index + 2 // +2 以对应 Excel 行号（含表头）
        const payload = buildPayloadFromRow(row)

        if (REQUIRED_FIELD_KEYS.some((key) => !toSafeString(payload[key as string]))) {
          errors.push({ row: rowNumber, reason: '缺少必填字段' })
          continue
        }

        const phone = toSafeString(payload.phone).replace(/\s+/g, '')
        const email = toSafeString(payload.email).toLowerCase()

        if (phone && (existingPhones.has(phone) || filePhones.has(phone))) {
          duplicates.push({ row: rowNumber, reason: `手机号重复：${phone}` })
          continue
        }

        if (email && (existingEmails.has(email) || fileEmails.has(email))) {
          duplicates.push({ row: rowNumber, reason: `邮箱重复：${email}` })
          continue
        }

        try {
          await addCustomer(payload, { silent: true })
          created += 1
          if (phone) filePhones.add(phone)
          if (email) fileEmails.add(email)
        } catch (error: any) {
          console.error('导入客户失败', error)
          errors.push({ row: rowNumber, reason: error.message || '导入失败' })
        }
      }

      await loadCustomers()

      setImportSummary({ created, duplicates, errors })
      setImportStep('result')

      if (created > 0) {
        message.success(`成功导入 ${created} 条客户数据`)
      }

      if (duplicates.length > 0 || errors.length > 0) {
        message.warning('部分记录未成功导入，请查看详情')
      }
    } finally {
      hide()
      setProcessingImport(false)
    }
  }

  const generateCSVContent = (rows: Record<string, any>[]) => {
    const headers = Object.keys(rows[0] ?? {})
    const escapeCell = (value: unknown) => {
      const cell = toSafeString(value)
      if (/[",\n]/.test(cell)) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }

    const csvRows = [headers.join(',')]
    rows.forEach((row) => {
      csvRows.push(headers.map((header) => escapeCell(row[header])).join(','))
    })
    return csvRows.join('\n')
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (format: 'csv' | 'xlsx', data?: Customer[]) => {
    if ((data ?? customers).length === 0) {
      message.warning('暂无客户数据可导出')
      return
    }

    const rows = (data ?? customers).map((customer) => ({
      客户姓名: customer.name,
      公司名称: customer.company,
      职位: customer.position ?? '',
      行业: customer.industry ?? '',
      联系电话: customer.phone ?? '',
      邮箱: customer.email ?? '',
      重要程度: customer.importance ?? '',
      客户状态: customer.status ?? '',
      最后联系时间: customer.lastContactDate ? dayjs(customer.lastContactDate).format('YYYY-MM-DD') : '',
      下次跟进时间: customer.nextFollowUpDate ? dayjs(customer.nextFollowUpDate).format('YYYY-MM-DD') : '',
      标签: Array.isArray((customer as any).tags) ? (customer as any).tags.join(',') : '',
      备注: customer.notes ?? ''
    }))

    if (format === 'csv') {
      setExporting('csv')
      const csv = generateCSVContent(rows)
      const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
      downloadBlob(blob, `customers-${dayjs().format('YYYYMMDD-HHmmss')}.csv`)
      setExporting(null)
      message.success('客户数据 CSV 导出成功')
      return
    }

    setExporting('xlsx')
    try {
      const XLSX = await loadXLSX()
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      downloadBlob(blob, `customers-${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`)
      message.success('客户数据 Excel 导出成功')
    } catch (error: any) {
      console.error('导出失败', error)
      message.error('Excel 导出失败，请检查网络或稍后重试')
    } finally {
      setExporting(null)
    }
  }

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    setTemplateExporting(format)
    try {
      if (format === 'csv') {
        const csv = generateCSVContent(TEMPLATE_ROWS as any)
        const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
        downloadBlob(blob, 'customer-import-template.csv')
      } else {
        const XLSX = await loadXLSX()
        const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_ROWS)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        downloadBlob(blob, 'customer-import-template.xlsx')
      }
      message.success('模板下载完成')
    } catch (error: any) {
      console.error('模板下载失败', error)
      message.error('模板生成失败，请检查网络或稍后重试')
    } finally {
      setTemplateExporting(null)
    }
  }

  const renderImportModalContent = () => {
    if (importStep === 'upload') {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>选择要导入的文件</Title>
            <Text type="secondary">支持 .xlsx / .xls / .csv，文件大小建议不超过 5MB。</Text>
          </div>
          <Dragger
            name="file"
            accept=".xlsx,.xls,.csv"
            multiple={false}
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">系统将读取文件的第一张工作表</p>
          </Dragger>
          <Alert
            type="info"
            showIcon
            message={
              <Space direction="vertical">
                {IMPORT_HINTS.map((hint) => (
                  <div key={hint}>{hint}</div>
                ))}
              </Space>
            }
          />
        </Space>
      )
    }

    if (importStep === 'mapping') {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>字段匹配</Title>
            <Text type="secondary">
              文件：{importFileName}，共 {importRows.length} 条记录。请将文件列与系统字段进行匹配，标记 * 的为必填项。
            </Text>
          </div>
          <div>
            {CUSTOMER_FIELDS.map((field) => (
              <Space key={field.key as string} align="start" style={{ width: '100%', marginBottom: 12 }}>
                <div style={{ width: 160 }}>
                  <Text strong>
                    {field.label}
                    {field.required && <Text type="danger"> *</Text>}
                  </Text>
                  {field.example && (
                    <div style={{ fontSize: 12, color: '#999' }}>示例：{field.example}</div>
                  )}
                </div>
                <Select
                  allowClear
                  placeholder="选择文件列"
                  value={columnMapping[field.key as string]}
                  style={{ minWidth: 220 }}
                  options={importColumns.map((column) => ({ value: column, label: column }))}
                  onChange={(value) =>
                    setColumnMapping((prev) => ({
                      ...prev,
                      [field.key]: value as string
                    }))
                  }
                />
              </Space>
            ))}
          </div>
          <div>
            <Title level={5}>数据预览（前 5 行）</Title>
            <Table
              size="small"
              columns={previewColumns}
              dataSource={previewData}
              pagination={false}
              scroll={{ x: true }}
            />
          </div>
        </Space>
      )
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Result
          status="success"
          title={`导入完成，成功导入 ${importSummary.created} 条记录`}
          subTitle={`重复记录 ${importSummary.duplicates.length} 条，导入失败 ${importSummary.errors.length} 条`}
        />
        {importSummary.duplicates.length > 0 && (
          <Card size="small" title="重复记录（已跳过）">
            <List
              size="small"
              dataSource={importSummary.duplicates}
              renderItem={(item) => (
                <List.Item>
                  第 {item.row} 行 - {item.reason}
                </List.Item>
              )}
            />
          </Card>
        )}
        {importSummary.errors.length > 0 && (
          <Card size="small" title="导入失败的记录">
            <List
              size="small"
              dataSource={importSummary.errors}
              renderItem={(item) => (
                <List.Item>
                  第 {item.row} 行 - {item.reason}
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    )
  }

  const DataToolsCard = () => (
    <Card title="数据导入导出工具">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5}>导出</Title>
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              loading={exporting === 'csv'}
              onClick={() => handleExport('csv')}
            >
              导出 CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exporting === 'xlsx'}
              onClick={() => handleExport('xlsx')}
            >
              导出 Excel
            </Button>
            <Text type="secondary">导出的文件包含客户的核心信息，可用于备份或报表。</Text>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <div>
          <Title level={5}>导入</Title>
          <Space wrap>
            <Button type="primary" icon={<UploadOutlined />} onClick={openImportModal}>
              导入客户
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={templateExporting === 'xlsx'}
              onClick={() => handleDownloadTemplate('xlsx')}
            >
              下载 Excel 模板
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={templateExporting === 'csv'}
              onClick={() => handleDownloadTemplate('csv')}
            >
              下载 CSV 模板
            </Button>
          </Space>
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="系统会自动检测手机号和邮箱的重复记录，重复数据将被跳过。"
          />
        </div>
      </Space>

      <Modal
        title="导入客户数据"
        open={showImportModal}
        onCancel={closeImportModal}
        width={900}
        destroyOnClose
        footer={
          importStep === 'upload'
            ? null
            : importStep === 'mapping'
              ? (
                <Space>
                  <Button onClick={() => setImportStep('upload')}>重新选择文件</Button>
                  <Button type="primary" disabled={!isReadyToImport || processingImport} onClick={handleStartImport}>
                    {processingImport ? <Spin size="small" style={{ marginRight: 8 }} /> : null}
                    开始导入
                  </Button>
                </Space>
              )
              : (
                <Space>
                  <Button type="primary" onClick={closeImportModal}>
                    完成
                  </Button>
                </Space>
              )
        }
      >
        {uploading && importStep === 'upload' ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin />
            <div style={{ marginTop: 16 }}>正在读取文件...</div>
          </div>
        ) : (
          renderImportModalContent()
        )}
      </Modal>
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
              children: (
                <Card title="跟进计划日历">
                  <div
                    style={{
                      height: '500px',
                      background: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #d9d9d9',
                      borderRadius: '6px'
                    }}
                  >
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
            },
            {
              key: 'data',
              label: (
                <span>
                  <FileExcelOutlined />
                  数据工具
                </span>
              ),
              children: <DataToolsCard />
            },
            {
              key: 'workflow',
              label: (
                <span>
                  <RobotOutlined />
                  工作流自动化
                </span>
              ),
              children: <WorkflowIntegration />
            }
          ]}
        />
      </Card>

      <Modal
        title="高级搜索"
        open={showAdvancedSearchModal}
        onCancel={() => setShowAdvancedSearchModal(false)}
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
