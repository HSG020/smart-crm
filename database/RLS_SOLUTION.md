# 解决 RLS (Row Level Security) 问题

## 当前问题
测试失败，提示 RLS 策略违规：
```
❌ new row violates row-level security policy for table "customers"
```

## 解决方案

### 方案 1：临时禁用 RLS（仅用于测试）

在 Supabase Dashboard 中：
1. 进入 Table Editor
2. 选择 `customers` 表
3. 点击 "RLS disabled/enabled" 按钮
4. 暂时禁用 RLS

### 方案 2：创建公开访问策略（开发环境）

在 SQL Editor 中执行：
```sql
-- 为匿名用户创建临时的完全访问策略（仅开发环境使用！）
CREATE POLICY "Allow anonymous access for development" ON customers
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 对其他表也创建类似策略
CREATE POLICY "Allow anonymous access for development" ON reminders
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
```

### 方案 3：使用服务角色密钥（推荐用于测试脚本）

1. 在 Supabase Dashboard → Settings → API 中找到 `service_role` 密钥
2. 创建 `.env.test` 文件：
```
VITE_SUPABASE_SERVICE_KEY=你的service_role密钥
```
3. 在测试脚本中使用服务密钥（绕过 RLS）

### 方案 4：创建测试用户（生产环境推荐）

```sql
-- 创建测试用户专用策略
CREATE POLICY "Test user full access" ON customers
FOR ALL
USING (auth.email() = 'test@example.com')
WITH CHECK (auth.email() = 'test@example.com');
```

## 快速修复步骤

最快的解决方案是**暂时禁用 RLS**：

1. 登录 Supabase Dashboard
2. 进入 Table Editor → customers 表
3. 关闭 RLS（点击锁图标）
4. 对 `reminders` 表也做同样操作
5. 运行测试：`npm run test:crud`
6. 测试完成后记得重新启用 RLS

## 注意事项

⚠️ **安全警告**：
- 禁用 RLS 会让表完全公开访问
- 仅在开发环境中临时禁用
- 生产环境必须启用 RLS 并配置正确的策略

## Schema Cache 问题

如果 industry 字段仍然报错：
1. 在 Supabase Dashboard 中手动刷新（F5）
2. 清除浏览器缓存
3. 等待几分钟让 API 更新
4. 或者重启你的应用：`npm run dev`