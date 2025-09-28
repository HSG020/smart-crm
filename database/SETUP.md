# 📚 数据库设置指南

## 🎯 执行顺序

按照以下顺序在 Supabase SQL 编辑器中执行：

### 第一步：基础扩展
```sql
-- 启用必要的 PostgreSQL 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID 工具
CREATE EXTENSION IF NOT EXISTS "plpgsql";   -- 存储过程
```

### 第二步：核心业务表（按依赖顺序）

1. **客户表** `create-customers-table.sql`
   - 独立表，无依赖
   - 是其他表的外键依赖

2. **提醒表** `create-reminders-table.sql`
   - 依赖：customers 表

3. **沟通记录表** `create-communications-table.sql`
   - 依赖：customers 表

4. **销售机会表** `create-opportunities-table.sql`
   - 依赖：customers 表

5. **话术库表** `create-scripts-table.sql`
   - 独立表，无依赖

### 第三步：工作流系统表

6. **工作流表** `workflow-schema.sql`
   - 包含完整的工作流系统架构
   - 依赖：customers 表, auth.users 表
   - 已包含 RLS 策略

### 第四步：RLS 策略配置

7. **启用 RLS** `enable-rls.sql`
   - 为所有业务表启用行级安全策略
   - 必须在创建表之后执行

### 第五步：数据修复（如需要）

8. **修复脚本** `fix-schema.sql`
   - 仅在发现数据问题时执行
   - 用于添加缺失字段或修复数据

## ⚠️ 重要提醒

### 权限要求
- 需要数据库 Owner 权限执行扩展创建
- 需要表 Owner 权限执行 RLS 策略

### 环境区分
- **开发环境**：可以直接执行所有脚本
- **生产环境**：建议分批执行，每步验证

### 回滚策略
每个表都有对应的 DROP 语句：
```sql
-- 删除工作流表（级联删除相关数据）
DROP TABLE IF EXISTS workflow_node_executions CASCADE;
DROP TABLE IF EXISTS workflow_triggers_log CASCADE;
DROP TABLE IF EXISTS workflow_runs CASCADE;
DROP TABLE IF EXISTS workflow_templates CASCADE;
DROP TABLE IF EXISTS workflow_actions CASCADE;
DROP TABLE IF EXISTS workflow_definitions CASCADE;

-- 删除业务表
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS scripts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
```

## 🔍 验证步骤

### 1. 验证表结构
```sql
-- 查看所有表
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 查看表字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers';
```

### 2. 验证 RLS 策略
```sql
-- 查看表的 RLS 状态
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 查看具体策略
SELECT * FROM pg_policies
WHERE tablename = 'customers';
```

### 3. 运行 CRUD 测试
```bash
# 使用验证脚本
npx tsx scripts/verify-supabase-crud.ts
```

## 📋 检查清单

- [ ] pgcrypto 扩展已启用
- [ ] 所有业务表已创建
- [ ] 工作流系统表已创建
- [ ] RLS 策略已配置
- [ ] CRUD 测试通过
- [ ] 权限验证完成

## 🚨 常见问题

### Q: gen_random_uuid() 函数不存在
A: 执行 `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`

### Q: RLS 策略阻止数据访问
A: 检查是否已登录，或临时禁用 RLS：`ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### Q: 外键约束失败
A: 确保按照正确顺序创建表，先创建被引用的表

### Q: 表已存在错误
A: 使用 `CREATE TABLE IF NOT EXISTS` 或先删除旧表

## 📞 支持

如遇到问题，请检查：
1. Supabase 项目设置中的数据库权限
2. SQL 编辑器的错误日志
3. 项目的 API 设置和密钥配置