# 应用数据库修复步骤

## 当前问题
CRUD 测试失败，提示缺少 `industry` 字段：
```
❌ [customers] CREATE: Could not find the 'industry' column of 'customers' in the schema cache
```

## 修复步骤

### 1. 登录 Supabase Dashboard
访问你的 Supabase 项目控制台

### 2. 进入 SQL 编辑器
点击左侧菜单的 "SQL Editor"

### 3. 执行修复脚本
复制并执行 `database/fix-schema.sql` 文件中的以下关键语句：

```sql
-- 添加缺失的 industry 字段
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
```

或者直接执行整个 fix-schema.sql 文件内容，它会：
- 添加所有缺失的字段
- 创建必要的索引
- 配置 RLS 策略

### 4. 验证修复
执行后运行：
```bash
npm run test:crud
```

## 预期结果
修复后，CRUD 测试应该显示：
```
✅ [customers] CREATE: 创建成功
✅ [customers] READ: 读取成功
✅ [customers] UPDATE: 更新成功
✅ [customers] DELETE: 删除成功
```

## 注意事项
- 如果遇到 RLS 策略问题，可能需要在 Supabase 中暂时禁用 RLS 进行测试
- 确保 .env 文件中的 SUPABASE_URL 和 SUPABASE_ANON_KEY 正确配置