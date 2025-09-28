-- 工作流系统数据库架构
-- 用于支持自动化工作流引擎

-- ==========================================
-- 0. 启用必要的扩展
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. 工作流定义表
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, inactive, archived

  -- 工作流定义（JSON Schema）
  definition JSONB NOT NULL, -- 包含触发器、节点、连接等完整定义

  -- 触发器配置
  trigger_type VARCHAR(50), -- time, event, condition, manual, ai
  trigger_config JSONB, -- 具体触发配置

  -- 元数据
  category VARCHAR(100), -- 销售、营销、客服等
  tags TEXT[],

  -- 权限控制
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 索引
  CONSTRAINT unique_workflow_name_version UNIQUE(name, version)
);

-- 创建索引
CREATE INDEX idx_workflow_definitions_status ON workflow_definitions(status);
CREATE INDEX idx_workflow_definitions_trigger_type ON workflow_definitions(trigger_type);
CREATE INDEX idx_workflow_definitions_category ON workflow_definitions(category);

-- ==========================================
-- 2. 工作流运行实例表
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,

  -- 运行状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,

  -- 触发信息
  trigger_source VARCHAR(100), -- 触发来源
  trigger_data JSONB, -- 触发时的数据

  -- 运行上下文
  context JSONB DEFAULT '{}', -- 运行时上下文数据
  variables JSONB DEFAULT '{}', -- 工作流变量

  -- 执行结果
  output JSONB, -- 最终输出
  error TEXT, -- 错误信息

  -- 性能指标
  duration_ms INTEGER, -- 执行耗时（毫秒）
  retry_count INTEGER DEFAULT 0, -- 重试次数

  -- 关联实体
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 审计
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_customer_id ON workflow_runs(customer_id);
CREATE INDEX idx_workflow_runs_created_at ON workflow_runs(created_at DESC);

-- ==========================================
-- 3. 工作流节点执行记录表
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_node_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,

  -- 节点信息
  node_id VARCHAR(100) NOT NULL, -- 节点在流程图中的ID
  node_type VARCHAR(50), -- action, condition, parallel, wait等
  node_name VARCHAR(255),

  -- 执行状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, skipped
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,

  -- 输入输出
  input JSONB, -- 节点输入数据
  output JSONB, -- 节点输出数据
  error TEXT, -- 错误信息

  -- 重试信息
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_workflow_node_executions_run_id ON workflow_node_executions(run_id);
CREATE INDEX idx_workflow_node_executions_status ON workflow_node_executions(status);

-- ==========================================
-- 4. 工作流动作定义表
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100), -- 客户、提醒、沟通、通知等

  -- 动作类型
  action_type VARCHAR(50), -- api, database, notification, integration

  -- 配置
  config_schema JSONB, -- 动作配置的JSON Schema
  default_config JSONB, -- 默认配置

  -- 输入输出定义
  input_schema JSONB, -- 输入参数的JSON Schema
  output_schema JSONB, -- 输出结果的JSON Schema

  -- 权限
  required_permission VARCHAR(100),

  -- 状态
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_workflow_actions_category ON workflow_actions(category);
CREATE INDEX idx_workflow_actions_action_type ON workflow_actions(action_type);

-- ==========================================
-- 5. 工作流触发器日志表
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_triggers_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,

  -- 触发信息
  trigger_type VARCHAR(50),
  trigger_time TIMESTAMPTZ DEFAULT NOW(),
  trigger_source VARCHAR(255),
  trigger_data JSONB,

  -- 触发结果
  triggered BOOLEAN DEFAULT false, -- 是否成功触发
  run_id UUID REFERENCES workflow_runs(id), -- 如果触发成功，关联的运行ID

  -- 失败原因
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_workflow_triggers_log_workflow_id ON workflow_triggers_log(workflow_id);
CREATE INDEX idx_workflow_triggers_log_trigger_time ON workflow_triggers_log(trigger_time DESC);
CREATE INDEX idx_workflow_triggers_log_triggered ON workflow_triggers_log(triggered);

-- ==========================================
-- 6. 工作流模板库表
-- ==========================================
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  -- 模板内容
  template JSONB NOT NULL, -- 完整的工作流定义模板
  preview_image TEXT, -- 预览图URL

  -- 使用统计
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,

  -- 标签
  tags TEXT[],
  industry VARCHAR(100),

  -- 发布信息
  is_public BOOLEAN DEFAULT false,
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_is_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_usage_count ON workflow_templates(usage_count DESC);

-- ==========================================
-- 7. 预定义动作示例数据
-- ==========================================
INSERT INTO workflow_actions (name, description, category, action_type, config_schema, input_schema) VALUES
  ('create_reminder', '创建跟进提醒', '提醒', 'database',
    '{"type": "object", "properties": {"priority": {"type": "string", "enum": ["high", "medium", "low"]}}}',
    '{"type": "object", "properties": {"customerId": {"type": "string"}, "title": {"type": "string"}, "date": {"type": "string"}}}'),

  ('send_email', '发送邮件', '通知', 'notification',
    '{"type": "object", "properties": {"template": {"type": "string"}}}',
    '{"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}}'),

  ('update_customer_status', '更新客户状态', '客户', 'database',
    '{"type": "object", "properties": {"allowedStatuses": {"type": "array"}}}',
    '{"type": "object", "properties": {"customerId": {"type": "string"}, "status": {"type": "string"}}}'),

  ('assign_to_user', '分配负责人', '客户', 'database',
    '{"type": "object", "properties": {"assignmentRule": {"type": "string", "enum": ["round-robin", "load-balance", "manual"]}}}',
    '{"type": "object", "properties": {"customerId": {"type": "string"}, "userId": {"type": "string"}}}'),

  ('create_opportunity', '创建销售机会', '销售', 'database',
    '{"type": "object", "properties": {"defaultStage": {"type": "string"}}}',
    '{"type": "object", "properties": {"customerId": {"type": "string"}, "title": {"type": "string"}, "value": {"type": "number"}}}');

-- ==========================================
-- 8. RLS 策略配置
-- ==========================================

-- 工作流定义表 RLS
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all active workflows" ON workflow_definitions
  FOR SELECT USING (status IN ('active', 'inactive'));
CREATE POLICY "Users can manage their own workflows" ON workflow_definitions
  FOR ALL USING (auth.uid() = created_by);

-- 工作流运行表 RLS
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all workflow runs" ON workflow_runs
  FOR SELECT USING (true);
CREATE POLICY "Users can create workflow runs" ON workflow_runs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 节点执行记录表 RLS
ALTER TABLE workflow_node_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view node executions" ON workflow_node_executions
  FOR SELECT USING (true);

-- 动作定义表 RLS
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all actions" ON workflow_actions
  FOR SELECT USING (true);

-- 触发器日志表 RLS
ALTER TABLE workflow_triggers_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view trigger logs" ON workflow_triggers_log
  FOR SELECT USING (true);

-- 模板库表 RLS
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public templates" ON workflow_templates
  FOR SELECT USING (is_public = true OR auth.uid() = published_by);

-- ==========================================
-- 9. 实用函数
-- ==========================================

-- 函数：计算工作流运行耗时
CREATE OR REPLACE FUNCTION calculate_workflow_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'cancelled') AND NEW.start_time IS NOT NULL THEN
    NEW.end_time = NOW();
    NEW.duration_ms = EXTRACT(MILLISECOND FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_calculate_workflow_duration
  BEFORE UPDATE ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_workflow_duration();

-- 函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
CREATE TRIGGER trigger_workflow_definitions_updated_at
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_workflow_runs_updated_at
  BEFORE UPDATE ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();