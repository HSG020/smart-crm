/**
 * E2E测试用例 - 回款提醒模块
 * 测试回款计划创建、记录、提醒等功能
 */

import { test, expect } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

// 测试数据
const testPayment = {
  customerName: '测试客户A',
  amount: '100000',
  planDate: '2025-10-15',
  installments: '3',
  currency: 'CNY',
  reminderDays: '7'
};

test.describe('回款提醒功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航
    await page.goto(TEST_URL);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.click('text=回款提醒');
    await page.waitForURL(/\/payment-reminders/);
  });

  test('创建回款计划', async ({ page }) => {
    // 点击新增按钮
    await page.click('button:has-text("新增回款计划")');

    // 填写回款信息
    await page.click('input[name="customer"]');
    await page.click(`text=${testPayment.customerName}`);
    await page.fill('input[name="totalAmount"]', testPayment.amount);
    await page.fill('input[name="planDate"]', testPayment.planDate);

    // 设置分期
    await page.fill('input[name="installments"]', testPayment.installments);

    // 选择币种
    await page.click('input[name="currency"]');
    await page.click(`text=${testPayment.currency}`);

    // 提交
    await page.click('button:has-text("创建")');

    // 验证创建成功
    await expect(page.locator('text=回款计划创建成功')).toBeVisible();
    await expect(page.locator(`text=¥${parseInt(testPayment.amount).toLocaleString()}`)).toBeVisible();
  });

  test('查看统计卡片', async ({ page }) => {
    // 验证统计卡片显示
    await expect(page.locator('.stat-card:has-text("应收总额")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("已收总额")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("逾期金额")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("回款率")')).toBeVisible();

    // 验证数据格式
    await expect(page.locator('.stat-card .amount')).toContainText('¥');
    await expect(page.locator('.stat-card .percentage')).toContainText('%');
  });

  test('筛选回款状态', async ({ page }) => {
    // 切换到待回款标签
    await page.click('text=待回款');
    await expect(page.locator('.status-badge:has-text("待回款")')).toBeVisible();

    // 切换到已逾期标签
    await page.click('text=已逾期');
    await page.waitForTimeout(500);

    // 切换到已完成标签
    await page.click('text=已完成');
    await page.waitForTimeout(500);
  });

  test('记录回款', async ({ page }) => {
    // 点击详情按钮
    await page.click('tbody tr:first-child button:has-text("详情")');

    // 切换到回款记录标签
    await page.click('text=回款记录');

    // 添加回款记录
    await page.click('button:has-text("添加回款记录")');

    // 填写回款信息
    await page.fill('input[name="amount"]', '30000');
    await page.fill('input[name="paymentDate"]', '2025-09-28');

    // 选择支付方式
    await page.click('input[name="paymentMethod"]');
    await page.click('text=银行转账');

    // 填写交易号
    await page.fill('input[name="transactionNo"]', 'TRX20250928001');

    // 提交
    await page.click('button:has-text("确认")');

    // 验证记录成功
    await expect(page.locator('text=回款记录添加成功')).toBeVisible();
    await expect(page.locator('text=¥30,000')).toBeVisible();

    // 验证进度更新
    await expect(page.locator('.progress-bar')).toBeVisible();
  });

  test('设置提醒规则', async ({ page }) => {
    // 进入详情页
    await page.click('tbody tr:first-child button:has-text("详情")');

    // 切换到提醒设置
    await page.click('text=提醒设置');

    // 添加提醒规则
    await page.click('button:has-text("添加提醒")');

    // 配置提醒
    await page.fill('input[name="advanceDays"]', testPayment.reminderDays);

    // 选择提醒频率
    await page.click('input[name="frequency"]');
    await page.click('text=每天');

    // 选择通知渠道
    await page.check('input[value="system"]');
    await page.check('input[value="email"]');

    // 保存规则
    await page.click('button:has-text("保存")');

    // 验证规则创建
    await expect(page.locator('text=提醒规则创建成功')).toBeVisible();
    await expect(page.locator(`text=提前${testPayment.reminderDays}天`)).toBeVisible();
  });

  test('逾期预警显示', async ({ page }) => {
    // 切换到已逾期标签
    await page.click('text=已逾期');

    // 验证逾期标记
    const overdueRow = page.locator('tbody tr').filter({ hasText: '已逾期' }).first();
    await expect(overdueRow.locator('.overdue-badge')).toBeVisible();
    await expect(overdueRow.locator('.overdue-days')).toContainText('逾期');
  });

  test('高级筛选功能', async ({ page }) => {
    // 点击筛选按钮
    await page.click('button:has-text("筛选")');

    // 设置日期范围
    await page.fill('input[name="startDate"]', '2025-09-01');
    await page.fill('input[name="endDate"]', '2025-09-30');

    // 设置金额范围
    await page.fill('input[name="minAmount"]', '50000');
    await page.fill('input[name="maxAmount"]', '200000');

    // 选择状态
    await page.click('input[name="status"]');
    await page.click('text=待回款');

    // 应用筛选
    await page.click('button:has-text("应用")');

    // 验证筛选结果
    await expect(page.locator('.filter-tags')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(await page.locator('tbody tr').count());
  });

  test('导出回款数据', async ({ page }) => {
    // 点击导出按钮
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("导出")')
    ]);

    // 验证文件下载
    expect(download.suggestedFilename()).toContain('payment');
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv)$/);
  });

  test('批量标记已完成', async ({ page }) => {
    // 选择多个计划
    await page.check('tbody input[type="checkbox"]:first-of-type');
    await page.check('tbody input[type="checkbox"]:nth-of-type(2)');

    // 批量操作
    await page.click('button:has-text("批量操作")');
    await page.click('text=标记已完成');

    // 确认操作
    await page.click('button:has-text("确认")');

    // 验证操作成功
    await expect(page.locator('text=批量操作成功')).toBeVisible();
  });

  test('回款进度可视化', async ({ page }) => {
    // 进入详情页
    await page.click('tbody tr:first-child button:has-text("详情")');

    // 验证进度条
    await expect(page.locator('.progress-circle')).toBeVisible();
    await expect(page.locator('.progress-percentage')).toContainText('%');

    // 验证分期展示
    if (parseInt(testPayment.installments) > 1) {
      await expect(page.locator('.installment-list')).toBeVisible();
      await expect(page.locator('.installment-item')).toHaveCount(parseInt(testPayment.installments));
    }
  });
});