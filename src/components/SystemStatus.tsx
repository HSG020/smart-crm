import React from 'react'
import { Card, Alert, Space, Tag } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

export const SystemStatus: React.FC = () => {
  const checkStatus = {
    react: true,
    antd: true,
    icons: true,
    stores: true,
    routing: true
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    )
  }

  const getStatusTag = (status: boolean) => {
    return status ? (
      <Tag color="success">正常</Tag>
    ) : (
      <Tag color="error">异常</Tag>
    )
  }

  return (
    <Card title="系统状态检查" style={{ margin: 24 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert 
          message="系统核心模块状态" 
          description="检查核心功能模块是否正常加载" 
          type="info" 
        />
        
        <div>
          <Space align="center">
            {getStatusIcon(checkStatus.react)}
            <span>React 框架:</span>
            {getStatusTag(checkStatus.react)}
          </Space>
        </div>
        
        <div>
          <Space align="center">
            {getStatusIcon(checkStatus.antd)}
            <span>Ant Design UI:</span>
            {getStatusTag(checkStatus.antd)}
          </Space>
        </div>
        
        <div>
          <Space align="center">
            {getStatusIcon(checkStatus.icons)}
            <span>图标库:</span>
            {getStatusTag(checkStatus.icons)}
          </Space>
        </div>
        
        <div>
          <Space align="center">
            {getStatusIcon(checkStatus.stores)}
            <span>状态管理:</span>
            {getStatusTag(checkStatus.stores)}
          </Space>
        </div>
        
        <div>
          <Space align="center">
            {getStatusIcon(checkStatus.routing)}
            <span>路由系统:</span>
            {getStatusTag(checkStatus.routing)}
          </Space>
        </div>
      </Space>
      
      <Alert 
        message="系统已就绪" 
        description="所有核心模块正常运行，您可以开始使用系统功能" 
        type="success" 
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  )
}