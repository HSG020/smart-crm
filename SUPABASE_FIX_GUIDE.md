# 🔧 Supabase 数据持久化修复指南

## 问题诊断

您的产品测试报告显示数据持久化完全失败（1/10分）。我已经完成了以下修复：

## ✅ 已完成的修复

1. **修复了 reminderStore 的查询语法错误**
   - 修正了外键关联语法从 `customers!customer_id` 到 `customers`

2. **将所有主要 Store 迁移到 Supabase**
   - ✅ customerStore - 已迁移到 Supabase
   - ✅ reminderStore - 已迁移到 Supabase
   - ✅ communicationStore - 已迁移到 Supabase
   - ✅ opportunityStore - 已迁移到 Supabase（刚刚完成）
   - ✅ teamStore - 已迁移到 Supabase（刚刚完成）
   - ⚠️ scriptStore - 暂时保留在 IndexedDB（数据库中无对应表）

## 🚨 需要您执行的步骤

### 步骤 1：启用 Row Level Security (RLS)

**这是最关键的步骤！** RLS 可能是导致数据无法保存的主要原因。

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 运行以下文件中的 SQL：
   ```sql
   -- 复制 database/enable-rls.sql 文件的全部内容并执行
   ```

### 步骤 2：检查认证状态

1. 打开应用，进入"数据库诊断"页面（/test）
2. 确认以下状态：
   - ✅ 认证状态：已登录
   - ✅ 用户 ID 存在
   - ✅ 所有表的查询状态为"✅ 表存在"

### 步骤 3：测试数据持久化

1. **测试客户管理**：
   - 添加新客户
   - 刷新页面
   - 确认客户数据仍然存在

2. **测试提醒功能**：
   - 添加新提醒
   - 刷新页面
   - 确认提醒数据仍然存在

3. **测试团队管理**：
   - 添加团队成员
   - 刷新页面
   - 确认成员数据仍然存在

## 🔍 如果问题仍然存在

### 检查浏览器控制台

打开开发者工具（F12），查看 Console 是否有以下错误：

1. **"permission denied for table"**
   - 解决方案：运行 enable-rls.sql

2. **"JWT expired"**
   - 解决方案：重新登录

3. **"relation does not exist"**
   - 解决方案：运行 database/init.sql 创建表

### 检查 Supabase Dashboard

1. 进入 Authentication > Policies
2. 确认每个表都有对应的 RLS 策略
3. 确认策略允许用户访问自己的数据

### 验证环境变量

确保 `.env` 文件包含：
```
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

## 📊 预期结果

修复后，您应该看到：

- ✅ 所有 CRUD 操作正常工作
- ✅ 数据刷新后仍然存在
- ✅ 不同用户只能看到自己的数据
- ✅ 团队成员数据所有用户可见

## 💡 下一步优化建议

1. **创建 scripts 表**
   - 目前话术库还在使用 IndexedDB
   - 需要创建对应的数据库表

2. **添加实时同步**
   - 利用 Supabase Realtime 功能
   - 实现多端数据同步

3. **添加离线支持**
   - 实现离线缓存
   - 在线后自动同步

## 🆘 需要帮助？

如果执行以上步骤后问题仍未解决，请提供：

1. 浏览器控制台的错误截图
2. 数据库诊断页面（/test）的截图
3. Supabase Dashboard 中 Table Editor 的截图

我会立即帮您定位并解决问题！