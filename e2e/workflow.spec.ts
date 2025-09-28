/**
 * E2E测试用例 - 工作流自动化
 * 测试工作流的创建、配置、执行等功能
 */

import { test, expect } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

// 测试数据
const testWorkflow = {
  name: '新客户欢迎流程' + Date.now(),
  trigger: '客户创建',
  description: '当新客户创建时自动发送欢迎邮件'
};

test.describe('工作流自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航
    await page.goto(TEST_URL);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.click('text=设置');
    await page.click('text=工作流自动化');
    await page.waitForURL(/\/settings\/workflow/);
  });

  test('创建工作流', async ({ page }) => {
    // 点击创建按钮
    await page.click('button:has-text("创建工作流")');

    // 填写基本信息
    await page.fill('input[name="name"]', testWorkflow.name);
    await page.fill('textarea[name="description"]', testWorkflow.description);

    // 选择触发器
    await page.click('text=选择触发器');
    await page.click(`text=${testWorkflow.trigger}`);

    // 下一步
    await page.click('button:has-text("下一步")');

    // 验证进入条件配置
    await expect(page.locator('h3:has-text("配置条件")')).toBeVisible();
  });

  test('配置工作流条件', async ({ page }) => {
    // 进入工作流编辑
    await page.click(`text=${testWorkflow.name}`);

    // 添加条件
    await page.click('button:has-text("添加条件")');

    // 选择字段
    await page.click('select[name="field"]');
    await page.click('option:has-text("客户类型")');

    // 选择操作符
    await page.click('select[name="operator"]');
    await page.click('option:has-text("等于")');

    // 输入值
    await page.fill('input[name="value"]', 'VIP');

    // 保存条件
    await page.click('button:has-text("保存条件")');

    // 验证条件显示
    await expect(page.locator('text=客户类型 等于 VIP')).toBeVisible();
  });

  test('添加工作流动作', async ({ page }) => {
    // 进入工作流编辑
    await page.click(`text=${testWorkflow.name}`);

    // 切换到动作标签
    await page.click('text=配置动作');

    // 添加动作
    await page.click('button:has-text("添加动作")');

    // 选择动作类型
    await page.click('text=发送邮件');

    // 配置邮件内容
    await page.fill('input[name="subject"]', '欢迎加入我们');
    await page.fill('textarea[name="body"]', '尊敬的客户，欢迎使用我们的服务！');

    // 保存动作
    await page.click('button:has-text("保存动作")');

    // 验证动作添加
    await expect(page.locator('.action-card:has-text("发送邮件")')).toBeVisible();
  });

  test('工作流执行历史', async ({ page }) => {
    // 进入工作流详情
    await page.click(`text=${testWorkflow.name}`);

    // 切换到执行历史
    await page.click('text=执行历史');

    // 验证历史列表
    await expect(page.locator('table.history-table')).toBeVisible();

    // 验证列标题
    await expect(page.locator('th:has-text("执行时间")')).toBeVisible();
    await expect(page.locator('th:has-text("触发对象")')).toBeVisible();
    await expect(page.locator('th:has-text("状态")')).toBeVisible();
    await expect(page.locator('th:has-text("结果")')).toBeVisible();
  });

  test('启用/禁用工作流', async ({ page }) => {
    // 找到工作流行
    const workflowRow = page.locator(`tr:has-text("${testWorkflow.name}")`);

    // 切换状态开关
    await workflowRow.locator('.switch-button').click();

    // 验证状态变更
    await expect(page.locator('text=工作流已启用')).toBeVisible();

    // 再次切换
    await workflowRow.locator('.switch-button').click();

    // 验证禁用
    await expect(page.locator('text=工作流已禁用')).toBeVisible();
  });

  test('复制工作流', async ({ page }) => {
    // 找到工作流
    await page.click(`tr:has-text("${testWorkflow.name}") button:has-text("更多")`);

    // 选择复制
    await page.click('text=复制');

    // 修改名称
    const newName = testWorkflow.name + ' - 副本';
    await page.fill('input[name="name"]', newName);

    // 确认复制
    await page.click('button:has-text("确认复制")');

    // 验证复制成功
    await expect(page.locator('text=复制成功')).toBeVisible();
    await expect(page.locator(`text=${newName}`)).toBeVisible();
  });

  test('工作流模板库', async ({ page }) => {
    // 点击模板库
    await page.click('button:has-text("模板库")');

    // 验证模板列表
    await expect(page.locator('.template-card')).toHaveCount(await page.locator('.template-card').count());

    // 选择一个模板
    await page.click('.template-card:first-child button:has-text("使用模板")');

    // 自定义模板名称
    await page.fill('input[name="name"]', '从模板创建的工作流');

    // 创建
    await page.click('button:has-text("创建")');

    // 验证创建成功
    await expect(page.locator('text=工作流创建成功')).toBeVisible();
  });

  test('工作流调试模式', async ({ page }) => {
    // 进入工作流编辑
    await page.click(`text=${testWorkflow.name}`);

    // 开启调试模式
    await page.click('button:has-text("调试模式")');

    // 输入测试数据
    await page.fill('textarea[name="testData"]', JSON.stringify({
      customer: { name: '测试客户', type: 'VIP' }
    }));

    // 运行测试
    await page.click('button:has-text("运行测试")');

    // 验证测试结果
    await expect(page.locator('.debug-output')).toBeVisible();
    await expect(page.locator('text=测试完成')).toBeVisible();
  });

  test('删除工作流', async ({ page }) => {
    // 找到工作流
    await page.click(`tr:has-text("${testWorkflow.name}") button:has-text("删除")`);

    // 确认删除
    await page.click('button:has-text("确认删除")');

    // 验证删除成功
    await expect(page.locator('text=删除成功')).toBeVisible();
    await expect(page.locator(`text=${testWorkflow.name}`)).not.toBeVisible();
  });

  test('工作流性能监控', async ({ page }) => {
    // 点击性能监控
    await page.click('button:has-text("性能监控")');

    // 验证监控面板
    await expect(page.locator('.performance-dashboard')).toBeVisible();

    // 验证指标
    await expect(page.locator('text=平均执行时间')).toBeVisible();
    await expect(page.locator('text=成功率')).toBeVisible();
    await expect(page.locator('text=总执行次数')).toBeVisible();

    // 验证图表
    await expect(page.locator('.execution-chart')).toBeVisible();
  });
});