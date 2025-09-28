/**
 * 预加载触发器组件
 * 用于在鼠标悬停或点击时预加载路由
 */

import React from 'react'
import { preloadManager } from '../utils/preload'

interface PreloadTriggerProps {
  route: string
  children: React.ReactNode
  onHover?: boolean
  onClick?: boolean
}

export const PreloadTrigger: React.FC<PreloadTriggerProps> = ({
  route,
  children,
  onHover = true,
  onClick = false
}) => {
  const handleMouseEnter = () => {
    if (onHover) {
      preloadManager.preloadRoute(route)
    }
  }

  const handleClick = () => {
    if (onClick) {
      preloadManager.preloadRoute(route)
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={{ display: 'inline-block' }}
    >
      {children}
    </div>
  )
}

export default PreloadTrigger