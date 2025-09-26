import React, { useState } from 'react'
import { Card, Col, Row, Tag, Button, Space, Avatar, Typography, Tooltip, Progress } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Opportunity, SalesStage, Customer } from '../types'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

interface OpportunityBoardProps {
  opportunities: Opportunity[]
  stages: SalesStage[]
  customers: Customer[]
  onMoveOpportunity: (opportunityId: string, stageId: string) => void
  onEditOpportunity: (opportunity: Opportunity) => void
  onDeleteOpportunity: (id: string) => void
  onAddOpportunity: (stageId: string) => void
}

interface OpportunityCardProps {
  opportunity: Opportunity
  customer?: Customer
  onEdit: (opportunity: Opportunity) => void
  onDelete: (id: string) => void
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  customer,
  onEdit,
  onDelete
}) => {
  const isOverdue = dayjs(opportunity.expectedCloseDate).isBefore(dayjs(), 'day')
  const daysToClose = dayjs(opportunity.expectedCloseDate).diff(dayjs(), 'day')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 12,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        style={{
          cursor: 'pointer',
          border: isDragging ? '2px solid #1890ff' : '1px solid #d9d9d9',
          boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div 
                {...attributes} 
                {...listeners} 
                style={{ marginRight: 8, cursor: 'grab' }}
              >
                <DragOutlined style={{ color: '#999' }} />
              </div>
              <Text strong style={{ flex: 1 }}>
                {opportunity.title}
              </Text>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                  {customer ? customer.name.charAt(0) : '?'}
                </Avatar>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {customer ? customer.name : '客户不存在'}
                </Text>
              </Space>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
                ¥{opportunity.value.toLocaleString()}
              </Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Progress 
                percent={opportunity.probability} 
                size="small" 
                strokeColor={opportunity.probability > 75 ? '#52c41a' : opportunity.probability > 50 ? '#faad14' : '#1890ff'}
                showInfo={false}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                成交概率: {opportunity.probability}%
              </Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                预期成交: {dayjs(opportunity.expectedCloseDate).format('MM-DD')}
                {isOverdue && (
                  <Tag color="red" style={{ marginLeft: 4 }}>
                    已逾期
                  </Tag>
                )}
                {!isOverdue && daysToClose <= 7 && (
                  <Tag color="orange" style={{ marginLeft: 4 }}>
                    {daysToClose}天内
                  </Tag>
                )}
              </Text>
            </div>

            {opportunity.description && (
              <Paragraph 
                ellipsis={{ rows: 2 }} 
                style={{ fontSize: '12px', color: '#666', margin: 0 }}
              >
                {opportunity.description}
              </Paragraph>
            )}
          </div>
          
          <Space direction="vertical" size="small">
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(opportunity)
                }}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(opportunity.id)
                }}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export const OpportunityBoard: React.FC<OpportunityBoardProps> = ({
  opportunities,
  stages,
  customers,
  onMoveOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onAddOpportunity
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      // 找到拖拽的机会和目标阶段
      const opportunityId = active.id as string
      const targetStageId = over.id as string
      
      // 检查是否是有效的阶段
      const targetStage = stages.find(s => s.id === targetStageId)
      if (targetStage) {
        onMoveOpportunity(opportunityId, targetStageId)
      }
    }
    
    setActiveId(null)
  }

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId)
  }

  const getOpportunitiesByStage = (stageId: string) => {
    return opportunities.filter(o => o.stage === stageId)
  }

  const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Row gutter={16} style={{ minHeight: '600px' }}>
        {stages.map(stage => {
          const stageOpportunities = getOpportunitiesByStage(stage.id)
          const stageValue = stageOpportunities.reduce((sum, o) => sum + o.value, 0)
          
          return (
            <Col span={4} key={stage.id}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: stage.color,
                        borderRadius: '50%' 
                      }} 
                    />
                    <div>
                      <div>{stage.name}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {stageOpportunities.length} 个机会 · ¥{stageValue.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                }
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => onAddOpportunity(stage.id)}
                  />
                }
                bodyStyle={{ padding: '12px' }}
                style={{ height: '100%' }}
              >
                <SortableContext 
                  items={stageOpportunities.map(o => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ minHeight: '400px' }}>
                    {stageOpportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        customer={getCustomerById(opportunity.customerId)}
                        onEdit={onEditOpportunity}
                        onDelete={onDeleteOpportunity}
                      />
                    ))}
                  </div>
                </SortableContext>
              </Card>
            </Col>
          )
        })}
      </Row>
      
      <DragOverlay>
        {activeOpportunity ? (
          <OpportunityCard
            opportunity={activeOpportunity}
            customer={getCustomerById(activeOpportunity.customerId)}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}