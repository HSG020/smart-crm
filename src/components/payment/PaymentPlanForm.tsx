/**
 * 回款计划表单组件
 */

import React, { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  message,
  Spin,
  AutoComplete
} from 'antd'
import { paymentService } from '@/services/paymentService'
import type { PaymentPlan } from '@/types/payment'
import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'

interface PaymentPlanFormProps {
  visible: boolean
  editingPlan: PaymentPlan | null
  onClose: () => void
  onSuccess: () => void
  opportunityId?: string
}

const PaymentPlanForm: React.FC<PaymentPlanFormProps> = ({
  visible,
  editingPlan,
  onClose,
  onSuccess,
  opportunityId
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)

  useEffect(() => {
    if (visible) {
      loadOpportunities()
      loadCustomers()

      if (editingPlan) {
        // 编辑模式，填充表单
        form.setFieldsValue({
          ...editingPlan,
          due_date: editingPlan.due_date ? dayjs(editingPlan.due_date) : undefined,
          actual_date: editingPlan.actual_date ? dayjs(editingPlan.actual_date) : undefined
        })
      } else if (opportunityId) {
        // 从销售机会创建
        form.setFieldValue('opportunity_id', opportunityId)
        handleOpportunitySelect(opportunityId)
      } else {
        // 新增模式，重置表单
        form.resetFields()
      }
    }
  }, [visible, editingPlan, opportunityId])

  // 加载销售机会列表
  const loadOpportunities = async () => {
    try {
      const { data } = await supabase
        .from('opportunities')
        .select('id, name, customer_name, amount, stage')
        .in('stage', ['商务谈判', '合同签订', '已成交'])
        .order('created_at', { ascending: false })

      if (data) {
        setOpportunities(data)
      }
    } catch (error) {
      console.error('Error loading opportunities:', error)
    }
  }

  // 加载客户列表
  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, name, company')
        .order('name')

      if (data) {
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  // 选择销售机会时自动填充相关信息
  const handleOpportunitySelect = async (opportunityId: string) => {
    const opportunity = opportunities.find(o => o.id === opportunityId)
    if (opportunity) {
      setSelectedOpportunity(opportunity)

      // 自动填充客户名称和金额
      form.setFieldsValue({
        customer_name: opportunity.customer_name,
        total_amount: opportunity.amount
      })

      // 查找对应的客户ID
      const customer = customers.find(c => c.name === opportunity.customer_name)
      if (customer) {
        form.setFieldValue('customer_id', customer.id)
      }
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 转换日期格式
      const formData = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
        actual_date: values.actual_date ? values.actual_date.format('YYYY-MM-DD') : undefined,
        currency: values.currency || 'CNY'
      }

      let result
      if (editingPlan) {
        // 更新
        result = await paymentService.updatePaymentPlan(editingPlan.id, formData)
      } else {
        // 新增
        result = await paymentService.createPaymentPlan(formData)
      }

      if (result.error) {
        throw result.error
      }

      message.success(`${editingPlan ? '更新' : '创建'}回款计划成功`)
      onSuccess()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={editingPlan ? '编辑回款计划' : '新增回款计划'}
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={800}
      confirmLoading={loading}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            currency: 'CNY',
            installment: 1,
            total_installments: 1,
            received_amount: 0,
            status: 'pending'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="opportunity_id"
                label="关联销售机会"
                rules={[{ required: false, message: '请选择销售机会' }]}
              >
                <Select
                  placeholder="请选择销售机会"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleOpportunitySelect}
                  allowClear
                >
                  {opportunities.map(opp => (
                    <Select.Option key={opp.id} value={opp.id}>
                      {opp.name} - {opp.customer_name} (¥{opp.amount?.toLocaleString()})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contract_number"
                label="合同编号"
                rules={[{ required: false, message: '请输入合同编号' }]}
              >
                <Input placeholder="请输入合同编号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  placeholder="请选择客户"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {customers.map(customer => (
                    <Select.Option key={customer.id} value={customer.id}>
                      {customer.name} {customer.company ? `(${customer.company})` : ''}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer_name"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="total_amount"
                label="应收总额"
                rules={[
                  { required: true, message: '请输入应收总额' },
                  { type: 'number', min: 0, message: '金额不能为负数' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入应收总额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="received_amount"
                label="已收金额"
                rules={[
                  { type: 'number', min: 0, message: '金额不能为负数' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入已收金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/¥\s?|(,*)/g, '')}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="货币单位"
                rules={[{ required: true, message: '请选择货币单位' }]}
              >
                <Select placeholder="请选择货币单位">
                  <Select.Option value="CNY">人民币 (CNY)</Select.Option>
                  <Select.Option value="USD">美元 (USD)</Select.Option>
                  <Select.Option value="EUR">欧元 (EUR)</Select.Option>
                  <Select.Option value="HKD">港币 (HKD)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="due_date"
                label="应收日期"
                rules={[{ required: true, message: '请选择应收日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择应收日期"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actual_date"
                label="实际回款日期"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择实际回款日期"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Select.Option value="pending">待回款</Select.Option>
                  <Select.Option value="partial">部分回款</Select.Option>
                  <Select.Option value="completed">已回款</Select.Option>
                  <Select.Option value="overdue">已逾期</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="installment"
                label="期数"
                rules={[
                  { required: true, message: '请输入期数' },
                  { type: 'number', min: 1, message: '期数必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="第几期"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_installments"
                label="总期数"
                rules={[
                  { required: true, message: '请输入总期数' },
                  { type: 'number', min: 1, message: '总期数必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="总期数"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="owner_id"
                label="负责人"
              >
                <Select placeholder="请选择负责人" allowClear>
                  {/* TODO: 加载用户列表 */}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="notes"
                label="备注"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请输入备注信息"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  )
}

export default PaymentPlanForm