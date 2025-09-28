/**
 * 智能懒加载图片组件
 * 支持 IntersectionObserver、WebP 格式、占位符、错误处理
 */

import React, { useState, useEffect, useRef, CSSProperties } from 'react'
import { Skeleton } from 'antd'

interface LazyImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
  placeholder?: string | React.ReactNode
  fallback?: string
  webp?: boolean
  preload?: boolean
  threshold?: number
  rootMargin?: string
  onLoad?: () => void
  onError?: () => void
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

// 检测浏览器是否支持 WebP
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, 1, 1)

  try {
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 0
  } catch {
    return false
  }
})()

// 预加载图片
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject()
    img.src = src
  })
}

// 图片缓存管理
class ImageCache {
  private static cache = new Set<string>()
  private static loading = new Map<string, Promise<void>>()

  static has(src: string): boolean {
    return this.cache.has(src)
  }

  static async load(src: string): Promise<void> {
    if (this.cache.has(src)) {
      return Promise.resolve()
    }

    if (this.loading.has(src)) {
      return this.loading.get(src)!
    }

    const loadPromise = preloadImage(src)
      .then(() => {
        this.cache.add(src)
        this.loading.delete(src)
      })
      .catch(() => {
        this.loading.delete(src)
        throw new Error(`Failed to load image: ${src}`)
      })

    this.loading.set(src, loadPromise)
    return loadPromise
  }
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  placeholder,
  fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3E暂无图片%3C/text%3E%3C/svg%3E',
  webp = true,
  preload = false,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  objectFit = 'cover'
}) => {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 获取最终的图片 URL
  const getFinalSrc = (): string => {
    if (!src) return fallback

    // 如果支持 WebP 且开启了 WebP 选项
    if (webp && supportsWebP && !src.endsWith('.webp')) {
      // 简单的 WebP URL 转换策略
      // 实际项目中应该由后端提供 WebP 版本
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp')

      // 如果原 URL 包含查询参数，添加 format=webp
      if (src.includes('?')) {
        return `${src}&format=webp`
      }

      return webpSrc
    }

    return src
  }

  // 设置 IntersectionObserver
  useEffect(() => {
    if (!imgRef.current) return

    // 如果设置了预加载，直接加载
    if (preload) {
      setIsInView(true)
      return
    }

    // 检查浏览器是否支持 IntersectionObserver
    if (!window.IntersectionObserver) {
      setIsInView(true)
      return
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          // 一旦进入视口就停止观察
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current)
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observerRef.current.observe(imgRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [preload, threshold, rootMargin])

  // 加载图片
  useEffect(() => {
    if (!isInView) return

    const finalSrc = getFinalSrc()

    // 如果图片已缓存，直接显示
    if (ImageCache.has(finalSrc)) {
      setImageSrc(finalSrc)
      setIsLoading(false)
      return
    }

    // 加载图片
    setIsLoading(true)
    setHasError(false)

    ImageCache.load(finalSrc)
      .then(() => {
        setImageSrc(finalSrc)
        setIsLoading(false)
        onLoad?.()
      })
      .catch(() => {
        // 如果是 WebP 加载失败，尝试原始格式
        if (finalSrc !== src) {
          return ImageCache.load(src)
            .then(() => {
              setImageSrc(src)
              setIsLoading(false)
              onLoad?.()
            })
        }
        throw new Error('Image load failed')
      })
      .catch(() => {
        setHasError(true)
        setIsLoading(false)
        setImageSrc(fallback)
        onError?.()
      })
  }, [isInView, src, fallback, onLoad, onError, webp])

  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width,
    height,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    ...style
  }

  const imgStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoading ? 0 : 1
  }

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={containerStyle}
    >
      {/* 加载状态 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {placeholder || (
            <Skeleton.Image
              style={{
                width: width || 100,
                height: height || 100
              }}
              active
            />
          )}
        </div>
      )}

      {/* 实际图片 */}
      {(isInView || isLoading) && (
        <img
          src={imageSrc}
          alt={alt}
          style={imgStyle}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* 错误状态 */}
      {hasError && !isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          color: '#999',
          fontSize: 14
        }}>
          {typeof placeholder === 'string' ? placeholder : '加载失败'}
        </div>
      )}
    </div>
  )
}

// 批量预加载图片
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(urls.map(url => ImageCache.load(url)))
}

// 图片懒加载 Hook
export const useLazyImage = (src: string, options?: {
  threshold?: number
  rootMargin?: string
  preload?: boolean
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (options?.preload || ImageCache.has(src)) {
      setIsLoaded(true)
      return
    }

    ImageCache.load(src)
      .then(() => setIsLoaded(true))
      .catch(() => setIsError(true))
  }, [src, options?.preload])

  return { isLoaded, isError }
}

export default LazyImage