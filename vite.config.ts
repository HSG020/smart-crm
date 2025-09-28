import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { inlineCriticalCSS } from './vite-plugin-critical-css'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    inlineCriticalCSS()
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // 降低块大小警告限制
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // 手动分块策略
        manualChunks(id) {
          // 将 node_modules 中的代码单独打包
          if (id.includes('node_modules')) {
            // 将 React 相关库打包到 vendor-react
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }

            // 将 Ant Design 打包到 vendor-antd
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd'
            }

            // 将图表库打包到 vendor-charts
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'vendor-charts'
            }

            // 将 Supabase 打包到 vendor-supabase
            if (id.includes('supabase')) {
              return 'vendor-supabase'
            }

            // 将工具库打包到 vendor-utils
            if (id.includes('dayjs') || id.includes('zustand') || id.includes('uuid')) {
              return 'vendor-utils'
            }

            // 其他第三方库打包到 vendor
            return 'vendor'
          }

          // 业务代码分块
          if (id.includes('src/services/workflow')) {
            return 'workflow'
          }

          if (id.includes('src/services/ai')) {
            return 'ai-services'
          }

          if (id.includes('src/components') && !id.includes('IntegrationHub') && !id.includes('WorkflowIntegration')) {
            return 'components'
          }

          if (id.includes('IntegrationHub') || id.includes('WorkflowIntegration')) {
            return 'integrations'
          }
        },

        // 优化生成的文件名
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.')
          const ext = info?.[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext!)) {
            return 'images/[name]-[hash][extname]'
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext!)) {
            return 'fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },

    // 启用 CSS 代码分割
    cssCodeSplit: true,

    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },

    // 生成 source map 用于调试（生产环境可关闭）
    sourcemap: false,

    // 启用构建报告
    reportCompressedSize: true
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      'dayjs',
      '@supabase/supabase-js'
    ],
    exclude: []
  },

  // 服务器配置
  server: {
    port: 3000,
    host: true,
    open: false
  }
})