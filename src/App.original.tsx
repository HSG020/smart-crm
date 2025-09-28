// Deployment version: v3.0.0 - Professional Routing System (2025-09-26)
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { supabase } from './lib/supabase'

// Layouts
import { MainLayout } from './layouts/MainLayout'

// Auth
import Auth from './components/Auth'

// Pages
import { Welcome } from './pages/Welcome'
import { Customers } from './pages/Customers'
import { Reminders } from './pages/Reminders'
import { Communications } from './pages/Communications'
import { Scripts } from './pages/Scripts'
import { Sales } from './pages/Sales'
import { Analytics } from './pages/Analytics'
import { Team } from './pages/Team'
import { Tools } from './pages/Tools'
import { DatabaseTest } from './pages/DatabaseTest'
import { AIAnalysis } from './pages/AIAnalysis'
import WorkflowAutomation from './pages/WorkflowAutomation'

// Customer Detail Page (to be created)
import { CustomerDetail } from './pages/CustomerDetail'

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" tip="正在加载..." />
      </div>
    )
  }

  // 如果未登录，显示登录页面
  if (!session) {
    return <Auth />
  }

  return <>{children}</>
}

function App() {
  // 配置全局消息
  useEffect(() => {
    message.config({
      top: 100,
      duration: 3,
      maxCount: 3,
    })
  }, [])

  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <BrowserRouter>
          <Routes>
            {/* Protected Routes with MainLayout */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              {/* Default redirect to welcome */}
              <Route index element={<Welcome />} />

              {/* Main Routes */}
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="communications" element={<Communications />} />
              <Route path="scripts" element={<Scripts />} />
              <Route path="sales" element={<Sales />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="ai-analysis" element={<AIAnalysis />} />
              <Route path="workflow-automation" element={<WorkflowAutomation />} />
              <Route path="team" element={<Team />} />
              <Route path="tools" element={<Tools />} />
              <Route path="test" element={<DatabaseTest />} />

              {/* 404 - Redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Login Route (no layout) */}
            <Route path="/login" element={<Auth />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
// Force redeploy at Fri Nov 15 2024 10:39:17 GMT+0800 (China Standard Time)
// Force redeploy at Fri Nov 15 2024 10:43:47 GMT+0800 (China Standard Time)