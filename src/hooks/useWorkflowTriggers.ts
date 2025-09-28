/**
 * 工作流触发器 Hook
 * 在应用启动时初始化触发器系统
 */

import { useEffect, useState } from 'react'
import { startTriggerSystem, stopTriggerSystem, triggerWorkflow } from '../services/workflow/triggers'
import { message } from 'antd'

export interface UseWorkflowTriggersReturn {
  isRunning: boolean
  isLoading: boolean
  error: string | null
  startTriggers: () => Promise<void>
  stopTriggers: () => Promise<void>
  triggerManually: (workflowId: string, data?: Record<string, any>) => Promise<void>
}

export function useWorkflowTriggers(autoStart: boolean = false): UseWorkflowTriggersReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 自动启动触发器系统
  useEffect(() => {
    if (autoStart) {
      startTriggers()
    }

    // 清理函数
    return () => {
      if (isRunning) {
        stopTriggers()
      }
    }
  }, [autoStart])

  // 启动触发器系统
  const startTriggers = async () => {
    if (isRunning) {
      message.warning('触发器系统已在运行中')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await startTriggerSystem()
      setIsRunning(true)
      message.success('工作流触发器系统已启动')
    } catch (err) {
      const errorMsg = String(err)
      setError(errorMsg)
      message.error(`启动触发器失败: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 停止触发器系统
  const stopTriggers = async () => {
    if (!isRunning) {
      return
    }

    setIsLoading(true)

    try {
      await stopTriggerSystem()
      setIsRunning(false)
      message.info('工作流触发器系统已停止')
    } catch (err) {
      const errorMsg = String(err)
      setError(errorMsg)
      message.error(`停止触发器失败: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 手动触发工作流
  const triggerManually = async (workflowId: string, data?: Record<string, any>) => {
    setIsLoading(true)

    try {
      await triggerWorkflow(workflowId, data)
      message.success('工作流已手动触发')
    } catch (err) {
      const errorMsg = String(err)
      message.error(`触发工作流失败: ${errorMsg}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isRunning,
    isLoading,
    error,
    startTriggers,
    stopTriggers,
    triggerManually
  }
}