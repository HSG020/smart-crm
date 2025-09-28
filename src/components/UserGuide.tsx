import React, { useState, useEffect } from 'react'
import { Tour, TourProps, FloatButton } from 'antd'
import { QuestionCircleOutlined, CompassOutlined } from '@ant-design/icons'

interface UserGuideProps {
  onComplete?: () => void
}

export const UserGuide: React.FC<UserGuideProps> = ({ onComplete }) => {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)

  // 检查是否为新用户
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide')
    if (!hasSeenGuide) {
      // 延迟1秒后自动开启引导
      setTimeout(() => {
        setOpen(true)
      }, 1000)
    }
  }, [])

  const steps: TourProps['steps'] = [
    {
      title: '欢迎使用 Smart CRM',
      description: '这是一个专门解决客户跟进遗漏问题的智能CRM系统。让我带您快速了解系统的主要功能。',
      target: null,
      placement: 'center'
    },
    {
      title: '客户管理',
      description: '在这里管理所有客户信息，包括基本资料、标签分类、重要程度等。点击可以查看详细信息。',
      target: () => document.querySelector('[href="/customers"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '跟进提醒',
      description: '智能提醒系统会帮您记住每个客户的跟进时间，确保不错过任何重要的商机。',
      target: () => document.querySelector('[href="/reminders"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '沟通记录',
      description: '详细记录每次与客户的沟通内容，包括电话、邮件、会议等，形成完整的客户交流历史。',
      target: () => document.querySelector('[href="/communications"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '话术库',
      description: '内置专业的销售话术模板，帮助您在不同场景下与客户高效沟通。',
      target: () => document.querySelector('[href="/scripts"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '销售机会',
      description: '跟踪每个销售机会的进展，从初步接触到最终成交，清晰展示销售漏斗。',
      target: () => document.querySelector('[href="/sales"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '数据分析',
      description: '通过可视化图表了解销售业绩、客户分布、转化率等关键指标。',
      target: () => document.querySelector('[href="/analytics"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '团队协作',
      description: '团队成员可以共享客户信息，协同跟进，避免重复工作。',
      target: () => document.querySelector('[href="/team"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '实用工具',
      description: '提供客户导入导出、批量操作等实用功能，提高工作效率。',
      target: () => document.querySelector('[href="/tools"]')?.parentElement as HTMLElement,
      placement: 'right'
    },
    {
      title: '快速开始',
      description: '您可以从添加第一个客户开始，或者生成演示数据来快速体验系统功能。',
      target: () => document.querySelector('.ant-card')?.parentElement as HTMLElement,
      placement: 'top'
    },
    {
      title: '准备就绪！',
      description: '恭喜您已经了解了系统的主要功能。如果需要帮助，可以随时点击右下角的帮助按钮重新查看引导。',
      target: null,
      placement: 'center'
    }
  ]

  const handleClose = () => {
    setOpen(false)
    localStorage.setItem('hasSeenGuide', 'true')
    onComplete?.()
  }

  const handleChange = (currentStep: number) => {
    setCurrent(currentStep)
  }

  return (
    <>
      <Tour
        open={open}
        onClose={handleClose}
        steps={steps}
        current={current}
        onChange={handleChange}
        indicatorsRender={(current, total) => (
          <span>{current + 1} / {total}</span>
        )}
      />

      <FloatButton.Group
        trigger="hover"
        icon={<QuestionCircleOutlined />}
        style={{ right: 24, bottom: 24 }}
      >
        <FloatButton
          icon={<CompassOutlined />}
          tooltip="功能引导"
          onClick={() => {
            setCurrent(0)
            setOpen(true)
          }}
        />
      </FloatButton.Group>
    </>
  )
}