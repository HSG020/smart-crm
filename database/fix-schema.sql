-- 修复数据库架构脚本
-- 运行此脚本以确保所有表和字段都存在

-- 1. 修复客户表缺失的字段
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wechat VARCHAR(50);

-- 2. 修复提醒表缺失的字段
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE follow_up_reminders ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'follow_up' CHECK (type IN ('follow_up', 'birthday', 'festival', 'contract'));

-- 3. 确保所有必要的索引存在
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_importance ON customers(importance);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON follow_up_reminders(remind_date);
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communication_history(customer_id);

-- 4. 确保RLS策略正确设置
DO $$
BEGIN
  -- 客户表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can view their own customers') THEN
    CREATE POLICY "Users can view their own customers" ON customers FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can insert their own customers') THEN
    CREATE POLICY "Users can insert their own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can update their own customers') THEN
    CREATE POLICY "Users can update their own customers" ON customers FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can delete their own customers') THEN
    CREATE POLICY "Users can delete their own customers" ON customers FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- 提醒表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_up_reminders' AND policyname = 'Users can view their own reminders') THEN
    CREATE POLICY "Users can view their own reminders" ON follow_up_reminders FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_up_reminders' AND policyname = 'Users can insert their own reminders') THEN
    CREATE POLICY "Users can insert their own reminders" ON follow_up_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_up_reminders' AND policyname = 'Users can update their own reminders') THEN
    CREATE POLICY "Users can update their own reminders" ON follow_up_reminders FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_up_reminders' AND policyname = 'Users can delete their own reminders') THEN
    CREATE POLICY "Users can delete their own reminders" ON follow_up_reminders FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- 沟通历史表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_history' AND policyname = 'Users can view their own communications') THEN
    CREATE POLICY "Users can view their own communications" ON communication_history FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_history' AND policyname = 'Users can insert their own communications') THEN
    CREATE POLICY "Users can insert their own communications" ON communication_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_history' AND policyname = 'Users can update their own communications') THEN
    CREATE POLICY "Users can update their own communications" ON communication_history FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_history' AND policyname = 'Users can delete their own communications') THEN
    CREATE POLICY "Users can delete their own communications" ON communication_history FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- 团队成员表策略
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'All users can view team members') THEN
    CREATE POLICY "All users can view team members" ON team_members FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Authenticated users can manage team members') THEN
    CREATE POLICY "Authenticated users can manage team members" ON team_members FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;