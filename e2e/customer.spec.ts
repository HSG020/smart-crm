/**
 * E2E测试用例 - 客户管理模块
 * 测试客户的增删改查及相关业务流程
 */

import { test, expect } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

// 测试数据
const testCustomer = {
  name: '测试客户' + Date.now(),
  contactPerson: '张三',
  phone: '13812345678',
  email: 'customer@test.com',
  address: '上海市浦东新区',
  industry: '信息技术',
  scale: '100-500人',
  source: '网络营销'
};

test.describe('客户管理功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(TEST_URL);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // 进入客户管理页面
    await page.click('text=客户管理');
    await page.waitForURL(/\/customers/);
  });

  test('创建新客户', async ({ page }) => {
    // 点击新增按钮
    await page.click('button:has-text("新增客户")');

    // 填写客户信息
    await page.fill('input[name="name"]', testCustomer.name);
    await page.fill('input[name="contactPerson"]', testCustomer.contactPerson);
    await page.fill('input[name="phone"]', testCustomer.phone);
    await page.fill('input[name="email"]', testCustomer.email);
    await page.fill('textarea[name="address"]', testCustomer.address);

    // 选择行业和规模
    await page.click('input[name="industry"]');
    await page.click(`text=${testCustomer.industry}`);
    await page.click('input[name="scale"]');
    await page.click(`text=${testCustomer.scale}`);

    // 提交表单
    await page.click('button:has-text("确定")');

    // 验证创建成功
    await expect(page.locator('text=创建成功')).toBeVisible();
    await expect(page.locator(`text=${testCustomer.name}`)).toBeVisible();
  });

  test('搜索客户', async ({ page }) => {
    // 在搜索框输入
    await page.fill('input[placeholder*="搜索"]', testCustomer.name);
    await page.press('input[placeholder*="搜索"]', 'Enter');

    // 验证搜索结果
    await expect(page.locator(`text=${testCustomer.name}`)).toBeVisible();
  });

  test('编辑客户信息', async ({ page }) => {
    // 点击编辑按钮
    await page.click(`tr:has-text("${testCustomer.name}") button:has-text("编辑")`);

    // 修改联系人
    await page.fill('input[name="contactPerson"]', '李四');

    // 保存修改
    await page.click('button:has-text("保存")');

    // 验证修改成功
    await expect(page.locator('text=更新成功')).toBeVisible();
    await expect(page.locator('text=李四')).toBeVisible();
  });

  test('查看客户详情', async ({ page }) => {
    // 点击客户名称
    await page.click(`text=${testCustomer.name}`);

    // 验证详情页面
    await expect(page.locator('h2:has-text("客户详情")')).toBeVisible();
    await expect(page.locator(`text=${testCustomer.contactPerson}`)).toBeVisible();
    await expect(page.locator(`text=${testCustomer.phone}`)).toBeVisible();
    await expect(page.locator(`text=${testCustomer.email}`)).toBeVisible();
  });

  test('客户分级管理', async ({ page }) => {
    // 点击更多操作
    await page.click(`tr:has-text("${testCustomer.name}") button:has-text("更多")`);

    // 选择设置级别
    await page.click('text=设置级别');

    // 选择VIP客户
    await page.click('text=VIP客户');

    // 确认设置
    await page.click('button:has-text("确定")');

    // 验证级别标签
    await expect(page.locator(`tr:has-text("${testCustomer.name}") .vip-badge`)).toBeVisible();
  });

  test('批量操作客户', async ({ page }) => {
    // 选择多个客户
    await page.check('input[type="checkbox"]:first-of-type');
    await page.check('input[type="checkbox"]:nth-of-type(2)');

    // 点击批量操作
    await page.click('button:has-text("批量操作")');

    // 选择批量分配
    await page.click('text=批量分配');

    // 选择销售人员
    await page.click('input[name="assignTo"]');
    await page.click('text=销售主管');

    // 确认分配
    await page.click('button:has-text("确定分配")');

    // 验证分配成功
    await expect(page.locator('text=批量分配成功')).toBeVisible();
  });

  test('导出客户数据', async ({ page }) => {
    // 点击导出按钮
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("导出")')
    ]);

    // 验证下载文件
    expect(download.suggestedFilename()).toContain('customers');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('删除客户', async ({ page }) => {
    // 点击删除按钮
    await page.click(`tr:has-text("${testCustomer.name}") button:has-text("删除")`);

    // 确认删除
    await page.click('button:has-text("确认删除")');

    // 验证删除成功
    await expect(page.locator('text=删除成功')).toBeVisible();
    await expect(page.locator(`text=${testCustomer.name}`)).not.toBeVisible();
  });
});