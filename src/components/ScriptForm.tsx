import React, { useEffect } from 'react'
import { Form, Input, Select, Button, Space, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ScriptTemplate } from '../types'

const { Option } = Select
const { TextArea } = Input

interface ScriptFormProps {
  script?: ScriptTemplate
  onSubmit: (script: ScriptTemplate) => void
  onCancel: () => void
}

export const ScriptForm: React.FC<ScriptFormProps> = ({
  script,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (script) {
      form.setFieldsValue(script)
    }
  }, [script, form])

  const handleSubmit = (values: any) => {
    const scriptData: ScriptTemplate = {
      id: script?.id || `script_${Date.now()}`,
      ...values,
      tags: values.tags || []
    }
    onSubmit(scriptData)
  }

  const categories = [
    '开场白',
    '异议处理', 
    '跟进',
    '节日营销',
    '成交',
    '售后',
    '其他'
  ]

  const commonTags = [
    '首次联系', '电话', '邮件', '微信',
    '价格', '竞争对手', '决策', '时间',
    '效果', '案例', '优惠', '紧急',
    '专业', '信任', '价值', '服务'
  ]

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        category: '开场白',
        tags: []
      }}
    >
      <Form.Item
        name="title"
        label="话术标题"
        rules={[{ required: true, message: '请输入话术标题' }]}
      >
        <Input placeholder="请输入话术标题，如：首次电话开场白" />
      </Form.Item>

      <Form.Item
        name="category"
        label="话术分类"
        rules={[{ required: true, message: '请选择话术分类' }]}
      >
        <Select placeholder="请选择分类">
          {categories.map(category => (
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="scenario"
        label="适用场景"
        rules={[{ required: true, message: '请输入适用场景' }]}
      >
        <Input placeholder="请描述这个话术适用的具体场景" />
      </Form.Item>

      <Form.Item
        name="content"
        label="话术内容"
        rules={[{ required: true, message: '请输入话术内容' }]}
      >
        <TextArea 
          rows={8} 
          placeholder="请输入详细的话术内容，可以使用 [客户姓名]、[公司名] 等占位符"
        />
      </Form.Item>

      <Form.Item
        name="tags"
        label="标签"
      >
        <Select
          mode="tags"
          placeholder="请选择或输入标签"
          tokenSeparators={[',']}
          style={{ width: '100%' }}
        >
          {commonTags.map(tag => (
            <Option key={tag} value={tag}>
              {tag}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>常用标签：</div>
        <div>
          {commonTags.map(tag => (
            <Tag
              key={tag}
              style={{ cursor: 'pointer', marginBottom: 4 }}
              onClick={() => {
                const currentTags = form.getFieldValue('tags') || []
                if (!currentTags.includes(tag)) {
                  form.setFieldsValue({ tags: [...currentTags, tag] })
                }
              }}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </div>

      <Space>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
          {script ? '更新话术' : '保存话术'}
        </Button>
        <Button onClick={onCancel}>
          取消
        </Button>
      </Space>
    </Form>
  )
}