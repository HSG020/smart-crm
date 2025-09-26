import React, { useRef, useEffect } from 'react'
import { Card, Row, Col } from 'antd'
import * as echarts from 'echarts'
import { Customer, Communication, Opportunity } from '../types'
import dayjs from 'dayjs'

interface AnalyticsChartsProps {
  customers: Customer[]
  communications: Communication[]
  opportunities: Opportunity[]
}

interface ChartComponentProps {
  title: string
  data: any
  type: 'line' | 'pie' | 'bar' | 'funnel' | 'heatmap'
  height?: number
}

const ChartComponent: React.FC<ChartComponentProps> = ({ title, data, type, height = 300 }) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = echarts.init(chartRef.current)

    let option: any = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    }

    switch (type) {
      case 'line':
        option = {
          ...option,
          xAxis: {
            type: 'category',
            data: data.categories
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: data.values,
            type: 'line',
            smooth: true,
            areaStyle: {
              opacity: 0.3
            },
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: '#1890ff'
            }
          }]
        }
        break

      case 'pie':
        option = {
          ...option,
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [{
            type: 'pie',
            radius: '50%',
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        }
        break

      case 'bar':
        option = {
          ...option,
          xAxis: {
            type: 'category',
            data: data.categories
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: data.values,
            type: 'bar',
            itemStyle: {
              color: '#52c41a'
            }
          }]
        }
        break

      case 'heatmap':
        option = {
          ...option,
          tooltip: {
            position: 'top',
            formatter: function (params: any) {
              return `${params.data[0]}时 ${params.data[1]}日: ${params.data[2]}次沟通`
            }
          },
          grid: {
            height: '50%',
            top: '10%'
          },
          xAxis: {
            type: 'category',
            data: data.hours,
            splitArea: {
              show: true
            }
          },
          yAxis: {
            type: 'category',
            data: data.days,
            splitArea: {
              show: true
            }
          },
          visualMap: {
            min: 0,
            max: data.max,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%',
            inRange: {
              color: ['#eee', '#1890ff']
            }
          },
          series: [{
            type: 'heatmap',
            data: data.values,
            label: {
              show: true
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        }
        break
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [title, data, type])

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  customers,
  communications,
  opportunities
}) => {
  // 客户转化率趋势数据
  const getConversionTrendData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().subtract(5 - i, 'month')
      return date.format('YYYY-MM')
    })

    const conversionData = last6Months.map(month => {
      const monthStart = dayjs(month).startOf('month')
      const monthEnd = dayjs(month).endOf('month')
      
      const monthOpportunities = opportunities.filter(o => {
        const createDate = dayjs(o.createdAt)
        return createDate.isAfter(monthStart) && createDate.isBefore(monthEnd)
      })
      
      const closedWon = monthOpportunities.filter(o => o.stage === 'closed_won').length
      const total = monthOpportunities.length
      
      return total > 0 ? (closedWon / total * 100).toFixed(1) : 0
    })

    return {
      categories: last6Months.map(m => dayjs(m).format('MM月')),
      values: conversionData
    }
  }

  // 客户来源分析数据
  const getCustomerSourceData = () => {
    const sources = customers.reduce((acc, customer) => {
      // 简化处理，可以根据实际业务逻辑调整
      const source = customer.tags?.find(tag => 
        ['推荐', '广告', '展会', '电话营销', '网站'].includes(tag)
      ) || '其他'
      
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(sources).map(([name, value]) => ({ name, value }))
  }

  // 月度业绩统计数据
  const getMonthlyPerformanceData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().subtract(5 - i, 'month')
      return date.format('YYYY-MM')
    })

    const performanceData = last6Months.map(month => {
      const monthStart = dayjs(month).startOf('month')
      const monthEnd = dayjs(month).endOf('month')
      
      const monthOpportunities = opportunities.filter(o => {
        const createDate = dayjs(o.createdAt)
        return createDate.isAfter(monthStart) && createDate.isBefore(monthEnd) && o.stage === 'closed_won'
      })
      
      return monthOpportunities.reduce((sum, o) => sum + o.value, 0)
    })

    return {
      categories: last6Months.map(m => dayjs(m).format('MM月')),
      values: performanceData
    }
  }

  // 跟进效果热力图数据
  const getFollowUpHeatmapData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    const heatmapData: number[][][] = []
    let maxValue = 0

    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 7; d++) {
        const count = communications.filter(comm => {
          const commDate = dayjs(comm.createdAt)
          return commDate.hour() === h && commDate.day() === d
        }).length
        
        heatmapData.push([h, d, count])
        maxValue = Math.max(maxValue, count)
      }
    }

    return {
      hours,
      days,
      values: heatmapData,
      max: maxValue
    }
  }

  // 行业分布数据
  const getIndustryDistributionData = () => {
    const industries = customers.reduce((acc, customer) => {
      const industry = customer.industry || '其他'
      acc[industry] = (acc[industry] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(industries).map(([name, value]) => ({ name, value }))
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 客户转化率趋势 */}
        <Col span={12}>
          <Card>
            <ChartComponent
              title="客户转化率趋势"
              data={getConversionTrendData()}
              type="line"
              height={300}
            />
          </Card>
        </Col>

        {/* 客户来源分析 */}
        <Col span={12}>
          <Card>
            <ChartComponent
              title="客户来源分析"
              data={getCustomerSourceData()}
              type="pie"
              height={300}
            />
          </Card>
        </Col>

        {/* 月度业绩统计 */}
        <Col span={12}>
          <Card>
            <ChartComponent
              title="月度业绩统计"
              data={getMonthlyPerformanceData()}
              type="bar"
              height={300}
            />
          </Card>
        </Col>

        {/* 行业分布 */}
        <Col span={12}>
          <Card>
            <ChartComponent
              title="客户行业分布"
              data={getIndustryDistributionData()}
              type="pie"
              height={300}
            />
          </Card>
        </Col>

        {/* 跟进效果热力图 */}
        <Col span={24}>
          <Card>
            <ChartComponent
              title="跟进效果热力图（按时间和星期分布）"
              data={getFollowUpHeatmapData()}
              type="heatmap"
              height={400}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}