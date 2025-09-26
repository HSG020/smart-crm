import React, { useRef, useEffect } from 'react'
import { Card, Row, Col, Statistic, Tag, Tooltip } from 'antd'
import { UserOutlined, DollarOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import { SalesStage, Opportunity } from '../types'

interface SalesFunnelProps {
  stages: SalesStage[]
  opportunities: Opportunity[]
  onStageClick?: (stageId: string) => void
}

export const SalesFunnel: React.FC<SalesFunnelProps> = ({
  stages,
  opportunities,
  onStageClick
}) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)

    // 准备漏斗图数据
    const funnelData = stages
      .filter(stage => !['closed_won', 'closed_lost'].includes(stage.id))
      .map(stage => {
        const stageOpportunities = opportunities.filter(o => o.stage === stage.id)
        const totalValue = stageOpportunities.reduce((sum, o) => sum + o.value, 0)
        
        return {
          value: stageOpportunities.length,
          name: `${stage.name} (${stageOpportunities.length})`,
          itemStyle: {
            color: stage.color
          },
          label: {
            fontSize: 14,
            fontWeight: 'bold'
          },
          emphasis: {
            label: {
              fontSize: 16
            }
          }
        }
      })

    const option = {
      title: {
        text: '销售漏斗',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 个机会'
      },
      series: [
        {
          type: 'funnel',
          data: funnelData,
          left: '10%',
          top: '15%',
          width: '80%',
          height: '70%',
          min: 0,
          max: Math.max(...funnelData.map(d => d.value)),
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}',
            color: '#fff',
            fontSize: 12
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 14
            }
          }
        }
      ]
    }

    chart.setOption(option)

    // 添加点击事件
    chart.on('click', (params) => {
      const stageIndex = funnelData.findIndex(d => d.name === params.name)
      if (stageIndex !== -1 && onStageClick) {
        const stage = stages.filter(s => !['closed_won', 'closed_lost'].includes(s.id))[stageIndex]
        onStageClick(stage.id)
      }
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [stages, opportunities, onStageClick])

  // 计算统计数据
  const totalOpportunities = opportunities.filter(o => 
    !['closed_won', 'closed_lost'].includes(o.stage)
  ).length

  const totalValue = opportunities
    .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
    .reduce((sum, o) => sum + o.value, 0)

  const weightedValue = opportunities
    .filter(o => !['closed_won', 'closed_lost'].includes(o.stage))
    .reduce((sum, o) => sum + (o.value * o.probability / 100), 0)

  const closedWon = opportunities.filter(o => o.stage === 'closed_won')
  const closedLost = opportunities.filter(o => o.stage === 'closed_lost')

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="管道中机会"
              value={totalOpportunities}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管道总价值"
              value={totalValue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="加权价值"
              value={weightedValue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成交率"
              value={
                closedWon.length + closedLost.length > 0
                  ? (closedWon.length / (closedWon.length + closedLost.length) * 100)
                  : 0
              }
              suffix="%"
              valueStyle={{ 
                color: closedWon.length / (closedWon.length + closedLost.length) > 0.5 
                  ? '#52c41a' : '#faad14' 
              }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* 漏斗图 */}
      <Card>
        <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
      </Card>

      {/* 阶段详情 */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        {stages.map(stage => {
          const stageOpportunities = opportunities.filter(o => o.stage === stage.id)
          const stageValue = stageOpportunities.reduce((sum, o) => sum + o.value, 0)
          
          return (
            <Col span={8} key={stage.id} style={{ marginBottom: 16 }}>
              <Card 
                size="small" 
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
                    {stage.name}
                  </div>
                }
                extra={
                  <Tag color={stage.color}>
                    {stage.probability}%
                  </Tag>
                }
                style={{ cursor: 'pointer' }}
                onClick={() => onStageClick?.(stage.id)}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: stage.color }}>
                    {stageOpportunities.length}
                  </div>
                  <div style={{ color: '#666', marginBottom: 8 }}>个机会</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    ¥{stageValue.toLocaleString()}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}