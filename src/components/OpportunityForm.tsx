import React, { useEffect } from 'react'
import { Form, Input, InputNumber, Select, DatePicker, Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Opportunity, Customer, SalesStage } from '../types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface OpportunityFormProps {
  opportunity?: Opportunity
  customers: Customer[]
  stages: SalesStage[]
  defaultStageId?: string
  onSubmit: (opportunity: Opportunity) => void
  onCancel: () => void
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  opportunity,
  customers,
  stages,
  defaultStageId,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (opportunity) {
      form.setFieldsValue({
        ...opportunity,
        expectedCloseDate: dayjs(opportunity.expectedCloseDate)
      })
    } else if (defaultStageId) {
      form.setFieldsValue({ stage: defaultStageId })
    }
  }, [opportunity, defaultStageId, form])

  const handleSubmit = (values: any) => {
    const selectedStage = stages.find(s => s.id === values.stage)
    
    const opportunityData: Opportunity = {
      id: opportunity?.id || `opportunity_${Date.now()}`,
      ...values,
      probability: selectedStage?.probability || values.probability || 50,
      expectedCloseDate: values.expectedCloseDate.toDate(),
      createdAt: opportunity?.createdAt || new Date(),
      updatedAt: new Date()
    }
    onSubmit(opportunityData)
  }

  const handleStageChange = (stageId: string) => {
    const selectedStage = stages.find(s => s.id === stageId)
    if (selectedStage) {
      form.setFieldsValue({ probability: selectedStage.probability })
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        stage: defaultStageId || 'lead',
        probability: 50,
        value: 0,
        expectedCloseDate: dayjs().add(30, 'day')
      }}
    >
      <Form.Item
        name="title"
        label="机会名称"
        rules={[{ required: true, message: '请输入机会名称' }]}
      >
        <Input placeholder="请输入机会名称，如：XX公司-CRM系统采购" />
      </Form.Item>

      <Form.Item
        name="customerId"
        label="关联客户"
        rules={[{ required: true, message: '请选择关联客户' }]}
      >
        <Select 
          placeholder="请选择客户"
          showSearch
          filterOption={(input, option) =>
            (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {customers.map(customer => (
            <Option key={customer.id} value={customer.id}>
              {customer.name} - {customer.company}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="value"
        label="预期金额"
        rules={[{ required: true, message: '请输入预期金额' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="请输入预期金额"
          formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value?.replace(/¥\s?|(,*)/g, '') as any}
          min={0}
        />
      </Form.Item>

      <Form.Item
        name="stage"
        label="销售阶段"
        rules={[{ required: true, message: '请选择销售阶段' }]}
      >
        <Select 
          placeholder="请选择销售阶段"
          onChange={handleStageChange}
        >
          {stages.filter(s => !['closed_won', 'closed_lost'].includes(s.id)).map(stage => (
            <Option key={stage.id} value={stage.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div 
                  style={{ 
                    width: 8, 
                    height: 8, 
                    backgroundColor: stage.color,
                    borderRadius: '50%' 
                  }} 
                />
                {stage.name} ({stage.probability}%)
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="probability"
        label="成交概率 (%)"
        rules={[{ required: true, message: '请输入成交概率' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="请输入成交概率"
          min={0}
          max={100}
          formatter={value => `${value}%`}
          parser={value => value?.replace('%', '') as any}
        />
      </Form.Item>

      <Form.Item
        name="expectedCloseDate"
        label="预期成交日期"
        rules={[{ required: true, message: '请选择预期成交日期' }]}
      >
        <DatePicker 
          style={{ width: '100%' }} 
          placeholder="请选择预期成交日期"
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="机会描述"
      >
        <TextArea 
          rows={4} 
          placeholder="请描述这个销售机会的详细情况、客户需求、竞争情况等..."
        />
      </Form.Item>

      <Space>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
          {opportunity ? '更新机会' : '创建机会'}
        </Button>
        <Button onClick={onCancel}>
          取消
        </Button>
      </Space>
    </Form>
  )
}