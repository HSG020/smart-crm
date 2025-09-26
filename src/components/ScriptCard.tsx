import React, { useState } from 'react'
import { Card, Tag, Button, Space, Typography, Modal, message, Tooltip } from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined, 
  EyeOutlined,
  BookOutlined
} from '@ant-design/icons'
import { ScriptTemplate } from '../types'

const { Text, Paragraph } = Typography

interface ScriptCardProps {
  script: ScriptTemplate
  onEdit: (script: ScriptTemplate) => void
  onDelete: (id: string) => void
  onCopy: (script: ScriptTemplate) => void
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  onEdit,
  onDelete,
  onCopy
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const handleCopyContent = () => {
    navigator.clipboard.writeText(script.content)
    message.success('话术已复制到剪贴板')
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '开场白': 'blue',
      '异议处理': 'orange', 
      '跟进': 'green',
      '节日营销': 'purple',
      '成交': 'red',
      '售后': 'cyan',
      '其他': 'default'
    }
    return colors[category] || 'default'
  }

  return (
    <>
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined style={{ color: '#1890ff' }} />
            <Text strong>{script.title}</Text>
          </div>
        }
        extra={
          <Space size="small">
            <Tooltip title="查看详情">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setShowDetails(true)}
              />
            </Tooltip>
            <Tooltip title="复制话术">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyContent}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(script)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(script.id)}
              />
            </Tooltip>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 12 }}>
          <Tag color={getCategoryColor(script.category)}>
            {script.category}
          </Tag>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            {script.scenario}
          </Text>
        </div>
        
        <Paragraph 
          ellipsis={{ rows: 3, expandable: false }}
          style={{ marginBottom: 12, color: '#666' }}
        >
          {script.content}
        </Paragraph>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {script.tags.map(tag => (
            <Tag key={tag} size="small" style={{ fontSize: '11px' }}>
              {tag}
            </Tag>
          ))}
        </div>
      </Card>

      <Modal
        title={script.title}
        open={showDetails}
        onCancel={() => setShowDetails(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyContent}>
            复制话术
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            onEdit(script)
            setShowDetails(false)
          }}>
            编辑
          </Button>,
          <Button key="close" onClick={() => setShowDetails(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>适用场景：</Text>
          <Text style={{ marginLeft: 8 }}>{script.scenario}</Text>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>话术内容：</Text>
          <div style={{ 
            background: '#f6f6f6', 
            padding: '12px', 
            borderRadius: '6px', 
            marginTop: '8px',
            whiteSpace: 'pre-line',
            lineHeight: '1.6'
          }}>
            {script.content}
          </div>
        </div>
        
        <div>
          <Text strong>标签：</Text>
          <div style={{ marginTop: 8 }}>
            {script.tags.map(tag => (
              <Tag key={tag} color={getCategoryColor(script.category)}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}