/**
 * E2E测试用例 - 认证模块
 * 测试用户登录、注册、退出等核心认证流程
 */

import { test, expect, Page } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

// 测试用户数据
const testUser = {
  email: 'test@example.com',
  password: 'Test123456!',
  name: '测试用户'
};

test.describe('认证功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
  });

  test('用户注册流程', async ({ page }) => {
    // 导航到注册页面
    await page.click('text=注册');

    // 填写注册表单
    await page.fill('input[name="email"]', `${Date.now()}@test.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.fill('input[name="name"]', testUser.name);

    // 提交注册
    await page.click('button[type="submit"]');

    // 验证注册成功
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=欢迎使用')).toBeVisible();
  });

  test('用户登录流程', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // 提交登录
    await page.click('button[type="submit"]');

    // 验证登录成功
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('.user-avatar')).toBeVisible();
  });

  test('记住登录状态', async ({ page }) => {
    // 勾选记住我
    await page.check('input[name="remember"]');

    // 登录
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 刷新页面
    await page.reload();

    // 验证仍保持登录状态
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('用户退出登录', async ({ page }) => {
    // 先登录
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // 点击用户菜单
    await page.click('.user-avatar');

    // 点击退出
    await page.click('text=退出登录');

    // 验证返回登录页
    await expect(page).toHaveURL(/\/login/);
  });

  test('无效凭据登录失败', async ({ page }) => {
    // 使用错误密码
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // 验证错误提示
    await expect(page.locator('text=用户名或密码错误')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('密码强度验证', async ({ page }) => {
    await page.click('text=注册');

    // 弱密码
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');

    // 验证密码强度提示
    await expect(page.locator('text=密码强度不够')).toBeVisible();
  });
});