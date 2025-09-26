import React, { useEffect, useState } from 'react'
import { Card, Button, Space, Modal, message, Tabs, Row, Col } from 'antd'
import { PlusOutlined, FunnelPlotOutlined, AppstoreOutlined } from '@ant-design/icons'
import { SalesFunnel } from '../components/SalesFunnel'
import { OpportunityBoard } from '../components/OpportunityBoard'
import { OpportunityForm } from '../components/OpportunityForm'
import { useOpportunityStore } from '../store/opportunityStore'
import { useCustomerStore } from '../store/customerStore'
import { Opportunity } from '../types'

const { TabPane } = Tabs

export const Sales: React.FC = () => {
  const {
    opportunities,
    stages,
    loading,
    loadOpportunities,
    loadStages,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    moveOpportunityToStage,
    getTotalPipelineValue,
    getWeightedPipelineValue
  } = useOpportunityStore()

  const { customers, loadCustomers } = useCustomerStore()

  const [showForm, setShowForm] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [defaultStageId, setDefaultStageId] = useState<string>()
  const [activeTab, setActiveTab] = useState('funnel')

  useEffect(() => {
    loadOpportunities()
    loadStages()
    loadCustomers()
  }, [loadOpportunities, loadStages, loadCustomers])

  const handleAddOpportunity = (stageId?: string) => {
    setEditingOpportunity(null)
    setDefaultStageId(stageId)
    setShowForm(true)
  }

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setDefaultStageId(undefined)
    setShowForm(true)
  }

  const handleSubmitOpportunity = async (opportunity: Opportunity) => {
    try {
      if (editingOpportunity) {
        await updateOpportunity(opportunity)
        message.success('销售机会更新成功')
      } else {
        await addOpportunity(opportunity)
        message.success('销售机会创建成功')
      }
      setShowForm(false)
      setEditingOpportunity(null)
      setDefaultStageId(undefined)
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleDeleteOpportunity = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个销售机会吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteOpportunity(id)
          message.success('销售机会删除成功')
        } catch (error) {
          message.error('删除失败，请重试')
        }
      }
    })
  }

  const handleMoveOpportunity = async (opportunityId: string, stageId: string) => {
    try {
      await moveOpportunityToStage(opportunityId, stageId)
      message.success('机会阶段更新成功')
    } catch (error) {
      message.error('更新失败，请重试')
    }
  }

  const handleStageClick = (stageId: string) => {
    setActiveTab('board')
    // 可以添加高亮特定阶段的逻辑
  }

  // 统计数据
  const totalPipelineValue = getTotalPipelineValue()
  const weightedPipelineValue = getWeightedPipelineValue()
  const activeOpportunities = opportunities.filter(o => 
    !['closed_won', 'closed_lost'].includes(o.stage)
  )
  const closedWonOpportunities = opportunities.filter(o => o.stage === 'closed_won')
  const closedWonValue = closedWonOpportunities.reduce((sum, o) => sum + o.value, 0)

  return (
    <div style={{ padding: '24px' }}>
      {/* 顶部统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {activeOpportunities.length}
              </div>
              <div style={{ color: '#666' }}>活跃机会</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                ¥{totalPipelineValue.toLocaleString()}
              </div>
              <div style={{ color: '#666' }}>管道总价值</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                ¥{weightedPipelineValue.toLocaleString()}
              </div>
              <div style={{ color: '#666' }}>加权价值</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                ¥{closedWonValue.toLocaleString()}
              </div>
              <div style={{ color: '#666' }}>已成交金额</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card
        title="销售流程管理"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAddOpportunity()}
            >
              创建机会
            </Button>
          </Space>
        }
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'funnel',
              label: (
                <span>
                  <FunnelPlotOutlined />
                  销售漏斗
                </span>
              ),
              children: (
                <SalesFunnel
                  stages={stages}
                  opportunities={opportunities}
                  onStageClick={handleStageClick}
                />
              )
            },
            {
              key: 'board',
              label: (
                <span>
                  <AppstoreOutlined />
                  看板视图
                </span>
              ),
              children: (
                <OpportunityBoard
                  opportunities={opportunities}
                  stages={stages}
                  customers={customers}
                  onMoveOpportunity={handleMoveOpportunity}
                  onEditOpportunity={handleEditOpportunity}
                  onDeleteOpportunity={handleDeleteOpportunity}
                  onAddOpportunity={handleAddOpportunity}
                />
              )
            }
          ]}
        />
      </Card>

      {/* 添加/编辑机会表单模态框 */}
      <Modal
        title={editingOpportunity ? '编辑销售机会' : '创建销售机会'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditingOpportunity(null)
          setDefaultStageId(undefined)
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <OpportunityForm
          opportunity={editingOpportunity}
          customers={customers}
          stages={stages}
          defaultStageId={defaultStageId}
          onSubmit={handleSubmitOpportunity}
          onCancel={() => {
            setShowForm(false)
            setEditingOpportunity(null)
            setDefaultStageId(undefined)
          }}
        />
      </Modal>
    </div>
  )
}