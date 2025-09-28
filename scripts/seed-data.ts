/**
 * 示例数据生成脚本
 * 用于创建演示数据和测试场景
 */

import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 示例客户数据
const sampleCustomers = [
  {
    name: '阿里巴巴集团',
    type: 'company',
    industry: '电子商务',
    scale: '10000人以上',
    status: 'active',
    level: 'vip',
    source: '市场推广',
    contactPerson: '张经理',
    phone: '13800138001',
    email: 'zhang@alibaba.com',
    address: '杭州市西湖区',
    website: 'www.alibaba.com',
    description: '全球领先的电子商务平台',
    tags: ['电商', '大客户', '战略合作']
  },
  {
    name: '腾讯科技',
    type: 'company',
    industry: '互联网',
    scale: '10000人以上',
    status: 'active',
    level: 'vip',
    source: '老客户推荐',
    contactPerson: '李总监',
    phone: '13800138002',
    email: 'li@tencent.com',
    address: '深圳市南山区',
    website: 'www.tencent.com',
    description: '领先的互联网综合服务提供商',
    tags: ['互联网', 'VIP', '长期合作']
  },
  {
    name: '字节跳动',
    type: 'company',
    industry: '互联网',
    scale: '10000人以上',
    status: 'active',
    level: 'important',
    source: '主动联系',
    contactPerson: '王经理',
    phone: '13800138003',
    email: 'wang@bytedance.com',
    address: '北京市海淀区',
    website: 'www.bytedance.com',
    description: '全球化科技公司',
    tags: ['新媒体', '快速增长', '潜力客户']
  },
  {
    name: '美团点评',
    type: 'company',
    industry: '生活服务',
    scale: '5000-10000人',
    status: 'active',
    level: 'important',
    source: '展会',
    contactPerson: '刘主管',
    phone: '13800138004',
    email: 'liu@meituan.com',
    address: '北京市朝阳区',
    website: 'www.meituan.com',
    description: '生活服务电子商务平台',
    tags: ['O2O', '本地生活', '重要客户']
  },
  {
    name: '京东集团',
    type: 'company',
    industry: '电子商务',
    scale: '10000人以上',
    status: 'active',
    level: 'vip',
    source: '合作伙伴推荐',
    contactPerson: '赵总',
    phone: '13800138005',
    email: 'zhao@jd.com',
    address: '北京市亦庄',
    website: 'www.jd.com',
    description: '自营式电商企业',
    tags: ['电商', '物流', 'VIP客户']
  },
  {
    name: '华为技术',
    type: 'company',
    industry: '通信设备',
    scale: '10000人以上',
    status: 'active',
    level: 'vip',
    source: '主动开发',
    contactPerson: '陈总工',
    phone: '13800138006',
    email: 'chen@huawei.com',
    address: '深圳市龙岗区',
    website: 'www.huawei.com',
    description: '全球领先的ICT解决方案供应商',
    tags: ['通信', '5G', '战略客户']
  },
  {
    name: '小米科技',
    type: 'company',
    industry: '消费电子',
    scale: '5000-10000人',
    status: 'active',
    level: 'important',
    source: '网络营销',
    contactPerson: '周经理',
    phone: '13800138007',
    email: 'zhou@xiaomi.com',
    address: '北京市海淀区',
    website: 'www.xiaomi.com',
    description: '智能硬件和电子产品公司',
    tags: ['智能硬件', 'IoT', '成长型']
  },
  {
    name: '网易公司',
    type: 'company',
    industry: '互联网',
    scale: '5000-10000人',
    status: 'active',
    level: 'normal',
    source: '电话营销',
    contactPerson: '吴主管',
    phone: '13800138008',
    email: 'wu@163.com',
    address: '杭州市滨江区',
    website: 'www.163.com',
    description: '互联网技术公司',
    tags: ['游戏', '教育', '邮箱']
  },
  {
    name: '顺丰速运',
    type: 'company',
    industry: '物流',
    scale: '10000人以上',
    status: 'active',
    level: 'important',
    source: '老客户推荐',
    contactPerson: '郑总监',
    phone: '13800138009',
    email: 'zheng@sf-express.com',
    address: '深圳市宝安区',
    website: 'www.sf-express.com',
    description: '综合物流服务商',
    tags: ['物流', '快递', '供应链']
  },
  {
    name: '比亚迪汽车',
    type: 'company',
    industry: '汽车制造',
    scale: '10000人以上',
    status: 'active',
    level: 'vip',
    source: '展会',
    contactPerson: '何总工',
    phone: '13800138010',
    email: 'he@byd.com',
    address: '深圳市坪山区',
    website: 'www.byd.com',
    description: '新能源汽车领导者',
    tags: ['新能源', '电动车', '大客户']
  }
];

// 示例销售机会数据
const sampleOpportunities = [
  {
    name: 'ERP系统升级项目',
    customer_name: '阿里巴巴集团',
    amount: 5000000,
    stage: 'negotiation',
    probability: 80,
    expected_close_date: '2025-11-30',
    source: '客户主动',
    competitor: '用友、金蝶',
    description: '客户现有ERP系统需要升级，预算充足，决策流程已启动',
    next_step: '下周二进行方案演示'
  },
  {
    name: 'CRM系统采购',
    customer_name: '腾讯科技',
    amount: 3000000,
    stage: 'proposal',
    probability: 60,
    expected_close_date: '2025-12-15',
    source: '老客户扩展',
    competitor: 'Salesforce',
    description: '客户销售团队扩张，需要更强大的CRM系统',
    next_step: '提供定制化方案'
  },
  {
    name: '数据分析平台',
    customer_name: '字节跳动',
    amount: 2000000,
    stage: 'qualification',
    probability: 40,
    expected_close_date: '2025-12-30',
    source: '市场活动',
    competitor: 'Tableau、PowerBI',
    description: '客户需要建设统一的数据分析平台',
    next_step: '需求调研会议'
  },
  {
    name: '供应链管理系统',
    customer_name: '京东集团',
    amount: 8000000,
    stage: 'proposal',
    probability: 70,
    expected_close_date: '2025-10-30',
    source: '招标',
    competitor: 'SAP、Oracle',
    description: '参与客户供应链系统招标项目',
    next_step: '准备投标文件'
  },
  {
    name: '智能客服系统',
    customer_name: '美团点评',
    amount: 1500000,
    stage: 'negotiation',
    probability: 85,
    expected_close_date: '2025-10-15',
    source: '客户推荐',
    competitor: '自研',
    description: '客户需要AI驱动的智能客服解决方案',
    next_step: '商务谈判'
  },
  {
    name: '财务管理软件',
    customer_name: '华为技术',
    amount: 4000000,
    stage: 'closed_won',
    probability: 100,
    expected_close_date: '2025-09-30',
    source: '老客户',
    competitor: '无',
    description: '项目已成交，进入实施阶段',
    next_step: '项目实施'
  },
  {
    name: 'HR管理系统',
    customer_name: '小米科技',
    amount: 1200000,
    stage: 'lead',
    probability: 20,
    expected_close_date: '2026-01-30',
    source: '电话开发',
    competitor: '未知',
    description: '初步接触，客户有意向了解',
    next_step: '发送产品资料'
  },
  {
    name: '物流追踪系统',
    customer_name: '顺丰速运',
    amount: 6000000,
    stage: 'qualification',
    probability: 50,
    expected_close_date: '2025-12-20',
    source: '合作伙伴',
    competitor: '多家竞争',
    description: '客户正在评估多家供应商',
    next_step: 'POC测试'
  }
];

// 示例回款计划数据
const samplePaymentPlans = [
  {
    customer_name: '华为技术',
    opportunity_name: '财务管理软件',
    total_amount: 4000000,
    received_amount: 2000000,
    plan_date: '2025-10-15',
    status: 'partial',
    installments: 3,
    currency: 'CNY',
    payment_terms: '分三期付款：首付50%，二期30%，尾款20%',
    notes: '首期款已到账，等待二期付款'
  },
  {
    customer_name: '阿里巴巴集团',
    opportunity_name: 'ERP系统升级项目',
    total_amount: 5000000,
    received_amount: 0,
    plan_date: '2025-11-30',
    status: 'pending',
    installments: 2,
    currency: 'CNY',
    payment_terms: '签约后30天付60%，验收后付40%',
    notes: '合同已签订，等待首期付款'
  },
  {
    customer_name: '京东集团',
    opportunity_name: '供应链管理系统',
    total_amount: 8000000,
    received_amount: 0,
    plan_date: '2025-10-30',
    status: 'pending',
    installments: 4,
    currency: 'CNY',
    payment_terms: '季度付款，每季度25%',
    notes: '项目启动后开始付款'
  },
  {
    customer_name: '美团点评',
    opportunity_name: '智能客服系统',
    total_amount: 1500000,
    received_amount: 0,
    plan_date: '2025-10-15',
    status: 'pending',
    installments: 1,
    currency: 'CNY',
    payment_terms: '验收后一次性付清',
    notes: '项目接近验收阶段'
  },
  {
    customer_name: '腾讯科技',
    opportunity_name: 'CRM系统采购',
    total_amount: 3000000,
    received_amount: 0,
    plan_date: '2025-12-15',
    status: 'pending',
    installments: 2,
    currency: 'CNY',
    payment_terms: '首付70%，尾款30%',
    notes: '等待合同签订'
  }
];

// 示例活动记录
const sampleActivities = [
  {
    type: 'call',
    subject: '初次电话沟通',
    content: '与客户张经理进行了初次电话沟通，了解了基本需求',
    customer_name: '阿里巴巴集团',
    created_at: new Date('2025-09-15 10:30:00')
  },
  {
    type: 'meeting',
    subject: '需求调研会议',
    content: '参加客户需求调研会议，明确了系统功能需求和预算范围',
    customer_name: '腾讯科技',
    created_at: new Date('2025-09-20 14:00:00')
  },
  {
    type: 'email',
    subject: '发送产品方案',
    content: '向客户发送了定制化产品方案和报价单',
    customer_name: '字节跳动',
    created_at: new Date('2025-09-22 09:00:00')
  },
  {
    type: 'visit',
    subject: '客户拜访',
    content: '上门拜访客户，进行产品演示，客户反馈良好',
    customer_name: '京东集团',
    created_at: new Date('2025-09-25 15:30:00')
  },
  {
    type: 'call',
    subject: '商务谈判',
    content: '与客户进行价格谈判，基本达成一致',
    customer_name: '美团点评',
    created_at: new Date('2025-09-27 11:00:00')
  }
];

// 数据导入函数
async function seedDatabase() {
  try {
    console.log('🚀 开始导入示例数据...');

    // 1. 导入客户数据
    console.log('导入客户数据...');
    for (const customer of sampleCustomers) {
      const { error } = await supabase
        .from('customers')
        .insert(customer);
      if (error) console.error('导入客户失败:', error);
    }
    console.log('✅ 客户数据导入完成');

    // 2. 导入销售机会
    console.log('导入销售机会...');
    for (const opportunity of sampleOpportunities) {
      const { error } = await supabase
        .from('opportunities')
        .insert(opportunity);
      if (error) console.error('导入机会失败:', error);
    }
    console.log('✅ 销售机会导入完成');

    // 3. 导入回款计划
    console.log('导入回款计划...');
    for (const plan of samplePaymentPlans) {
      const { error } = await supabase
        .from('payment_plans')
        .insert(plan);
      if (error) console.error('导入回款计划失败:', error);
    }
    console.log('✅ 回款计划导入完成');

    // 4. 导入活动记录
    console.log('导入活动记录...');
    for (const activity of sampleActivities) {
      const { error } = await supabase
        .from('activities')
        .insert(activity);
      if (error) console.error('导入活动失败:', error);
    }
    console.log('✅ 活动记录导入完成');

    console.log('🎉 所有示例数据导入完成！');

  } catch (error) {
    console.error('❌ 数据导入失败:', error);
  }
}

// 执行导入
seedDatabase();