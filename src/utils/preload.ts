/**
 * 智能预加载策略
 * 基于用户行为和优先级预加载资源
 */

// 路由优先级配置
export const ROUTE_PRIORITIES = {
  HIGH: ['/', '/customers', '/reminders', '/sales'],  // 高频访问页面
  MEDIUM: ['/communications', '/analytics', '/ai-analysis'],  // 中频页面
  LOW: ['/tools', '/team', '/test', '/workflow-automation']  // 低频页面
}

// 预加载状态管理
class PreloadManager {
  private preloadedRoutes = new Set<string>()
  private preloadQueue: string[] = []
  private isPreloading = false

  /**
   * 预加载路由组件
   */
  async preloadRoute(routePath: string): Promise<void> {
    if (this.preloadedRoutes.has(routePath)) {
      return
    }

    try {
      // 动态导入对应的页面组件
      switch (routePath) {
        case '/customers':
          await import('../pages/Customers')
          break
        case '/reminders':
          await import('../pages/Reminders')
          break
        case '/sales':
          await import('../pages/Sales')
          break
        case '/analytics':
          await import('../pages/Analytics')
          break
        case '/ai-analysis':
          await import('../pages/AIAnalysis')
          break
        case '/communications':
          await import('../pages/Communications')
          break
        case '/workflow-automation':
          await import('../pages/WorkflowAutomation')
          break
        case '/team':
          await import('../pages/Team')
          break
        case '/tools':
          await import('../pages/Tools')
          break
        case '/scripts':
          await import('../pages/Scripts')
          break
        default:
          console.log(`No preload handler for route: ${routePath}`)
      }

      this.preloadedRoutes.add(routePath)
      console.log(`Preloaded route: ${routePath}`)
    } catch (error) {
      console.error(`Failed to preload route ${routePath}:`, error)
    }
  }

  /**
   * 批量预加载路由
   */
  async preloadRoutes(routes: string[]): Promise<void> {
    for (const route of routes) {
      if (!this.preloadedRoutes.has(route)) {
        this.preloadQueue.push(route)
      }
    }

    if (!this.isPreloading) {
      this.processQueue()
    }
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const route = this.preloadQueue.shift()!
      await this.preloadRoute(route)

      // 添加延迟，避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isPreloading = false
  }

  /**
   * 基于优先级预加载
   */
  async preloadByPriority(priority: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<void> {
    const routes = ROUTE_PRIORITIES[priority]
    await this.preloadRoutes(routes)
  }

  /**
   * 智能预加载（基于网络状态）
   */
  startIntelligentPreload(): void {
    // 检查网络连接类型
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      const effectiveType = connection.effectiveType
      const saveData = connection.saveData

      // 如果是流量节省模式，不预加载
      if (saveData) {
        console.log('Data saver mode detected, skipping preload')
        return
      }

      // 根据网络速度决定预加载策略
      switch (effectiveType) {
        case '4g':
          // 4G 网络，预加载所有高优先级和中优先级
          this.preloadByPriority('HIGH')
          setTimeout(() => this.preloadByPriority('MEDIUM'), 2000)
          break
        case '3g':
          // 3G 网络，只预加载高优先级
          this.preloadByPriority('HIGH')
          break
        case '2g':
        case 'slow-2g':
          // 慢速网络，不预加载
          console.log('Slow network detected, skipping preload')
          break
        default:
          // 默认预加载高优先级
          this.preloadByPriority('HIGH')
      }
    } else {
      // 无法检测网络状态，预加载高优先级
      this.preloadByPriority('HIGH')
    }
  }

  /**
   * 预加载邻近路由（hover 时触发）
   */
  preloadAdjacentRoute(currentRoute: string): void {
    // 定义路由之间的关联关系
    const adjacentRoutes: Record<string, string[]> = {
      '/customers': ['/sales', '/communications'],
      '/sales': ['/customers', '/analytics'],
      '/analytics': ['/ai-analysis', '/sales'],
      '/reminders': ['/customers', '/communications'],
      '/communications': ['/customers', '/reminders']
    }

    const routes = adjacentRoutes[currentRoute] || []
    if (routes.length > 0) {
      this.preloadRoutes(routes)
    }
  }

  /**
   * 清除预加载缓存
   */
  clearCache(): void {
    this.preloadedRoutes.clear()
    this.preloadQueue = []
  }

  /**
   * 获取预加载状态
   */
  getStatus(): {
    preloadedCount: number
    queueLength: number
    isPreloading: boolean
    preloadedRoutes: string[]
  } {
    return {
      preloadedCount: this.preloadedRoutes.size,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      preloadedRoutes: Array.from(this.preloadedRoutes)
    }
  }
}

// 导出单例
export const preloadManager = new PreloadManager()

// React Hook: 使用预加载
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const usePreload = () => {
  const location = useLocation()

  useEffect(() => {
    // 页面加载完成后，开始智能预加载
    const timer = setTimeout(() => {
      preloadManager.startIntelligentPreload()
    }, 2000) // 2秒后开始预加载

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // 当路由改变时，预加载相邻路由
    preloadManager.preloadAdjacentRoute(location.pathname)
  }, [location.pathname])

  return {
    preload: (route: string) => preloadManager.preloadRoute(route),
    preloadMultiple: (routes: string[]) => preloadManager.preloadRoutes(routes),
    getStatus: () => preloadManager.getStatus()
  }
}


// 资源预取函数
export const prefetchResources = (resources: string[]) => {
  resources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = resource
    document.head.appendChild(link)
  })
}

// DNS 预解析
export const dnsPrefetch = (domains: string[]) => {
  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  })
}

// 预连接
export const preconnect = (origins: string[]) => {
  origins.forEach(origin => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
}

// 初始化函数 - 在应用启动时调用
export const initializePreload = () => {
  // DNS 预解析
  dnsPrefetch([
    'https://tuafkxyvvxtwzqrktkvd.supabase.co',
    'https://cdn.jsdelivr.net'
  ])

  // 预连接关键域名
  preconnect([
    'https://tuafkxyvvxtwzqrktkvd.supabase.co'
  ])

  // 监听网络状态变化
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    connection.addEventListener('change', () => {
      console.log('Network status changed:', connection.effectiveType)
      preloadManager.startIntelligentPreload()
    })
  }

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // 页面可见时，恢复预加载
      preloadManager.startIntelligentPreload()
    }
  })
}