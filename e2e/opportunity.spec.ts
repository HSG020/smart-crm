/**
 * E2E测试用例 - 销售机会管理
 * 测试销售机会的创建、跟进、阶段管理等流程
 */

import { test, expect } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

// 测试数据
const testOpportunity = {
  name: '测试项目' + Date.now(),
  customer: '测试客户A',
  amount: '500000',
  probability: '80',
  expectedDate: '2025-10-01',
  description: '这是一个测试销售机会'
};

test.describe('销售机会管理测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航到销售机会页面
    await page.goto(TEST_URL);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.click('text=销售机会');
    await page.waitForURL(/\/opportunities/);
  });

  test('创建销售机会', async ({ page }) => {
    // 点击新增按钮
    await page.click('button:has-text("新增机会")');

    // 填写基本信息
    await page.fill('input[name="name"]', testOpportunity.name);
    await page.fill('input[name="amount"]', testOpportunity.amount);
    await page.fill('input[name="probability"]', testOpportunity.probability);

    // 选择客户
    await page.click('input[name="customer"]');
    await page.click(`text=${testOpportunity.customer}`);

    // 选择预计成交日期
    await page.fill('input[name="expectedDate"]', testOpportunity.expectedDate);

    // 填写描述
    await page.fill('textarea[name="description"]', testOpportunity.description);

    // 提交表单
    await page.click('button:has-text("创建")');

    // 验证创建成功
    await expect(page.locator('text=创建成功')).toBeVisible();
    await expect(page.locator(`text=${testOpportunity.name}`)).toBeVisible();
  });

  test('销售漏斗展示', async ({ page }) => {
    // 切换到漏斗视图
    await page.click('button:has-text("漏斗视图")');

    // 验证各阶段显示
    await expect(page.locator('text=线索阶段')).toBeVisible();
    await expect(page.locator('text=商机阶段')).toBeVisible();
    await expect(page.locator('text=报价阶段')).toBeVisible();
    await expect(page.locator('text=谈判阶段')).toBeVisible();
    await expect(page.locator('text=成交阶段')).toBeVisible();

    // 验证机会卡片可拖拽
    const card = page.locator(`.opportunity-card:has-text("${testOpportunity.name}")`);
    await expect(card).toHaveAttribute('draggable', 'true');
  });

  test('更新销售阶段', async ({ page }) => {
    // 找到目标机会
    await page.click(`tr:has-text("${testOpportunity.name}") text=线索阶段`);

    // 选择新阶段
    await page.click('text=商机阶段');

    // 确认更新
    await page.click('button:has-text("更新阶段")');

    // 验证阶段更新
    await expect(page.locator(`tr:has-text("${testOpportunity.name}") text=商机阶段`)).toBeVisible();
    await expect(page.locator('text=阶段更新成功')).toBeVisible();
  });

  test('添加跟进记录', async ({ page }) => {
    // 点击机会名称进入详情
    await page.click(`text=${testOpportunity.name}`);

    // 切换到跟进记录标签
    await page.click('text=跟进记录');

    // 点击添加跟进
    await page.click('button:has-text("添加跟进")');

    // 填写跟进内容
    await page.fill('textarea[name="content"]', '今天与客户进行了电话沟通，客户对产品很感兴趣');

    // 选择跟进方式
    await page.click('input[name="type"]');
    await page.click('text=电话沟通');

    // 提交跟进
    await page.click('button:has-text("保存")');

    // 验证跟进记录
    await expect(page.locator('text=跟进添加成功')).toBeVisible();
    await expect(page.locator('text=电话沟通')).toBeVisible();
  });

  test('生成报价单', async ({ page }) => {
    // 进入机会详情
    await page.click(`text=${testOpportunity.name}`);

    // 点击生成报价
    await page.click('button:has-text("生成报价")');

    // 添加报价项
    await page.click('button:has-text("添加产品")');
    await page.fill('input[name="product"]', '产品A');
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="price"]', '5000');

    // 设置折扣
    await page.fill('input[name="discount"]', '10');

    // 生成报价单
    await page.click('button:has-text("生成报价单")');

    // 验证报价单生成
    await expect(page.locator('text=报价单生成成功')).toBeVisible();
  });

  test('概率分析', async ({ page }) => {
    // 切换到分析视图
    await page.click('button:has-text("概率分析")');

    // 验证概率分布图表
    await expect(page.locator('.probability-chart')).toBeVisible();

    // 验证预期收入计算
    const expectedRevenue = parseInt(testOpportunity.amount) * parseInt(testOpportunity.probability) / 100;
    await expect(page.locator(`text=预期收入：¥${expectedRevenue.toLocaleString()}`)).toBeVisible();
  });

  test('批量分配机会', async ({ page }) => {
    // 选择多个机会
    await page.check('tbody input[type="checkbox"]:first-of-type');
    await page.check('tbody input[type="checkbox"]:nth-of-type(2)');

    // 点击批量操作
    await page.click('button:has-text("批量操作")');
    await page.click('text=批量分配');

    // 选择销售人员
    await page.click('input[name="assignee"]');
    await page.click('text=销售经理');

    // 确认分配
    await page.click('button:has-text("确认分配")');

    // 验证分配成功
    await expect(page.locator('text=批量分配成功')).toBeVisible();
  });

  test('机会转化为合同', async ({ page }) => {
    // 进入成交阶段的机会
    await page.click(`tr:has-text("${testOpportunity.name}") button:has-text("操作")`);
    await page.click('text=转为合同');

    // 填写合同信息
    await page.fill('input[name="contractNo"]', 'CT-2025-001');
    await page.fill('input[name="signDate"]', '2025-09-28');

    // 确认转化
    await page.click('button:has-text("确认转化")');

    // 验证转化成功
    await expect(page.locator('text=成功转化为合同')).toBeVisible();
    await expect(page.locator('text=CT-2025-001')).toBeVisible();
  });

  test('机会统计分析', async ({ page }) => {
    // 点击统计分析
    await page.click('button:has-text("统计分析")');

    // 验证统计指标
    await expect(page.locator('text=本月新增')).toBeVisible();
    await expect(page.locator('text=成交率')).toBeVisible();
    await expect(page.locator('text=平均成交周期')).toBeVisible();
    await expect(page.locator('text=预期收入')).toBeVisible();

    // 验证图表展示
    await expect(page.locator('.sales-funnel-chart')).toBeVisible();
    await expect(page.locator('.trend-chart')).toBeVisible();
  });
});