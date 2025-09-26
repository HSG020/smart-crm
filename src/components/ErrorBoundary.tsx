import React from 'react'
import { Alert, Button } from 'antd'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px' }}>
          <Alert
            message="组件加载失败"
            description={
              <div>
                <p>该组件无法正常渲染，请检查控制台错误信息</p>
                <pre style={{ fontSize: '12px', color: '#666' }}>
                  {this.state.error?.toString()}
                </pre>
                <Button 
                  type="primary" 
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  style={{ marginTop: 12 }}
                >
                  重试
                </Button>
              </div>
            }
            type="error"
            showIcon
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary