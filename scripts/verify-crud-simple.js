#!/usr/bin/env node
/**
 * 简化的 CRUD 验证脚本（不包含 industry 字段）
 */

import { createClient } from '@supabase/supabase-js'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('❌ 缺少 Supabase 配置'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试结果统计
const testResults = []

// 记录测试结果
function recordResult(table, operation, success, message, duration) {
  testResults.push({ table, operation, success, message, duration })
  const icon = success ? '✅' : '❌'
  const color = success ? chalk.green : chalk.red
  console.log(`${icon} [${table}] ${operation}: ${color(message)} (${duration}ms)`)
}

// 测试客户表 CRUD（不包含 industry）
async function testCustomers() {
  const tableName = 'customers'
  console.log(chalk.blue(`\n📋 测试 ${tableName} 表（简化版）...\n`))

  // CREATE - 不包含 industry 字段
  const startCreate = Date.now()
  const testCustomer = {
    name: `测试客户_${Date.now()}`,
    company: '测试公司',
    phone: '13800138000',
    email: 'test@example.com',
    importance: 'medium',
    status: 'potential'
    // 不包含 industry 字段
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

// 生成测试报告
function generateReport() {
  console.log(chalk.blue('\n' + '='.repeat(60)))
  console.log(chalk.blue.bold('📊 测试报告（简化版）'))
  console.log(chalk.blue('='.repeat(60) + '\n'))

  const totalTests = testResults.length
  const successTests = testResults.filter(r => r.success).length
  const failedTests = testResults.filter(r => !r.success).length
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0)

  // 总体统计
  console.log(chalk.white('📈 总体统计:'))
  console.log(`  • 总测试数: ${totalTests}`)
  console.log(`  • ${chalk.green(`成功: ${successTests}`)}`)
  console.log(`  • ${chalk.red(`失败: ${failedTests}`)}`)
  console.log(`  • 成功率: ${totalTests > 0 ? ((successTests / totalTests) * 100).toFixed(1) : 0}%`)
  console.log(`  • 总耗时: ${totalDuration}ms\n`)

  // 失败详情
  const failures = testResults.filter(r => !r.success)
  if (failures.length > 0) {
    console.log(chalk.red('\n❌ 失败详情:'))
    failures.forEach(f => {
      console.log(`  • [${f.table}] ${f.operation}: ${f.message}`)
    })
  }

  // 最终结论
  console.log(chalk.blue('\n' + '='.repeat(60)))
  if (failedTests === 0) {
    console.log(chalk.green.bold('✅ 基础 CRUD 测试通过！'))
    console.log(chalk.yellow('⚠️  注意：industry 字段测试已跳过，需要刷新 Supabase schema cache'))
  } else {
    console.log(chalk.red.bold(`❌ ${failedTests} 个测试失败`))
  }
  console.log(chalk.blue('='.repeat(60) + '\n'))
}

// 主测试流程
async function runTests() {
  console.log(chalk.blue.bold('\n🚀 开始简化的 Supabase CRUD 验证测试...\n'))
  console.log(chalk.yellow('⚠️  跳过 industry 字段以避免 schema cache 问题\n'))
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`)

  try {
    await testCustomers()
    generateReport()
  } catch (error) {
    console.error(chalk.red('❌ 测试过程中发生错误:'), error)
    process.exit(1)
  }
}

// 执行测试
runTests().catch(console.error)