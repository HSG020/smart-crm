import React from 'react'
import { Card, Row, Col, Statistic, Button, Typography } from 'antd'
import { UserOutlined, BellOutlined, MessageOutlined, TrophyOutlined } from '@ant-design/icons'
import { SystemStatus } from '../components/SystemStatus'

const { Title, Paragraph } = Typography

export const Welcome: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1} style={{ color: '#1890ff' }}>
          欢迎使用智能客户关系管理系统
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          专门解决客户跟进遗漏问题的智能CRM系统，帮助销售人员更好地管理客户关系，提高成交率
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待跟进"
              value={0}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="沟通记录"
              value={0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成交机会"
              value={0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <Title level={3}>快速开始</Title>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card 
              hoverable 
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <UserOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>添加客户</Title>
              <Paragraph>开始录入您的客户信息，建立完整的客户档案</Paragraph>
              <Button type="primary">立即开始</Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              hoverable 
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <BellOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={4}>设置提醒</Title>
              <Paragraph>智能提醒系统帮您不错过任何重要的客户跟进</Paragraph>
              <Button type="primary">查看提醒</Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              hoverable 
              style={{ textAlign: 'center' }}
              bodyStyle={{ padding: '24px' }}
            >
              <MessageOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4}>记录沟通</Title>
              <Paragraph>详细记录每次沟通内容，建立完整的客户交流历史</Paragraph>
              <Button type="primary">添加记录</Button>
            </Card>
          </Col>
        </Row>
      </Card>
      
      <SystemStatus />
    </div>
  )
}