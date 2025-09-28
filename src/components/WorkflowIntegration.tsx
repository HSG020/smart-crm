/**
 * 工作流集成示例组件
 * 展示如何在实际业务中使用工作流系统
 */

import React, { useEffect } from 'react'
import { Card, Button, Space, Tag, Switch, Alert, List, Typography } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, ThunderboltOutlined, RobotOutlined } from '@ant-design/icons'
import { useWorkflowTriggers } from '../hooks/useWorkflowTriggers'
import { useCustomerStore } from '../store/customerStore'
import { WorkflowEngine } from '../services/workflow/engine'
import { newCustomerWorkflow } from '../services/workflow/templates'

const { Title, Text, Paragraph } = Typography

export const WorkflowIntegration: React.FC = () => {
  const { addCustomer } = useCustomerStore()
  const {
    isRunning,
    isLoading,
    error,
    startTriggers,
    stopTriggers,
    triggerManually
  } = useWorkflowTriggers(false) // 不自动启动

  // 模拟创建新客户并触发工作流
  const handleCreateCustomerWithWorkflow = async () => {
    try {
      // 1. 创建新客户
      const newCustomer = {
        name: `测试客户_${Date.now()}`,
        company: '自动化测试公司',
        phone: '13800138000',
        email: 'test@example.com',
        importance: 'high' as const,
        status: 'potential' as const,
        industry: '互联网'
      }

      // 2. 添加到数据库
      const customer = await addCustomer(newCustomer)

      // 3. 手动触发新客户工作流
      const engine = new WorkflowEngine(newCustomerWorkflow)
      const result = await engine.execute({
        customer: customer,
        trigger: {
          type: 'manual',
          source: 'demo'
        }
      })

      if (result.success) {
        console.log('✅ 工作流执行成功:', result.output)
      } else {
        console.error('❌ 工作流执行失败:', result.error)
      }
    } catch (error) {
      console.error('创建客户失败:', error)
    }
  }

  // 手动触发特定工作流
  const handleManualTrigger = (workflowId: string) => {
    triggerManually(workflowId, {
      source: 'manual',
      user: 'demo'
    })
  }

  return (
    <div>
      {/* 触发器控制面板 */}
      <Card
        title={
          <Space>
            <RobotOutlined style={{ fontSize: '20px' }} />
            <span>工作流自动化控制</span>
          </Space>
        }
        extra={
          <Switch
            checked={isRunning}
            loading={isLoading}
            onChange={(checked) => {
              if (checked) {
                startTriggers()
              } else {
                stopTriggers()
              }
            }}
            checkedChildren="运行中"
            unCheckedChildren="已停止"
          />
        }
        style={{ marginBottom: 16 }}
      >
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>系统状态：</Text>
            <Tag color={isRunning ? 'success' : 'default'}>
              {isRunning ? '自动化运行中' : '自动化已停止'}
            </Tag>
          </div>

          <Paragraph type="secondary">
            启用后，系统将自动监听以下事件：
          </Paragraph>

          <List
            size="small"
            bordered
            dataSource={[
              { event: '新客户创建', workflow: '自动分配、创建提醒、发送欢迎邮件' },
              { event: '每日 9:00', workflow: '创建当日跟进提醒' },
              { event: '销售机会阶段变更', workflow: '更新提醒、通知团队' }
            ]}
            renderItem={item => (
              <List.Item>
                <Space>
                  <Tag color="blue">{item.event}</Tag>
                  <Text>→</Text>
                  <Text type="secondary">{item.workflow}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Space>
      </Card>

      {/* 手动触发面板 */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ fontSize: '20px' }} />
            <span>手动触发工作流</span>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="测试提示"
            description="点击下方按钮可以手动触发工作流，用于测试和演示"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space wrap>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleCreateCustomerWithWorkflow}
              loading={isLoading}
            >
              创建客户并触发工作流
            </Button>

            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => handleManualTrigger('new-customer-automation')}
              disabled={!isRunning}
            >
              触发新客户流程
            </Button>

            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => handleManualTrigger('daily-follow-up')}
              disabled={!isRunning}
            >
              触发每日提醒
            </Button>

            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => handleManualTrigger('opportunity-stage-change')}
              disabled={!isRunning}
            >
              触发机会推进
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  )
}