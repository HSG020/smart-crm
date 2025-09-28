import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E测试配置
 */
export default defineConfig({
  // 测试文件目录
  testDir: './e2e',

  // 超时设置
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // 失败后重试
  retries: process.env.CI ? 2 : 0,

  // 并行执行
  workers: process.env.CI ? 1 : 4,

  // 报告配置
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list']
  ],

  // 全局配置
  use: {
    // 基础URL
    baseURL: process.env.TEST_URL || 'http://localhost:3000',

    // 截图配置
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 追踪配置
    trace: 'on-first-retry',

    // 浏览器配置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});