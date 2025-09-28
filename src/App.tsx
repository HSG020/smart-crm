// Optimized App with lazy loading and code splitting
import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { supabase } from './lib/supabase'
import { initializePreload } from './utils/preload'
import { serviceWorkerManager } from './utils/serviceWorker'

// Layouts - Keep MainLayout eager as it's always needed
import { MainLayout } from './layouts/MainLayout'

// Auth - Keep eager as it's needed for initial load
import Auth from './components/Auth'

// Error Boundary - Keep eager for error handling
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load all pages for code splitting
const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })))
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })))
const Reminders = lazy(() => import('./pages/Reminders').then(m => ({ default: m.Reminders })))
const Communications = lazy(() => import('./pages/Communications').then(m => ({ default: m.Communications })))
const Scripts = lazy(() => import('./pages/Scripts').then(m => ({ default: m.Scripts })))
const Sales = lazy(() => import('./pages/Sales').then(m => ({ default: m.Sales })))
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })))
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })))
const Tools = lazy(() => import('./pages/Tools').then(m => ({ default: m.Tools })))
const DatabaseTest = lazy(() => import('./pages/DatabaseTest').then(m => ({ default: m.DatabaseTest })))
const AIAnalysis = lazy(() => import('./pages/AIAnalysis').then(m => ({ default: m.AIAnalysis })))
const WorkflowAutomation = lazy(() => import('./pages/WorkflowAutomation'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail').then(m => ({ default: m.CustomerDetail })))
const PaymentReminders = lazy(() => import('./pages/PaymentReminders').then(m => ({ default: m.PaymentReminders })))

// Loading component for lazy loaded routes
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh'
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

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

    // 初始化预加载系统
    initializePreload()

    // 注册 Service Worker（仅生产环境）
    serviceWorkerManager.register({
      onUpdate: () => {
        message.info('新版本可用，刷新页面以更新', 5, () => {
          window.location.reload()
        })
      }
    })

    // 移除加载器
    const loader = document.getElementById('app-loader')
    if (loader) {
      loader.style.opacity = '0'
      loader.style.transition = 'opacity 0.3s ease'
      setTimeout(() => {
        loader.remove()
      }, 300)
    }
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
              {/* Wrap all routes in Suspense for lazy loading */}
              <Route index element={
                <Suspense fallback={<PageLoader />}>
                  <Welcome />
                </Suspense>
              } />

              {/* Main Routes - All lazy loaded */}
              <Route path="customers" element={
                <Suspense fallback={<PageLoader />}>
                  <Customers />
                </Suspense>
              } />
              <Route path="customers/:id" element={
                <Suspense fallback={<PageLoader />}>
                  <CustomerDetail />
                </Suspense>
              } />
              <Route path="reminders" element={
                <Suspense fallback={<PageLoader />}>
                  <Reminders />
                </Suspense>
              } />
              <Route path="communications" element={
                <Suspense fallback={<PageLoader />}>
                  <Communications />
                </Suspense>
              } />
              <Route path="scripts" element={
                <Suspense fallback={<PageLoader />}>
                  <Scripts />
                </Suspense>
              } />
              <Route path="sales" element={
                <Suspense fallback={<PageLoader />}>
                  <Sales />
                </Suspense>
              } />
              <Route path="payment-reminders" element={
                <Suspense fallback={<PageLoader />}>
                  <PaymentReminders />
                </Suspense>
              } />
              <Route path="analytics" element={
                <Suspense fallback={<PageLoader />}>
                  <Analytics />
                </Suspense>
              } />
              <Route path="ai-analysis" element={
                <Suspense fallback={<PageLoader />}>
                  <AIAnalysis />
                </Suspense>
              } />
              <Route path="workflow-automation" element={
                <Suspense fallback={<PageLoader />}>
                  <WorkflowAutomation />
                </Suspense>
              } />
              <Route path="team" element={
                <Suspense fallback={<PageLoader />}>
                  <Team />
                </Suspense>
              } />
              <Route path="tools" element={
                <Suspense fallback={<PageLoader />}>
                  <Tools />
                </Suspense>
              } />
              <Route path="test" element={
                <Suspense fallback={<PageLoader />}>
                  <DatabaseTest />
                </Suspense>
              } />

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