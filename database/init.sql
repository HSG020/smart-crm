-- 创建客户表
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    position VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    wechat VARCHAR(50),
    address TEXT,
    tags TEXT[],
    importance VARCHAR(10) CHECK (importance IN ('high', 'medium', 'low')),
    status VARCHAR(20) CHECK (status IN ('potential', 'following', 'signed', 'lost')),
    source VARCHAR(100),
    notes TEXT,
    last_contact TIMESTAMP,
    next_follow_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- 创建跟进提醒表
CREATE TABLE IF NOT EXISTS follow_up_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    remind_date TIMESTAMP NOT NULL,
    message TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- 创建沟通历史表
CREATE TABLE IF NOT EXISTS communication_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('phone', 'email', 'meeting', 'wechat', 'other')),
    content TEXT,
    result TEXT,
    next_step TEXT,
    attachments TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- 创建销售机会表
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    opportunity_name VARCHAR(200) NOT NULL,
    expected_amount DECIMAL(12, 2),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    stage VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- 创建团队成员表
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_importance ON customers(importance);
CREATE INDEX idx_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX idx_reminders_date ON follow_up_reminders(remind_date);
CREATE INDEX idx_communications_customer_id ON communication_history(customer_id);
CREATE INDEX idx_opportunities_customer_id ON sales_opportunities(customer_id);

-- 启用Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 客户表策略
CREATE POLICY "Users can view their own customers" ON customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers" ON customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" ON customers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" ON customers
    FOR DELETE USING (auth.uid() = user_id);

-- 提醒表策略
CREATE POLICY "Users can view their own reminders" ON follow_up_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON follow_up_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON follow_up_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON follow_up_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- 沟通历史策略
CREATE POLICY "Users can view their own communications" ON communication_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own communications" ON communication_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own communications" ON communication_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own communications" ON communication_history
    FOR DELETE USING (auth.uid() = user_id);

-- 销售机会策略
CREATE POLICY "Users can view their own opportunities" ON sales_opportunities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own opportunities" ON sales_opportunities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunities" ON sales_opportunities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opportunities" ON sales_opportunities
    FOR DELETE USING (auth.uid() = user_id);

-- 团队成员表策略（所有用户可查看）
CREATE POLICY "All users can view team members" ON team_members
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can manage team members" ON team_members
    FOR ALL USING (auth.uid() IS NOT NULL);