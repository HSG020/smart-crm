import React, { useState, useEffect } from 'react'
import { Card, Button, Space, Typography, Alert, Spin, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'

const { Title, Text, Paragraph } = Typography

export const DatabaseTest: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>({})

  const testDatabaseConnection = async () => {
    setTesting(true)
    const testResults: any = {}

    // 1. 测试环境变量
    testResults.env = {
      url: import.meta.env.VITE_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置',
      urlValue: import.meta.env.VITE_SUPABASE_URL || '未设置',
    }

    // 2. 测试认证状态
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      testResults.auth = {
        status: session ? '✅ 已登录' : '⚠️ 未登录',
        user: session?.user?.email || '无',
        userId: session?.user?.id || '无',
        error: error?.message
      }
    } catch (error: any) {
      testResults.auth = { status: '❌ 认证失败', error: error.message }
    }

    // 3. 测试客户表
    try {
      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      testResults.customers = {
        status: '✅ 表存在',
        count: count || 0
      }
    } catch (error: any) {
      testResults.customers = {
        status: '❌ 查询失败',
        error: error.message
      }
    }

    // 4. 测试提醒表
    try {
      const { data, error, count } = await supabase
        .from('follow_up_reminders')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      testResults.reminders = {
        status: '✅ 表存在',
        count: count || 0
      }
    } catch (error: any) {
      testResults.reminders = {
        status: '❌ 查询失败',
        error: error.message
      }
    }

    // 5. 测试沟通记录表
    try {
      const { data, error, count } = await supabase
        .from('communication_history')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      testResults.communications = {
        status: '✅ 表存在',
        count: count || 0
      }
    } catch (error: any) {
      testResults.communications = {
        status: '❌ 查询失败',
        error: error.message
      }
    }

    // 6. 测试团队成员表
    try {
      const { data, error, count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      testResults.team = {
        status: '✅ 表存在',
        count: count || 0
      }
    } catch (error: any) {
      testResults.team = {
        status: '❌ 查询失败',
        error: error.message
      }
    }

    // 7. 测试插入权限（如果已登录）
    const session = await supabase.auth.getSession()
    if (session.data.session) {
      try {
        const testCustomer = {
          name: 'TEST_' + Date.now(),
          importance: 'low',
          status: 'potential',
          tags: [],
          user_id: session.data.session.user.id
        }

        const { data, error } = await supabase
          .from('customers')
          .insert(testCustomer)
          .select()
          .single()

        if (error) throw error

        // 立即删除测试数据
        await supabase.from('customers').delete().eq('id', data.id)

        testResults.insert = { status: '✅ 可以插入和删除' }
      } catch (error: any) {
        testResults.insert = {
          status: '❌ 插入失败',
          error: error.message
        }
      }
    } else {
      testResults.insert = { status: '⚠️ 需要先登录' }
    }

    setResults(testResults)
    setTesting(false)

    // 分析结果
    const hasError = Object.values(testResults).some((r: any) =>
      r.status?.includes('❌')
    )
    if (hasError) {
      message.error('数据库连接存在问题，请查看详细信息')
    } else {
      message.success('数据库连接正常！')
    }
  }

  useEffect(() => {
    testDatabaseConnection()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>数据库连接诊断</Title>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={testDatabaseConnection}
              loading={testing}
            >
              重新测试
            </Button>
          </div>

          {testing ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" tip="正在测试数据库连接..." />
            </div>
          ) : (
            <>
              {/* 环境变量 */}
              {results.env && (
                <Card size="small" title="1. 环境变量配置">
                  <Paragraph>
                    <Text>SUPABASE_URL: {results.env.url}</Text><br />
                    <Text>SUPABASE_ANON_KEY: {results.env.key}</Text><br />
                    <Text type="secondary">URL: {results.env.urlValue}</Text>
                  </Paragraph>
                </Card>
              )}

              {/* 认证状态 */}
              {results.auth && (
                <Card size="small" title="2. 认证状态"
                  type={results.auth.status.includes('✅') ? 'default' : 'warning'}>
                  <Paragraph>
                    <Text>状态: {results.auth.status}</Text><br />
                    <Text>用户: {results.auth.user}</Text><br />
                    <Text type="secondary">用户ID: {results.auth.userId}</Text>
                    {results.auth.error && (
                      <Alert message={results.auth.error} type="error" style={{ marginTop: 8 }} />
                    )}
                  </Paragraph>
                </Card>
              )}

              {/* 数据表状态 */}
              <Card size="small" title="3. 数据表状态">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {['customers', 'reminders', 'communications', 'team'].map(table => {
                    const tableData = results[table]
                    if (!tableData) return null

                    const tableName = {
                      customers: '客户表',
                      reminders: '提醒表',
                      communications: '沟通记录表',
                      team: '团队成员表'
                    }[table]

                    return (
                      <div key={table}>
                        <Text strong>{tableName}: </Text>
                        <Text type={tableData.status.includes('✅') ? 'success' : 'danger'}>
                          {tableData.status}
                        </Text>
                        {tableData.count !== undefined && (
                          <Text type="secondary"> (记录数: {tableData.count})</Text>
                        )}
                        {tableData.error && (
                          <Alert
                            message={tableData.error}
                            type="error"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </div>
                    )
                  })}
                </Space>
              </Card>

              {/* 写入权限 */}
              {results.insert && (
                <Card size="small" title="4. 写入权限测试"
                  type={results.insert.status.includes('✅') ? 'success' : 'warning'}>
                  <Text>{results.insert.status}</Text>
                  {results.insert.error && (
                    <Alert message={results.insert.error} type="error" style={{ marginTop: 8 }} />
                  )}
                </Card>
              )}

              {/* 诊断建议 */}
              <Card size="small" title="诊断建议" type="info">
                <Space direction="vertical">
                  {!results.auth?.status?.includes('✅') && (
                    <Alert
                      message="请先登录系统"
                      description="需要先注册或登录账号才能访问数据"
                      type="warning"
                      showIcon
                    />
                  )}

                  {Object.entries(results).some(([key, value]: [string, any]) =>
                    key !== 'auth' && value.error?.includes('relation')
                  ) && (
                    <Alert
                      message="数据表未创建"
                      description="请在 Supabase SQL Editor 中执行 database-schema.sql 创建表结构"
                      type="error"
                      showIcon
                    />
                  )}

                  {Object.entries(results).some(([key, value]: [string, any]) =>
                    value.error?.includes('permission')
                  ) && (
                    <Alert
                      message="权限配置问题"
                      description="请检查 RLS (Row Level Security) 策略配置"
                      type="error"
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            </>
          )}
        </Space>
      </Card>
    </div>
  )
}