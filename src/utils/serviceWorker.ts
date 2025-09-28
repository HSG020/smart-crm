/**
 * Service Worker 注册和管理
 */

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * 注册 Service Worker
   */
  async register(config?: ServiceWorkerConfig): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // 只在生产环境启用
    if (import.meta.env.DEV) {
      console.log('Service Worker disabled in development');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/'
        }
      );

      this.registration = registration;
      console.log('Service Worker registered successfully');

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新版本可用
              console.log('New version available');
              if (config?.onUpdate) {
                config.onUpdate(registration);
              }
            }
          });
        }
      });

      // 首次注册成功
      if (config?.onSuccess) {
        config.onSuccess(registration);
      }

      // 定期检查更新（每小时）
      this.startUpdateCheck();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      if (config?.onError) {
        config.onError(error as Error);
      }
    }
  }

  /**
   * 注销 Service Worker
   */
  async unregister(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const success = await this.registration.unregister();
      if (success) {
        console.log('Service Worker unregistered successfully');
        this.registration = null;
        this.stopUpdateCheck();
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }

  /**
   * 手动更新 Service Worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      console.log('No Service Worker registered');
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker update requested');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  /**
   * 跳过等待并激活新的 Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    // 发送消息给等待中的 Service Worker
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // 重新加载页面以使用新版本
    window.location.reload();
  }

  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * 获取缓存大小
   */
  async getCacheSize(): Promise<number> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * 开始定期检查更新
   */
  private startUpdateCheck(): void {
    this.stopUpdateCheck();

    // 每小时检查一次更新
    this.updateInterval = setInterval(() => {
      this.update();
    }, 60 * 60 * 1000);
  }

  /**
   * 停止更新检查
   */
  private stopUpdateCheck(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * 预缓存关键资源
   */
  async precacheAssets(urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('precache-v1');
      await cache.addAll(urls);
      console.log('Assets precached successfully');
    } catch (error) {
      console.error('Failed to precache assets:', error);
    }
  }

  /**
   * 检查是否在线
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * 监听网络状态变化
   */
  onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 返回清理函数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// 导出单例
export const serviceWorkerManager = new ServiceWorkerManager();

// React Hook: 使用 Service Worker
import { useEffect, useState } from 'react';
import { message } from 'antd';

export const useServiceWorker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    // 注册 Service Worker
    serviceWorkerManager.register({
      onUpdate: () => {
        setUpdateAvailable(true);
        message.info('新版本可用，点击刷新更新', 0);
      },
      onSuccess: () => {
        console.log('Service Worker ready');
      },
      onError: (error) => {
        console.error('Service Worker error:', error);
      }
    });

    // 监听网络状态
    const unsubscribe = serviceWorkerManager.onNetworkChange((online) => {
      setIsOffline(!online);
      if (online) {
        message.success('网络已恢复');
      } else {
        message.warning('当前处于离线状态');
      }
    });

    // 获取缓存大小
    serviceWorkerManager.getCacheSize().then(setCacheSize);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    updateAvailable,
    isOffline,
    cacheSize,
    skipWaiting: () => serviceWorkerManager.skipWaiting(),
    clearCache: () => serviceWorkerManager.clearCache(),
    update: () => serviceWorkerManager.update()
  };
};

export default serviceWorkerManager;