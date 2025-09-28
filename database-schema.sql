-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建客户表
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  position VARCHAR(100),
  industry VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  wechat VARCHAR(100),
  address TEXT,
  tags TEXT[], -- 数组类型存储标签
  importance VARCHAR(10) CHECK (importance IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('potential', 'following', 'signed', 'lost')) DEFAULT 'potential',
  source VARCHAR(100),
  notes TEXT,
  last_contact TIMESTAMPTZ,
  next_follow_date TIMESTAMPTZ,
  birthday DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建跟进提醒表
CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  remind_date TIMESTAMPTZ NOT NULL,
  title VARCHAR(200),
  message TEXT,
  type VARCHAR(20) CHECK (type IN ('follow_up', 'birthday', 'festival', 'contract')) DEFAULT 'follow_up',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建沟通历史表
CREATE TABLE communication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('phone', 'email', 'meeting', 'wechat', 'visit', 'other')) DEFAULT 'other',
  content TEXT NOT NULL,
  result TEXT,
  next_step TEXT,
  attachments TEXT[], -- 存储附件URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_importance ON customers(importance);
CREATE INDEX idx_follow_up_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX idx_follow_up_reminders_remind_date ON follow_up_reminders(remind_date);
CREATE INDEX idx_follow_up_reminders_is_completed ON follow_up_reminders(is_completed);
CREATE INDEX idx_communication_history_customer_id ON communication_history(customer_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 开启Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 用户只能看到自己的数据
CREATE POLICY "Users can view own customers" ON customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers
    FOR DELETE USING (auth.uid() = user_id);

-- 提醒表的RLS策略
CREATE POLICY "Users can view own reminders" ON follow_up_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON follow_up_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON follow_up_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON follow_up_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- 沟通历史表的RLS策略
CREATE POLICY "Users can view own communication history" ON communication_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communication history" ON communication_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communication history" ON communication_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own communication history" ON communication_history
    FOR DELETE USING (auth.uid() = user_id);
