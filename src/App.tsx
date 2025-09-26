// Deployment version: v2.0.2 - All buttons fixed (2025-09-26)
import { useState, useEffect } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd'
import {
  UserOutlined,
  BellOutlined,
  MessageOutlined,
  BookOutlined,
  FunnelPlotOutlined,
  BarChartOutlined,
  TeamOutlined,
  ToolOutlined,
  HomeOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
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
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查用户登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  // 如果没有登录，显示登录页面
  if (!session) {
    return <Auth />
  }

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
    console.log('Rendering content for key:', selectedKey)
    switch (selectedKey) {
      case 'welcome':
        return <ErrorBoundary><Welcome onNavigate={setSelectedKey} /></ErrorBoundary>
      case 'customers':
        return <ErrorBoundary><Customers /></ErrorBoundary>
      case 'reminders':
        return <ErrorBoundary><Reminders /></ErrorBoundary>
      case 'communications':
        return <ErrorBoundary><Communications /></ErrorBoundary>
      case 'scripts':
        return <ErrorBoundary><Scripts /></ErrorBoundary>
      case 'sales':
        return <ErrorBoundary><Sales /></ErrorBoundary>
      case 'analytics':
        return <ErrorBoundary><Analytics /></ErrorBoundary>
      case 'team':
        return <ErrorBoundary><Team /></ErrorBoundary>
      case 'tools':
        return <ErrorBoundary><Tools /></ErrorBoundary>
      default:
        console.warn('Unknown menu key:', selectedKey)
        return <ErrorBoundary><Welcome /></ErrorBoundary>
    }
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleSignOut
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div className="p-4 text-center" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '16px',
          borderRadius: '8px'
        }}>
          <h1 style={{
            color: '#fff',
            fontSize: collapsed ? '18px' : '24px',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '1px'
          }}>
            {collapsed ? 'CRM' : '智能CRM'}
          </h1>
          {!collapsed && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
              客户关系管理系统
            </p>
          )}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => {
            console.log('Menu clicked:', key)
            setSelectedKey(key)
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 className="text-lg font-semibold">
            {menuItems.find(item => item.key === selectedKey)?.label || '首页'}
          </h2>
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
          >
            <Button type="text" className="flex items-center gap-2">
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{session.user.email}</span>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{
          margin: '24px',
          padding: 24,
          background: '#fff',
          minHeight: 280,
          overflow: 'auto'
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App// Force redeploy at 2025年 9月26日 星期五 19时37分54秒 CST
