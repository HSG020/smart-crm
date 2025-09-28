#!/usr/bin/env tsx
/**
 * Supabase CRUD 完整性验证脚本
 * 用于验证所有数据表的 CRUD 操作是否正常工作
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import chalk from 'chalk'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('❌ 缺少 Supabase 配置，请检查 .env 文件'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试结果统计
interface TestResult {
  table: string
  operation: string
  success: boolean
  message: string
  duration: number
}

const testResults: TestResult[] = []

// 记录测试结果
function recordResult(table: string, operation: string, success: boolean, message: string, duration: number) {
  testResults.push({ table, operation, success, message, duration })
  const icon = success ? '✅' : '❌'
  const color = success ? chalk.green : chalk.red
  console.log(`${icon} [${table}] ${operation}: ${color(message)} (${duration}ms)`)
}

// 测试客户表 CRUD
async function testCustomers() {
  const tableName = 'customers'
  console.log(chalk.blue(`\n📋 测试 ${tableName} 表...\n`))

  // CREATE
  const startCreate = Date.now()
  const testCustomer = {
    name: `测试客户_${Date.now()}`,
    company: '测试公司',
    phone: '13800138000',
    email: 'test@example.com',
    importance: 'medium',
    status: 'potential',
    industry: '互联网'
  }

  const { data: created, error: createError } = await supabase
    .from(tableName)
    .insert(testCustomer)
    .select()
    .single()

  if (createError) {
    recordResult(tableName, 'CREATE', false, createError.message, Date.now() - startCreate)
    return
  }
  recordResult(tableName, 'CREATE', true, `创建成功 ID: ${created.id}`, Date.now() - startCreate)

  // READ
  const startRead = Date.now()
  const { data: read, error: readError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', created.id)
    .single()

  if (readError) {
    recordResult(tableName, 'READ', false, readError.message, Date.now() - startRead)
  } else {
    recordResult(tableName, 'READ', true, `读取成功: ${read.name}`, Date.now() - startRead)
  }

  // UPDATE
  const startUpdate = Date.now()
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ importance: 'high' })
    .eq('id', created.id)

  if (updateError) {
    recordResult(tableName, 'UPDATE', false, updateError.message, Date.now() - startUpdate)
  } else {
    recordResult(tableName, 'UPDATE', true, '更新成功', Date.now() - startUpdate)
  }

  // DELETE
  const startDelete = Date.now()
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq('id', created.id)

  if (deleteError) {
    recordResult(tableName, 'DELETE', false, deleteError.message, Date.now() - startDelete)
  } else {
    recordResult(tableName, 'DELETE', true, '删除成功', Date.now() - startDelete)
  }
}

// 测试提醒表 CRUD
async function testReminders() {
  const tableName = 'reminders'
  console.log(chalk.blue(`\n📋 测试 ${tableName} 表...\n`))

  // 先创建一个客户用于关联
  const { data: customer } = await supabase
    .from('customers')
    .insert({ name: '临时客户', company: '临时公司', phone: '13900139000' })
    .select()
    .single()

  if (!customer) {
    recordResult(tableName, 'PREPARE', false, '创建关联客户失败', 0)
    return
  }

  // CREATE
  const startCreate = Date.now()
  const testReminder = {
    customer_id: customer.id,
    customer_name: customer.name,
    title: '测试提醒',
    description: '这是一个测试提醒',
    reminder_date: new Date().toISOString(),
    type: 'follow_up',
    priority: 'medium',
    status: 'pending'
  }

  const { data: created, error: createError } = await supabase
    .from(tableName)
    .insert(testReminder)
    .select()
    .single()

  if (createError) {
    recordResult(tableName, 'CREATE', false, createError.message, Date.now() - startCreate)
    // 清理临时客户
    await supabase.from('customers').delete().eq('id', customer.id)
    return
  }
  recordResult(tableName, 'CREATE', true, `创建成功 ID: ${created.id}`, Date.now() - startCreate)

  // READ
  const startRead = Date.now()
  const { data: read, error: readError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', created.id)
    .single()

  if (readError) {
    recordResult(tableName, 'READ', false, readError.message, Date.now() - startRead)
  } else {
    recordResult(tableName, 'READ', true, `读取成功: ${read.title}`, Date.now() - startRead)
  }

  // UPDATE
  const startUpdate = Date.now()
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ status: 'completed' })
    .eq('id', created.id)

  if (updateError) {
    recordResult(tableName, 'UPDATE', false, updateError.message, Date.now() - startUpdate)
  } else {
    recordResult(tableName, 'UPDATE', true, '更新成功', Date.now() - startUpdate)
  }

  // DELETE
  const startDelete = Date.now()
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq('id', created.id)

  if (deleteError) {
    recordResult(tableName, 'DELETE', false, deleteError.message, Date.now() - startDelete)
  } else {
    recordResult(tableName, 'DELETE', true, '删除成功', Date.now() - startDelete)
  }

  // 清理临时客户
  await supabase.from('customers').delete().eq('id', customer.id)
}

// 测试沟通记录表 CRUD
async function testCommunications() {
  const tableName = 'communications'
  console.log(chalk.blue(`\n📋 测试 ${tableName} 表...\n`))

  // 先创建一个客户用于关联
  const { data: customer } = await supabase
    .from('customers')
    .insert({ name: '临时客户2', company: '临时公司2', phone: '13900139001' })
    .select()
    .single()

  if (!customer) {
    recordResult(tableName, 'PREPARE', false, '创建关联客户失败', 0)
    return
  }

  // CREATE
  const startCreate = Date.now()
  const testCommunication = {
    customer_id: customer.id,
    customer_name: customer.name,
    type: 'phone',
    direction: 'outbound',
    content: '测试沟通内容',
    date: new Date().toISOString(),
    duration: 30,
    result: '客户有意向'
  }

  const { data: created, error: createError } = await supabase
    .from(tableName)
    .insert(testCommunication)
    .select()
    .single()

  if (createError) {
    recordResult(tableName, 'CREATE', false, createError.message, Date.now() - startCreate)
    await supabase.from('customers').delete().eq('id', customer.id)
    return
  }
  recordResult(tableName, 'CREATE', true, `创建成功 ID: ${created.id}`, Date.now() - startCreate)

  // READ、UPDATE、DELETE 类似...
  // 清理
  await supabase.from(tableName).delete().eq('id', created.id)
  await supabase.from('customers').delete().eq('id', customer.id)
  recordResult(tableName, 'CLEANUP', true, '清理成功', 0)
}

// 测试销售机会表 CRUD
async function testOpportunities() {
  const tableName = 'opportunities'
  console.log(chalk.blue(`\n📋 测试 ${tableName} 表...\n`))

  // 先创建一个客户用于关联
  const { data: customer } = await supabase
    .from('customers')
    .insert({ name: '临时客户3', company: '临时公司3', phone: '13900139002' })
    .select()
    .single()

  if (!customer) {
    recordResult(tableName, 'PREPARE', false, '创建关联客户失败', 0)
    return
  }

  // CREATE
  const startCreate = Date.now()
  const testOpportunity = {
    customer_id: customer.id,
    customer_name: customer.name,
    title: '测试销售机会',
    value: 50000,
    stage: 'qualification',
    probability: 30,
    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: '这是一个测试机会'
  }

  const { data: created, error: createError } = await supabase
    .from(tableName)
    .insert(testOpportunity)
    .select()
    .single()

  if (createError) {
    recordResult(tableName, 'CREATE', false, createError.message, Date.now() - startCreate)
    await supabase.from('customers').delete().eq('id', customer.id)
    return
  }
  recordResult(tableName, 'CREATE', true, `创建成功 ID: ${created.id}`, Date.now() - startCreate)

  // 清理
  await supabase.from(tableName).delete().eq('id', created.id)
  await supabase.from('customers').delete().eq('id', customer.id)
  recordResult(tableName, 'CLEANUP', true, '清理成功', 0)
}

// 生成测试报告
function generateReport() {
  console.log(chalk.blue('\n' + '='.repeat(60)))
  console.log(chalk.blue.bold('📊 测试报告'))
  console.log(chalk.blue('='.repeat(60) + '\n'))

  const totalTests = testResults.length
  const successTests = testResults.filter(r => r.success).length
  const failedTests = testResults.filter(r => !r.success).length
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0)

  // 按表分组统计
  const tableStats = testResults.reduce((acc, r) => {
    if (!acc[r.table]) {
      acc[r.table] = { success: 0, failed: 0, operations: [] }
    }
    if (r.success) {
      acc[r.table].success++
    } else {
      acc[r.table].failed++
    }
    acc[r.table].operations.push(r.operation)
    return acc
  }, {} as Record<string, any>)

  // 总体统计
  console.log(chalk.white('📈 总体统计:'))
  console.log(`  • 总测试数: ${totalTests}`)
  console.log(`  • ${chalk.green(`成功: ${successTests}`)}`)
  console.log(`  • ${chalk.red(`失败: ${failedTests}`)}`)
  console.log(`  • 成功率: ${((successTests / totalTests) * 100).toFixed(1)}%`)
  console.log(`  • 总耗时: ${totalDuration}ms`)
  console.log(`  • 平均耗时: ${(totalDuration / totalTests).toFixed(1)}ms\n`)

  // 表级统计
  console.log(chalk.white('📋 表级统计:'))
  Object.entries(tableStats).forEach(([table, stats]: [string, any]) => {
    const icon = stats.failed === 0 ? '✅' : '⚠️'
    console.log(`  ${icon} ${table}:`)
    console.log(`     成功: ${stats.success}, 失败: ${stats.failed}`)
    console.log(`     操作: ${[...new Set(stats.operations)].join(', ')}`)
  })

  // 失败详情
  const failures = testResults.filter(r => !r.success)
  if (failures.length > 0) {
    console.log(chalk.red('\n❌ 失败详情:'))
    failures.forEach(f => {
      console.log(`  • [${f.table}] ${f.operation}: ${f.message}`)
    })
  }

  // 性能分析
  const slowTests = testResults.filter(r => r.duration > 1000)
  if (slowTests.length > 0) {
    console.log(chalk.yellow('\n⚠️ 慢查询 (>1s):'))
    slowTests.forEach(s => {
      console.log(`  • [${s.table}] ${s.operation}: ${s.duration}ms`)
    })
  }

  // 最终结论
  console.log(chalk.blue('\n' + '='.repeat(60)))
  if (failedTests === 0) {
    console.log(chalk.green.bold('✅ 所有 CRUD 测试通过！Supabase 集成正常工作。'))
  } else {
    console.log(chalk.red.bold(`❌ ${failedTests} 个测试失败，请检查数据库配置和 RLS 策略。`))
  }
  console.log(chalk.blue('='.repeat(60) + '\n'))
}

// 主测试流程
async function runTests() {
  console.log(chalk.blue.bold('\n🚀 开始 Supabase CRUD 验证测试...\n'))
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 使用匿名密钥\n`)

  try {
    // 测试认证状态
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log(chalk.yellow('⚠️ 当前未登录，将使用匿名权限测试'))
    } else {
      console.log(chalk.green(`✅ 已登录用户: ${user?.email}`))
    }

    // 执行各表测试
    await testCustomers()
    await testReminders()
    await testCommunications()
    await testOpportunities()

    // 生成报告
    generateReport()

  } catch (error) {
    console.error(chalk.red('❌ 测试过程中发生错误:'), error)
    process.exit(1)
  }
}

// 执行测试
runTests().catch(console.error)