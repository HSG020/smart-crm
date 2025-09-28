#!/usr/bin/env node
/**
 * 刷新 Schema 并测试 CRUD
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

// 创建新的 Supabase 客户端实例，强制刷新 schema
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
})

async function testIndustryField() {
  console.log(chalk.blue.bold('\n🔍 测试 industry 字段...\n'))

  try {
    // 先尝试查询表结构
    console.log(chalk.yellow('1. 查询表结构...'))
    const { data: columns, error: columnsError } = await supabase
      .from('customers')
      .select('*')
      .limit(0)

    if (columnsError) {
      console.error(chalk.red('查询失败:'), columnsError)
    } else {
      console.log(chalk.green('✅ 表结构查询成功'))
    }

    // 尝试直接插入
    console.log(chalk.yellow('\n2. 尝试插入数据...'))
    const testData = {
      name: `测试_${Date.now()}`,
      company: '测试公司',
      phone: '13800138000',
      email: 'test@test.com',
      importance: 'medium',
      status: 'potential',
      industry: '互联网'  // 关键字段
    }

    const { data: inserted, error: insertError } = await supabase
      .from('customers')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      console.error(chalk.red('❌ 插入失败:'), insertError.message)
      console.log(chalk.yellow('\n提示：'))
      console.log('1. 请确认已在 Supabase 中执行了 fix-schema.sql')
      console.log('2. 尝试在 Supabase Dashboard 中手动刷新表结构')
      console.log('3. 可能需要重新生成 API 类型')
    } else {
      console.log(chalk.green('✅ 插入成功！'))
      console.log(chalk.gray(`   ID: ${inserted.id}`))
      console.log(chalk.gray(`   Name: ${inserted.name}`))
      console.log(chalk.gray(`   Industry: ${inserted.industry}`))

      // 清理
      await supabase.from('customers').delete().eq('id', inserted.id)
      console.log(chalk.green('✅ 清理成功'))
    }

  } catch (error) {
    console.error(chalk.red('测试异常:'), error)
  }
}

// 执行测试
testIndustryField().catch(console.error)