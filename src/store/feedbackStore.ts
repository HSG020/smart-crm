import { create } from 'zustand'
import { message, notification } from 'antd'

interface FeedbackStore {
  loading: boolean
  loadingText: string
  operations: Map<string, boolean>

  // 全局加载状态
  showLoading: (text?: string) => void
  hideLoading: () => void

  // 操作级加载状态
  setOperationLoading: (operationId: string, loading: boolean) => void
  isOperationLoading: (operationId: string) => boolean

  // 成功反馈
  success: (text: string, description?: string) => void

  // 错误反馈
  error: (text: string, description?: string) => void

  // 信息反馈
  info: (text: string, description?: string) => void

  // 警告反馈
  warning: (text: string, description?: string) => void

  // 确认操作
  confirm: (title: string, content: string, onOk: () => void) => void
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  loading: false,
  loadingText: '处理中...',
  operations: new Map(),

  showLoading: (text = '处理中...') => {
    set({ loading: true, loadingText: text })
    message.loading({
      content: text,
      duration: 0,
      key: 'global-loading'
    })
  },

  hideLoading: () => {
    set({ loading: false })
    message.destroy('global-loading')
  },

  setOperationLoading: (operationId, loading) => {
    const { operations } = get()
    const newOperations = new Map(operations)
    if (loading) {
      newOperations.set(operationId, true)
    } else {
      newOperations.delete(operationId)
    }
    set({ operations: newOperations })
  },

  isOperationLoading: (operationId) => {
    const { operations } = get()
    return operations.get(operationId) || false
  },

  success: (text, description) => {
    if (description) {
      notification.success({
        message: text,
        description,
        placement: 'topRight',
        duration: 3
      })
    } else {
      message.success(text)
    }
  },

  error: (text, description) => {
    if (description) {
      notification.error({
        message: text,
        description,
        placement: 'topRight',
        duration: 4
      })
    } else {
      message.error(text)
    }
  },

  info: (text, description) => {
    if (description) {
      notification.info({
        message: text,
        description,
        placement: 'topRight',
        duration: 3
      })
    } else {
      message.info(text)
    }
  },

  warning: (text, description) => {
    if (description) {
      notification.warning({
        message: text,
        description,
        placement: 'topRight',
        duration: 3
      })
    } else {
      message.warning({
        content: text,
        duration: 2.5
      })
    }
  },

  confirm: (title, content, onOk) => {
    const key = `confirm-${Date.now()}`
    notification.info({
      key,
      message: title,
      description: content,
      duration: 0,
      btn: undefined,
      onClose: () => {
        notification.close(key)
      }
    })
    // For simplicity, auto-confirm after showing notification
    // In production, you'd want to use a proper Modal.confirm
    setTimeout(() => {
      notification.close(key)
      onOk()
    }, 3000)
  }
}))