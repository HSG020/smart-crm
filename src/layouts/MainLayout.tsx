import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Badge } from 'antd'
import { UserGuide } from '../components/UserGuide'
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
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
  RobotOutlined,
  SettingOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { supabase } from '../lib/supabase'

const { Header, Sider, Content } = Layout

export const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // 检查用户登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '欢迎页',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: '客户管理',
    },
    {
      key: '/reminders',
      icon: <BellOutlined />,
      label: '跟进提醒',
    },
    {
      key: '/communications',
      icon: <MessageOutlined />,
      label: '沟通记录',
    },
    {
      key: '/scripts',
      icon: <BookOutlined />,
      label: '话术库',
    },
    {
      key: '/sales',
      icon: <FunnelPlotOutlined />,
      label: '销售机会',
    },
    {
      key: '/payment-reminders',
      icon: <DollarOutlined />,
      label: '回款提醒',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/ai-analysis',
      icon: <RobotOutlined />,
      label: 'AI分析',
    },
    {
      key: '/workflow-automation',
      icon: <SettingOutlined />,
      label: '工作流自动化',
    },
    {
      key: '/team',
      icon: <TeamOutlined />,
      label: '团队管理',
    },
    {
      key: '/tools',
      icon: <ToolOutlined />,
      label: '实用工具',
    },
    {
      key: '/test',
      icon: <BugOutlined />,
      label: '数据库诊断',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  // 根据当前路径设置选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname
    // 如果是客户详情页，仍然高亮客户管理菜单
    if (path.startsWith('/customers')) return '/customers'
    // 如果是工作流自动化页，高亮工作流菜单
    if (path.startsWith('/workflow-automation')) return '/workflow-automation'
    return path
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: collapsed ? '20px' : '24px' }}>
            {collapsed ? 'CRM' : 'Smart CRM'}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={5} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Badge count={3} size="small">
              <Button type="text" icon={<MessageOutlined />} />
            </Badge>
            <Dropdown
              menu={{ items: userMenu }}
              placement="bottomRight"
            >
              <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={session?.user?.user_metadata?.avatar_url}
                />
                <span>{session?.user?.email || '用户'}</span>
              </Button>
            </Dropdown>
          </div>
        </Header>

        <Content style={{
          margin: '24px',
          minHeight: 280,
        }}>
          <Outlet />
        </Content>
      </Layout>
      <UserGuide />
    </Layout>
  )
}