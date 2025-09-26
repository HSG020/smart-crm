import React, { useState, useEffect } from 'react'
import { Layout, Menu } from 'antd'
import {
  UserOutlined,
  BellOutlined,
  MessageOutlined,
  BookOutlined,
  FunnelPlotOutlined,
  BarChartOutlined,
  TeamOutlined,
  ToolOutlined,
  HomeOutlined
} from '@ant-design/icons'
import { Customers } from './pages/Customers'
import { Reminders } from './pages/Reminders'
import { Communications } from './pages/Communications'
import { Scripts } from './pages/Scripts'
import { Sales } from './pages/Sales'
import { Analytics } from './pages/Analytics'
import { Team } from './pages/Team'
import { Tools } from './pages/Tools'
import { Welcome } from './pages/Welcome'
import ErrorBoundary from './components/ErrorBoundary'

const { Header, Sider, Content } = Layout

function App() {
  const [selectedKey, setSelectedKey] = useState('welcome')
  const [collapsed, setCollapsed] = useState(false)
  
  useEffect(() => {
    console.log('App component mounted, selectedKey:', selectedKey)
  }, [])
  
  useEffect(() => {
    console.log('selectedKey changed to:', selectedKey)
  }, [selectedKey])

  const menuItems = [
    {
      key: 'welcome',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: '客户管理'
    },
    {
      key: 'reminders',
      icon: <BellOutlined />,
      label: '跟进提醒'
    },
    {
      key: 'communications',
      icon: <MessageOutlined />,
      label: '沟通历史'
    },
    {
      key: 'scripts',
      icon: <BookOutlined />,
      label: '话术助手'
    },
    {
      key: 'sales',
      icon: <FunnelPlotOutlined />,
      label: '销售流程'
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析'
    },
    {
      key: 'team',
      icon: <TeamOutlined />,
      label: '团队协作'
    },
    {
      key: 'tools',
      icon: <ToolOutlined />,
      label: '实用工具'
    }
  ]

  const renderContent = () => {
    console.log('renderContent called with selectedKey:', selectedKey)
    
    try {
      switch (selectedKey) {
        case 'welcome':
          console.log('Rendering Welcome component')
          return <Welcome />
        case 'customers':
          console.log('Rendering Customers component')
          return <Customers />
        case 'reminders':
          console.log('Rendering Reminders component')
          return <Reminders />
        case 'communications':
          console.log('Rendering Communications component')
          return <Communications />
        case 'scripts':
          console.log('Rendering Scripts component')
          return <Scripts />
        case 'sales':
          console.log('Rendering Sales component')
          return <Sales />
        case 'analytics':
          console.log('Rendering Analytics component')
          return <Analytics />
        case 'team':
          console.log('Rendering Team component')
          return <Team />
        case 'tools':
          console.log('Rendering Tools component')
          return <Tools />
        default:
          console.log('Rendering default content')
          return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h2>功能开发中...</h2>
              <p>该模块正在开发中，敬请期待</p>
            </div>
          )
      }
    } catch (error) {
      console.error('Error rendering content:', error)
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2>渲染错误</h2>
          <p>组件加载失败，请检查控制台错误信息</p>
          <pre style={{ color: 'red', textAlign: 'left' }}>
            {(error as Error).toString()}
          </pre>
        </div>
      )
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ 
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          {collapsed ? 'CRM' : '智能CRM系统'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: '#fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h1 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            {menuItems.find(item => item.key === selectedKey)?.label}
          </h1>
          <div style={{ color: '#666' }}>
            智能客户关系管理系统
          </div>
        </Header>
        <Content style={{ 
          margin: 0, 
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}>
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App