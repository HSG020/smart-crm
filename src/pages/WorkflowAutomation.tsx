/**
 * 工作流自动化独立页面
 * 提供完整的工作流管理功能
 */

import React from 'react'
import { Card, Typography, Space } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { WorkflowIntegration } from '../components/WorkflowIntegration'

const { Title, Paragraph } = Typography

const WorkflowAutomationPage: React.FC = () => {
  return (
    <div className="workflow-automation-page">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card bordered={false}>
          <Space direction="vertical" size="small">
            <Space align="center">
              <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>工作流自动化</Title>
            </Space>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              创建和管理自动化工作流，提升销售团队工作效率。支持事件触发、定时执行、条件判断等多种自动化场景。
            </Paragraph>
          </Space>
        </Card>

        {/* 工作流管理组件 */}
        <WorkflowIntegration />
      </Space>
    </div>
  )
}

export default WorkflowAutomationPage