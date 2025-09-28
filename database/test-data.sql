-- 测试数据插入脚本
-- 注意：运行前需要先创建一个测试账号，并替换下面的 'YOUR_USER_ID' 为实际的用户ID

-- 插入测试客户数据
INSERT INTO customers (name, company, position, phone, email, wechat, address, tags, importance, status, source, notes, last_contact, next_follow_date, user_id)
VALUES
('张三', '科技有限公司', 'CTO', '13800138001', 'zhangsan@tech.com', 'zhangsan_wx', '北京市朝阳区', ARRAY['技术决策者', 'AI感兴趣'], 'high', 'following', '展会', '对AI产品很感兴趣，下周安排产品演示', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', auth.uid()),
('李四', '创新科技', '产品经理', '13800138002', 'lisi@innovation.com', 'lisi_wx', '上海市浦东新区', ARRAY['产品线', '预算充足'], 'medium', 'potential', '网站', '正在评估多家供应商', NOW() - INTERVAL '5 days', NOW() + INTERVAL '7 days', auth.uid()),
('王五', '数据公司', 'CEO', '13800138003', 'wangwu@data.com', 'wangwu_wx', '深圳市南山区', ARRAY['决策者', '大客户'], 'high', 'signed', '推荐', '已经进入商务谈判阶段', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', auth.uid()),
('赵六', '咨询公司', '采购经理', '13800138004', 'zhaoliu@consult.com', NULL, '广州市天河区', ARRAY['采购', '价格敏感'], 'low', 'following', '电话营销', '需要更多时间考虑', NOW() - INTERVAL '10 days', NOW() + INTERVAL '15 days', auth.uid()),
('陈七', '金融集团', '技术总监', '13800138005', 'chenqi@finance.com', 'chenqi_wx', '北京市西城区', ARRAY['金融行业', '合规要求高'], 'high', 'following', '合作伙伴推荐', '需要通过合规审查', NOW() - INTERVAL '3 days', NOW() + INTERVAL '5 days', auth.uid());

-- 插入测试提醒数据
INSERT INTO follow_up_reminders (customer_id, remind_date, title, message, type, is_completed, user_id)
SELECT
    c.id,
    c.next_follow_date,
    '例行跟进',
    '安排跟进联系，了解客户需求进展',
    'follow_up',
    FALSE,
    c.user_id
FROM customers c
WHERE c.user_id = auth.uid()
LIMIT 3;

-- 插入测试沟通记录
INSERT INTO communication_history (customer_id, type, content, result, next_step, user_id)
SELECT
    c.id,
    'phone',
    '初次电话沟通，介绍产品特性',
    '客户表示感兴趣',
    '发送产品资料，预约演示',
    c.user_id
FROM customers c
WHERE c.user_id = auth.uid()
LIMIT 3;

-- 插入测试销售机会
INSERT INTO sales_opportunities (customer_id, opportunity_name, expected_amount, probability, expected_close_date, stage, notes, user_id)
SELECT
    c.id,
    c.company || ' - CRM系统采购',
    CASE
        WHEN c.importance = 'high' THEN 500000
        WHEN c.importance = 'medium' THEN 200000
        ELSE 50000
    END,
    CASE
        WHEN c.status = 'signed' THEN 90
        WHEN c.status = 'following' THEN 60
        WHEN c.status = 'potential' THEN 30
        ELSE 15
    END,
    NOW() + INTERVAL '30 days',
    c.status,
    '重点跟进项目',
    c.user_id
FROM customers c
WHERE c.user_id = auth.uid()
AND c.importance IN ('high', 'medium')
LIMIT 3;

-- 插入团队成员测试数据
INSERT INTO team_members (name, email, phone, role, department)
VALUES
('张经理', 'manager.zhang@company.com', '13900139001', '销售经理', '销售部'),
('李销售', 'sales.li@company.com', '13900139002', '销售代表', '销售部'),
('王助理', 'assistant.wang@company.com', '13900139003', '销售助理', '销售部'),
('陈分析师', 'analyst.chen@company.com', '13900139004', '数据分析师', '运营部');
