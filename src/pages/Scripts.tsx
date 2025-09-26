import React, { useEffect, useState } from 'react'
import { Card, Button, Input, Space, Modal, message, Row, Col, Select, Empty, Divider } from 'antd'
import { PlusOutlined, SearchOutlined, BookOutlined, BulbOutlined } from '@ant-design/icons'
import { ScriptCard } from '../components/ScriptCard'
import { ScriptForm } from '../components/ScriptForm'
import { useScriptStore, initializeDefaultScripts } from '../store/scriptStore'
import { ScriptTemplate, Customer } from '../types'
import { useCustomerStore } from '../store/customerStore'

const { Search } = Input
const { Option } = Select

export const Scripts: React.FC = () => {
  const {
    scripts,
    loading,
    searchTerm,
    selectedCategory,
    loadScripts,
    addScript,
    updateScript,
    deleteScript,
    setSearchTerm,
    setSelectedCategory,
    getFilteredScripts,
    getCategories
  } = useScriptStore()

  const { customers } = useCustomerStore()

  const [showForm, setShowForm] = useState(false)
  const [editingScript, setEditingScript] = useState<ScriptTemplate | null>(null)
  const [showAIHelper, setShowAIHelper] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string>()

  useEffect(() => {
    loadScripts().then(() => {
      // 如果没有话术，初始化默认话术
      if (scripts.length === 0) {
        initializeDefaultScripts()
      }
    })
  }, [loadScripts])

  const handleAddScript = () => {
    setEditingScript(null)
    setShowForm(true)
  }

  const handleEditScript = (script: ScriptTemplate) => {
    setEditingScript(script)
    setShowForm(true)
  }

  const handleSubmitScript = async (script: ScriptTemplate) => {
    try {
      if (editingScript) {
        await updateScript(script)
        message.success('话术更新成功')
      } else {
        await addScript(script)
        message.success('话术添加成功')
      }
      setShowForm(false)
      setEditingScript(null)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleDeleteScript = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个话术模板吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteScript(id)
          message.success('话术删除成功')
        } catch (error) {
          message.error('删除失败，请重试')
        }
      }
    })
  }

  const handleCopyScript = (script: ScriptTemplate) => {
    const newScript = {
      ...script,
      id: `script_${Date.now()}`,
      title: `${script.title} (副本)`
    }
    addScript(newScript)
    message.success('话术已复制')
  }

  const generatePersonalizedScript = (customer: Customer | undefined, script: ScriptTemplate) => {
    if (!customer) return script.content

    let personalizedContent = script.content
      .replace(/\[客户姓名\]/g, customer.name)
      .replace(/\[公司名\]/g, customer.company)
      .replace(/\[行业\]/g, customer.industry || '您的行业')
      .replace(/\[职位\]/g, customer.position || '您的职位')

    return personalizedContent
  }

  const showPersonalizedScript = (script: ScriptTemplate) => {
    const customer = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : undefined
    const personalizedContent = generatePersonalizedScript(customer, script)
    
    Modal.info({
      title: `个性化话术：${script.title}`,
      content: (
        <div>
          {customer && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 6 }}>
              <strong>目标客户：</strong>{customer.name} - {customer.company}
            </div>
          )}
          <div style={{ 
            background: '#f6f6f6', 
            padding: 12, 
            borderRadius: 6,
            whiteSpace: 'pre-line',
            lineHeight: 1.6
          }}>
            {personalizedContent}
          </div>
        </div>
      ),
      width: 600,
      okText: '复制话术',
      onOk: () => {
        navigator.clipboard.writeText(personalizedContent)
        message.success('个性化话术已复制到剪贴板')
      }
    })
  }

  const filteredScripts = getFilteredScripts()
  const categories = getCategories()

  return (
    <div style={{ padding: '24px' }}>
      {/* 工具栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="large">
              <Search
                placeholder="搜索话术标题、场景、内容或标签"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              
              <Select
                placeholder="选择分类"
                style={{ width: 150 }}
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
              >
                {categories.map(category => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Button
                icon={<BulbOutlined />}
                onClick={() => setShowAIHelper(true)}
              >
                智能助手
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddScript}
              >
                添加话术
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 话术列表 */}
      <Card title={`话术库 (${filteredScripts.length})`}>
        {filteredScripts.length === 0 ? (
          <Empty 
            description="暂无话术模板"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddScript}>
              创建第一个话术
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredScripts.map(script => (
              <Col xs={24} sm={12} lg={8} xl={6} key={script.id}>
                <ScriptCard
                  script={script}
                  onEdit={handleEditScript}
                  onDelete={handleDeleteScript}
                  onCopy={handleCopyScript}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 添加/编辑表单模态框 */}
      <Modal
        title={editingScript ? '编辑话术' : '添加话术'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditingScript(null)
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <ScriptForm
          script={editingScript}
          onSubmit={handleSubmitScript}
          onCancel={() => {
            setShowForm(false)
            setEditingScript(null)
          }}
        />
      </Modal>

      {/* 智能助手模态框 */}
      <Modal
        title="智能话术助手"
        open={showAIHelper}
        onCancel={() => setShowAIHelper(false)}
        footer={null}
        width={800}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <h4>个性化话术生成</h4>
            <Select
              placeholder="选择目标客户"
              style={{ width: '100%', marginBottom: 16 }}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
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
            
            <div style={{ marginBottom: 16 }}>
              <strong>选择话术模板：</strong>
            </div>
            
            <Row gutter={[8, 8]}>
              {scripts.slice(0, 6).map(script => (
                <Col span={12} key={script.id}>
                  <Button
                    size="small"
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => showPersonalizedScript(script)}
                  >
                    {script.title}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>
          
          <Divider />
          
          <div>
            <h4>话术建议</h4>
            <div style={{ background: '#f6f6f6', padding: 16, borderRadius: 6 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>开场白要简洁明了，迅速建立信任</li>
                <li>多使用客户的名字，增加亲近感</li>
                <li>准备好应对常见异议的话术</li>
                <li>结尾要有明确的下一步行动</li>
                <li>根据客户行业特点调整用词</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}