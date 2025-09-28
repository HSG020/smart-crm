/**
 * Security utilities for production environment
 * Implements various security measures and protections
 */

import { supabase } from '../lib/supabase'

/**
 * Content Security Policy configuration
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.supabase.co'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

/**
 * Generate CSP header string
 */
export function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

/**
 * XSS Protection - Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Input validation utilities
 */
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^[\d\s()+-]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  },

  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  },

  alphanumeric: (str: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(str)
  },

  noSpecialChars: (str: string): boolean => {
    return /^[a-zA-Z0-9\s]+$/.test(str)
  }
}

/**
 * Rate limiting implementation
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts = 10, windowMs = 60000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  check(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []

    // Clean old attempts
    const validAttempts = attempts.filter(time => now - time < this.windowMs)

    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(identifier, validAttempts)

    return true
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute
export const authRateLimiter = new RateLimiter(5, 300000) // 5 attempts per 5 minutes

/**
 * Session security
 */
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static lastActivity = Date.now()

  static updateActivity(): void {
    this.lastActivity = Date.now()
  }

  static checkTimeout(): boolean {
    return Date.now() - this.lastActivity > this.SESSION_TIMEOUT
  }

  static async validateSession(): Promise<boolean> {
    if (this.checkTimeout()) {
      await this.logout()
      return false
    }

    this.updateActivity()
    return true
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
}

/**
 * Data encryption utilities
 */
export const encryption = {
  /**
   * Encrypt sensitive data before storage
   */
  async encrypt(data: string, key?: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    // In production, use a proper key management service
    const cryptoKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
  },

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData: string, key?: string): Promise<string> {
    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
      const iv = combined.slice(0, 12)
      const data = combined.slice(12)

      // In production, retrieve the key from secure storage
      const cryptoKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }
}

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://smartcrm.example.com']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}

/**
 * Security headers middleware
 */
export function applySecurityHeaders(): void {
  // These would typically be set server-side
  // This is for demonstration purposes
  if (typeof window !== 'undefined') {
    // Disable right-click in production
    if (process.env.NODE_ENV === 'production') {
      document.addEventListener('contextmenu', (e) => {
        if (!e.target || !(e.target as HTMLElement).closest('.allow-context-menu')) {
          e.preventDefault()
        }
      })
    }

    // Prevent clickjacking
    if (window.top !== window.self) {
      window.top?.location.replace(window.self.location.href)
    }

    // Clear sensitive data on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Clear sensitive data from memory
        sessionStorage.setItem('lastActivity', Date.now().toString())
      }
    })
  }
}

/**
 * SQL injection prevention
 */
export function escapeSQLString(str: string): string {
  return str.replace(/['";\\]/g, '\\$&')
}

/**
 * File upload security
 */
export const fileUploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],

  validate(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxSize) {
      return { valid: false, error: `文件大小不能超过 ${this.maxSize / 1024 / 1024}MB` }
    }

    if (!this.allowedTypes.includes(file.type)) {
      return { valid: false, error: '不支持的文件类型' }
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const expectedExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf'],
      'text/csv': ['csv'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
    }

    const validExtensions = expectedExtensions[file.type]
    if (!extension || !validExtensions?.includes(extension)) {
      return { valid: false, error: '文件扩展名与类型不匹配' }
    }

    return { valid: true }
  }
}

/**
 * Audit logging
 */
export class AuditLogger {
  static async log(action: string, details: Record<string, any>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous',
        action,
        details,
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      }

      // In production, send to logging service
      console.log('[AUDIT]', auditEntry)

      // Store in database
      await supabase.from('audit_logs').insert(auditEntry)
    } catch (error) {
      console.error('Audit logging failed:', error)
    }
  }

  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }
}

/**
 * Initialize security measures
 */
export function initializeSecurity(): void {
  // Apply security headers
  applySecurityHeaders()

  // Set up activity monitoring
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => SessionManager.updateActivity(), { passive: true })
  })

  // Check session periodically
  setInterval(() => {
    SessionManager.validateSession()
  }, 60000) // Check every minute

  // Prevent console access in production
  if (process.env.NODE_ENV === 'production') {
    // Disable console methods
    const noop = () => {}
    ;['log', 'debug', 'info', 'warn', 'error'].forEach(method => {
      (console as any)[method] = noop
    })

    // Prevent devtools detection (basic)
    let devtools = { open: false, orientation: null }
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200) {
        devtools.open = true
      }
    }, 500)
  }
}

export default {
  generateCSP,
  sanitizeHTML,
  validators,
  apiRateLimiter,
  authRateLimiter,
  SessionManager,
  encryption,
  corsConfig,
  escapeSQLString,
  fileUploadConfig,
  AuditLogger,
  initializeSecurity
}