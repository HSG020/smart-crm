import React, { useState } from 'react'
import { Button, message } from 'antd'
import { ReminderForm } from '../components/ReminderForm'

export const TestReminder: React.FC = () => {
  const [visible, setVisible] = useState(false)

  const handleClick = () => {
    console.log('Button clicked!')
    message.info('按钮被点击了！')
    setVisible(true)
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>测试添加提醒功能</h1>
      <Button
        type="primary"
        onClick={handleClick}
      >
        测试添加提醒
      </Button>

      <ReminderForm
        visible={visible}
        onCancel={() => {
          console.log('Form cancelled')
          setVisible(false)
        }}
      />
    </div>
  )
}