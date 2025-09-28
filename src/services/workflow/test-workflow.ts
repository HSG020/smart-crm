#!/usr/bin/env tsx
/**
 * 工作流引擎测试脚本
 * 用于验证工作流执行引擎是否正常工作
 */

import { WorkflowEngine } from './engine'
import { newCustomerWorkflow } from './templates'

// 模拟客户数据
const mockCustomer = {
  id: 'test-customer-001',
  name: '张三',
  company: '测试科技有限公司',
  email: 'zhangsan@test.com',
  phone: '13800138000',
  importance: 'high'
}

// 测试执行工作流
async function testWorkflow() {
  console.log('🚀 开始测试工作流引擎...\n')
  console.log('📋 测试工作流:', newCustomerWorkflow.name)
  console.log('📝 工作流描述:', newCustomerWorkflow.description)
  console.log('👤 测试客户:', mockCustomer.name, `(${mockCustomer.importance}重要性)`)
  console.log('\n' + '='.repeat(60) + '\n')

  try {
    // 创建引擎实例
    const engine = new WorkflowEngine(newCustomerWorkflow)

    // 执行工作流
    console.log('⚡ 开始执行工作流...')
    const result = await engine.execute({
      customer: mockCustomer,
      timestamp: new Date().toISOString()
    })

    // 输出结果
    console.log('\n' + '='.repeat(60))
    if (result.success) {
      console.log('✅ 工作流执行成功!')
      console.log(`⏱️  执行耗时: ${result.duration}ms`)
      console.log('📊 输出结果:', JSON.stringify(result.output, null, 2))
    } else {
      console.log('❌ 工作流执行失败')
      console.log('错误信息:', result.error)
    }
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error)
  }
}

// 执行测试
if (require.main === module) {
  testWorkflow().catch(console.error)
}

export { testWorkflow }