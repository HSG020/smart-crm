-- Create sales_scripts table for storing sales script templates
-- Run this in Supabase SQL Editor to add script template functionality

-- 1. Create the sales_scripts table
CREATE TABLE IF NOT EXISTS sales_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    scenario TEXT,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Create indexes for better performance
CREATE INDEX idx_sales_scripts_user_id ON sales_scripts(user_id);
CREATE INDEX idx_sales_scripts_category ON sales_scripts(category);
CREATE INDEX idx_sales_scripts_is_favorite ON sales_scripts(is_favorite);

-- 3. Enable Row Level Security
ALTER TABLE sales_scripts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own scripts"
ON sales_scripts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts"
ON sales_scripts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
ON sales_scripts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
ON sales_scripts FOR DELETE
USING (auth.uid() = user_id);

-- 5. Grant permissions
GRANT ALL ON sales_scripts TO authenticated;

-- 6. Insert some default script templates (optional - these will be owned by the current user)
INSERT INTO sales_scripts (title, category, scenario, content, tags, user_id)
VALUES
    (
        '初次接触客户',
        '开场白',
        '电话或面对面初次接触潜在客户',
        '您好，[客户称呼]，我是[公司名称]的[您的名字]。感谢您抽出宝贵时间与我交流。我注意到贵公司在[行业/领域]发展迅速，我们的[产品/服务]曾帮助类似企业提升了[具体数字]的效率。不知道您是否有几分钟时间，让我简单介绍一下我们如何能为贵公司创造价值？',
        ARRAY['开场白', '初次接触', '电话销售'],
        auth.uid()
    ),
    (
        '处理价格异议',
        '异议处理',
        '客户认为产品价格过高',
        '我理解您的顾虑，[客户称呼]。确实，优质的解决方案需要一定的投资。不过，让我们一起算一笔账：目前这个问题每月给您造成的损失是多少？而我们的方案可以帮您节省[具体数字]的成本，通常在[时间]内就能收回投资。更重要的是，这是对贵公司长远发展的投资。',
        ARRAY['价格异议', '成本效益', '投资回报'],
        auth.uid()
    ),
    (
        '跟进邮件模板',
        '邮件跟进',
        '会议后的跟进邮件',
        '尊敬的[客户称呼]，

感谢您今天抽出时间与我会面。根据我们的讨论，我总结了以下要点：

1. [关键问题1]
2. [关键问题2]
3. [解决方案要点]

按照约定，我将在[日期]前为您准备详细的解决方案。如果您有任何其他问题或需求，请随时联系我。

期待我们的下一步合作！

此致
[您的签名]',
        ARRAY['邮件模板', '会议跟进', '商务邮件'],
        auth.uid()
    ),
    (
        '产品演示介绍',
        '产品展示',
        '向客户演示产品功能',
        '接下来，让我为您演示一下我们产品的核心功能。首先，这个功能可以帮您[具体好处]。您看，只需要[简单步骤]，就能完成原本需要[时间]的工作。根据我们的统计，使用这个功能的客户平均提升了[百分比]的工作效率。您觉得这个功能对贵公司的[具体部门/流程]会有帮助吗？',
        ARRAY['产品演示', '功能介绍', '效率提升'],
        auth.uid()
    ),
    (
        '竞争对手比较',
        '竞争分析',
        '客户提到正在考虑竞争对手',
        '很高兴您正在认真评估各种选择，[客户称呼]。确实，[竞争对手]也是市场上的知名品牌。不过，我们的优势在于[独特优势1]和[独特优势2]。例如，[具体客户案例]选择我们而非[竞争对手]，主要是因为[具体原因]。我可以安排您与他们的负责人交流，了解他们的真实体验。',
        ARRAY['竞争对比', '差异化', '客户案例'],
        auth.uid()
    );

-- Success message
SELECT 'Sales scripts table created successfully!' as message;