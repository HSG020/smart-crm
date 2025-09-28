# 数据库设置指南

## 步骤 1：登录 Supabase 控制台

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目（项目ID: tbdzulrucgxpqirmawoc）

## 步骤 2：创建数据库表

1. 在左侧菜单中点击 **SQL Editor**
2. 点击 **New Query**
3. 复制 `init.sql` 文件的全部内容
4. 粘贴到查询编辑器中
5. 点击 **Run** 按钮执行

这将创建以下表：
- `customers` - 客户信息表
- `follow_up_reminders` - 跟进提醒表
- `communication_history` - 沟通历史表
- `sales_opportunities` - 销售机会表
- `team_members` - 团队成员表

## 步骤 3：创建测试账号

1. 在您的CRM应用中点击"注册"
2. 使用以下信息创建账号：
   - 邮箱：test@example.com
   - 密码：Test123456
   - 姓名：测试用户

## 步骤 4：插入测试数据

1. 登录成功后，回到 Supabase SQL Editor
2. 创建新查询
3. 复制 `test-data.sql` 文件的全部内容
4. 粘贴并执行

这将创建：
- 5个测试客户
- 自动生成的提醒
- 沟通记录示例
- 销售机会示例
- 4个团队成员

## 步骤 5：验证数据

1. 回到您的CRM应用
2. 刷新页面
3. 检查各个模块是否显示数据：
   - 客户管理：应显示5个客户
   - 跟进提醒：应有待处理的提醒
   - 销售机会：应显示商机信息
   - 团队管理：应显示4个团队成员

## 注意事项

- Row Level Security (RLS) 已启用，每个用户只能看到自己的数据
- 团队成员表对所有用户可见
- 如需修改权限策略，请在 Supabase Dashboard 的 Authentication > Policies 中调整

## 常见问题

### Q: 为什么看不到数据？
A: 确保您已登录，并且数据的 user_id 与您的账号匹配。

### Q: 如何重置数据库？
A: 在 SQL Editor 中执行：
```sql
DROP TABLE IF EXISTS communication_history CASCADE;
DROP TABLE IF EXISTS follow_up_reminders CASCADE;
DROP TABLE IF EXISTS sales_opportunities CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
```
然后重新运行 `init.sql`

### Q: 如何查看当前用户ID？
A: 在 SQL Editor 中执行：
```sql
SELECT auth.uid();
```