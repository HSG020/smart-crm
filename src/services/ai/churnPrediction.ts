/**
 * 客户流失预警系统
 * 实时监控和预测客户流失风险
 */

import { Customer } from '../../types'
import { CustomerMetrics, HealthScoreResult } from './healthScore'
import dayjs from 'dayjs'

export interface ChurnRiskFactors {
  behavioralFactors: {
    engagementDecline: number      // 互动频率下降
    responseTimeIncrease: number   // 响应时间增加
    complaintFrequency: number     // 投诉频率
    supportTickets: number         // 支持工单数
  }
  transactionalFactors: {
    purchaseFrequencyDecline: number  // 购买频率下降
    averageOrderValueDecline: number  // 平均订单价值下降
    paymentDelays: number            // 付款延迟次数
    contractNonRenewal: boolean     // 合同未续约
  }
  relationshipFactors: {
    satisfactionScore: number        // 满意度评分
    npsScore: number                 // NPS评分
    keyContactChanges: number       // 关键联系人变动
    competitorMentions: number      // 竞争对手提及次数
  }
  externalFactors: {
    industryVolatility: number      // 行业波动性
    economicIndicators: number     // 经济指标
    seasonalFactors: number         // 季节性因素
  }
}

export interface ChurnPredictionResult {
  customerId: string
  customerName: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  churnProbability: number        // 0-1
  timeToChurn: number             // 预计流失天数
  primaryRiskFactors: string[]    // 主要风险因素
  earlyWarningSignals: string[]   // 早期预警信号
  recommendedActions: ChurnPreventionAction[]
  confidenceScore: number         // 预测置信度
  lastUpdated: string
}

export interface ChurnPreventionAction {
  action: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  expectedImpact: 'high' | 'medium' | 'low'
  implementationTime: string
  resources: string[]
  successMetrics: string[]
}

export interface ChurnPattern {
  pattern: string
  indicators: string[]
  typicalTimeframe: number  // 天数
  preventionRate: number     // 成功预防率
}

/**
 * 流失预测引擎
 */
export class ChurnPredictionEngine {
  // 已知的流失模式
  private churnPatterns: ChurnPattern[] = [
    {
      pattern: '沉默流失',
      indicators: [
        '30天内无任何互动',
        '未响应多次联系尝试',
        '停止打开营销邮件'
      ],
      typicalTimeframe: 60,
      preventionRate: 0.4
    },
    {
      pattern: '渐进式流失',
      indicators: [
        '互动频率持续下降',
        '响应时间逐渐延长',
        '参与度降低'
      ],
      typicalTimeframe: 90,
      preventionRate: 0.6
    },
    {
      pattern: '突发性流失',
      indicators: [
        '重大投诉或问题',
        '关键人员离职',
        '预算削减'
      ],
      typicalTimeframe: 30,
      preventionRate: 0.3
    },
    {
      pattern: '竞争性流失',
      indicators: [
        '频繁提及竞争对手',
        '要求功能对比',
        '价格谈判失败'
      ],
      typicalTimeframe: 45,
      preventionRate: 0.5
    }
  ]

  /**
   * 预测客户流失风险
   */
  predictChurn(
    customer: Customer,
    metrics: CustomerMetrics,
    riskFactors: ChurnRiskFactors,
    healthScore?: HealthScoreResult
  ): ChurnPredictionResult {
    // 计算基础流失概率
    const baseProbability = this.calculateBaseProbability(customer, metrics, healthScore)

    // 分析风险因素
    const factorAnalysis = this.analyzeRiskFactors(riskFactors)

    // 检测流失模式
    const detectedPatterns = this.detectChurnPatterns(customer, metrics, riskFactors)

    // 计算综合流失概率
    const churnProbability = this.calculateFinalProbability(
      baseProbability,
      factorAnalysis,
      detectedPatterns
    )

    // 确定风险级别
    const riskLevel = this.determineRiskLevel(churnProbability)

    // 预测流失时间
    const timeToChurn = this.predictTimeToChurn(churnProbability, detectedPatterns)

    // 识别主要风险因素
    const primaryRiskFactors = this.identifyPrimaryRisks(riskFactors, factorAnalysis)

    // 生成早期预警信号
    const earlyWarningSignals = this.generateWarningSignals(customer, metrics, riskFactors)

    // 推荐预防措施
    const recommendedActions = this.recommendPreventionActions(
      riskLevel,
      primaryRiskFactors,
      detectedPatterns
    )

    // 计算置信度
    const confidenceScore = this.calculateConfidence(metrics, riskFactors)

    return {
      customerId: customer.id,
      customerName: customer.name,
      riskLevel,
      churnProbability,
      timeToChurn,
      primaryRiskFactors,
      earlyWarningSignals,
      recommendedActions,
      confidenceScore,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * 计算基础流失概率
   */
  private calculateBaseProbability(
    customer: Customer,
    metrics: CustomerMetrics,
    healthScore?: HealthScoreResult
  ): number {
    let probability = 0

    // 基于健康度评分
    if (healthScore) {
      probability = healthScore.predictedChurn * 0.4
    }

    // 基于客户状态
    switch (customer.status) {
      case 'lost':
        probability += 0.9
        break
      case 'dormant':
        probability += 0.6
        break
      case 'at-risk':
        probability += 0.4
        break
      case 'potential':
        probability += 0.2
        break
    }

    // 基于最后联系时间
    if (metrics.lastContactDays > 90) probability += 0.3
    else if (metrics.lastContactDays > 60) probability += 0.2
    else if (metrics.lastContactDays > 30) probability += 0.1

    // 基于错过的跟进
    probability += metrics.missedFollowUps * 0.05

    return Math.min(1, probability)
  }

  /**
   * 分析风险因素
   */
  private analyzeRiskFactors(factors: ChurnRiskFactors): Record<string, number> {
    const analysis: Record<string, number> = {}

    // 行为因素分析
    const behavioralRisk = (
      factors.behavioralFactors.engagementDecline * 0.3 +
      factors.behavioralFactors.responseTimeIncrease * 0.2 +
      factors.behavioralFactors.complaintFrequency * 0.3 +
      factors.behavioralFactors.supportTickets * 0.2
    )
    analysis.behavioral = Math.min(1, behavioralRisk)

    // 交易因素分析
    const transactionalRisk = (
      factors.transactionalFactors.purchaseFrequencyDecline * 0.3 +
      factors.transactionalFactors.averageOrderValueDecline * 0.2 +
      factors.transactionalFactors.paymentDelays * 0.2 +
      (factors.transactionalFactors.contractNonRenewal ? 0.3 : 0)
    )
    analysis.transactional = Math.min(1, transactionalRisk)

    // 关系因素分析
    const relationshipRisk = (
      (100 - factors.relationshipFactors.satisfactionScore) / 100 * 0.3 +
      (100 - factors.relationshipFactors.npsScore) / 100 * 0.3 +
      factors.relationshipFactors.keyContactChanges * 0.2 +
      factors.relationshipFactors.competitorMentions * 0.2
    )
    analysis.relationship = Math.min(1, relationshipRisk)

    // 外部因素分析
    const externalRisk = (
      factors.externalFactors.industryVolatility * 0.4 +
      factors.externalFactors.economicIndicators * 0.3 +
      factors.externalFactors.seasonalFactors * 0.3
    )
    analysis.external = Math.min(1, externalRisk)

    return analysis
  }

  /**
   * 检测流失模式
   */
  private detectChurnPatterns(
    customer: Customer,
    metrics: CustomerMetrics,
    factors: ChurnRiskFactors
  ): ChurnPattern[] {
    const detected: ChurnPattern[] = []

    // 检测沉默流失
    if (metrics.lastContactDays > 30 && metrics.totalInteractions < 2) {
      const silentPattern = this.churnPatterns.find(p => p.pattern === '沉默流失')
      if (silentPattern) detected.push(silentPattern)
    }

    // 检测渐进式流失
    if (factors.behavioralFactors.engagementDecline > 0.5) {
      const gradualPattern = this.churnPatterns.find(p => p.pattern === '渐进式流失')
      if (gradualPattern) detected.push(gradualPattern)
    }

    // 检测突发性流失
    if (factors.behavioralFactors.complaintFrequency > 2) {
      const suddenPattern = this.churnPatterns.find(p => p.pattern === '突发性流失')
      if (suddenPattern) detected.push(suddenPattern)
    }

    // 检测竞争性流失
    if (factors.relationshipFactors.competitorMentions > 3) {
      const competitivePattern = this.churnPatterns.find(p => p.pattern === '竞争性流失')
      if (competitivePattern) detected.push(competitivePattern)
    }

    return detected
  }

  /**
   * 计算最终流失概率
   */
  private calculateFinalProbability(
    baseProbability: number,
    factorAnalysis: Record<string, number>,
    patterns: ChurnPattern[]
  ): number {
    // 基础概率权重 40%
    let finalProbability = baseProbability * 0.4

    // 风险因素权重 40%
    const avgFactorRisk = Object.values(factorAnalysis).reduce((a, b) => a + b, 0) /
                          Object.keys(factorAnalysis).length
    finalProbability += avgFactorRisk * 0.4

    // 模式匹配权重 20%
    if (patterns.length > 0) {
      const patternRisk = 1 - (patterns.reduce((min, p) =>
        Math.min(min, p.preventionRate), 1))
      finalProbability += patternRisk * 0.2
    }

    return Math.min(0.95, Math.max(0.05, finalProbability))
  }

  /**
   * 确定风险级别
   */
  private determineRiskLevel(probability: number): ChurnPredictionResult['riskLevel'] {
    if (probability >= 0.75) return 'critical'
    if (probability >= 0.50) return 'high'
    if (probability >= 0.25) return 'medium'
    return 'low'
  }

  /**
   * 预测流失时间
   */
  private predictTimeToChurn(probability: number, patterns: ChurnPattern[]): number {
    // 基于概率的基础时间
    let baseTime = Math.round((1 - probability) * 180) // 最长180天

    // 根据检测到的模式调整
    if (patterns.length > 0) {
      const avgPatternTime = patterns.reduce((sum, p) =>
        sum + p.typicalTimeframe, 0) / patterns.length
      baseTime = Math.round((baseTime + avgPatternTime) / 2)
    }

    return Math.max(7, baseTime) // 至少7天
  }

  /**
   * 识别主要风险因素
   */
  private identifyPrimaryRisks(
    factors: ChurnRiskFactors,
    analysis: Record<string, number>
  ): string[] {
    const risks: string[] = []

    // 按风险程度排序
    const sortedRisks = Object.entries(analysis)
      .sort(([, a], [, b]) => b - a)
      .filter(([, risk]) => risk > 0.3)

    sortedRisks.forEach(([category, risk]) => {
      switch (category) {
        case 'behavioral':
          if (factors.behavioralFactors.engagementDecline > 0.5) {
            risks.push('客户互动频率显著下降')
          }
          if (factors.behavioralFactors.complaintFrequency > 2) {
            risks.push('投诉频率异常增加')
          }
          break
        case 'transactional':
          if (factors.transactionalFactors.contractNonRenewal) {
            risks.push('合同未续约风险')
          }
          if (factors.transactionalFactors.purchaseFrequencyDecline > 0.5) {
            risks.push('购买频率大幅下降')
          }
          break
        case 'relationship':
          if (factors.relationshipFactors.satisfactionScore < 60) {
            risks.push('客户满意度低')
          }
          if (factors.relationshipFactors.competitorMentions > 2) {
            risks.push('频繁提及竞争对手')
          }
          break
      }
    })

    return risks.slice(0, 5) // 返回前5个主要风险
  }

  /**
   * 生成预警信号
   */
  private generateWarningSignals(
    customer: Customer,
    metrics: CustomerMetrics,
    factors: ChurnRiskFactors
  ): string[] {
    const signals: string[] = []

    // 时间相关信号
    if (metrics.lastContactDays > 45) {
      signals.push(`${metrics.lastContactDays}天未联系`)
    }

    // 互动相关信号
    if (factors.behavioralFactors.engagementDecline > 0.3) {
      signals.push('最近3个月互动减少' +
        Math.round(factors.behavioralFactors.engagementDecline * 100) + '%')
    }

    // 满意度信号
    if (factors.relationshipFactors.satisfactionScore < 70) {
      signals.push(`满意度评分仅${factors.relationshipFactors.satisfactionScore}分`)
    }

    // 支持相关信号
    if (factors.behavioralFactors.supportTickets > 5) {
      signals.push(`近期提交${factors.behavioralFactors.supportTickets}个支持工单`)
    }

    // 付款相关信号
    if (factors.transactionalFactors.paymentDelays > 2) {
      signals.push(`${factors.transactionalFactors.paymentDelays}次付款延迟`)
    }

    return signals
  }

  /**
   * 推荐预防措施
   */
  private recommendPreventionActions(
    riskLevel: ChurnPredictionResult['riskLevel'],
    primaryRisks: string[],
    patterns: ChurnPattern[]
  ): ChurnPreventionAction[] {
    const actions: ChurnPreventionAction[] = []

    // 基于风险级别的通用措施
    if (riskLevel === 'critical' || riskLevel === 'high') {
      actions.push({
        action: '安排高管紧急拜访',
        priority: 'urgent',
        expectedImpact: 'high',
        implementationTime: '24小时内',
        resources: ['高管时间', '客户经理'],
        successMetrics: ['客户满意度提升', '续约意向确认']
      })
    }

    // 基于主要风险的针对性措施
    if (primaryRisks.includes('客户互动频率显著下降')) {
      actions.push({
        action: '制定重新激活计划',
        priority: 'high',
        expectedImpact: 'medium',
        implementationTime: '3天内',
        resources: ['营销团队', '内容资源'],
        successMetrics: ['互动频率恢复', '响应率提升']
      })
    }

    if (primaryRisks.includes('客户满意度低')) {
      actions.push({
        action: '开展满意度调研并制定改进方案',
        priority: 'high',
        expectedImpact: 'high',
        implementationTime: '1周内',
        resources: ['客户成功团队', '产品团队'],
        successMetrics: ['NPS提升10分', '问题解决率95%']
      })
    }

    // 基于流失模式的措施
    patterns.forEach(pattern => {
      switch (pattern.pattern) {
        case '沉默流失':
          actions.push({
            action: '启动"唤醒计划"',
            priority: 'high',
            expectedImpact: 'medium',
            implementationTime: '立即',
            resources: ['专属客户经理', '营销自动化'],
            successMetrics: ['30天内恢复联系', '重新激活率40%']
          })
          break
        case '竞争性流失':
          actions.push({
            action: '提供竞争性留存方案',
            priority: 'urgent',
            expectedImpact: 'high',
            implementationTime: '48小时内',
            resources: ['销售总监', '定价团队'],
            successMetrics: ['价格匹配', '独家功能承诺']
          })
          break
      }
    })

    return actions.slice(0, 5) // 返回前5个最重要的措施
  }

  /**
   * 计算预测置信度
   */
  private calculateConfidence(
    metrics: CustomerMetrics,
    factors: ChurnRiskFactors
  ): number {
    let confidence = 0.5 // 基础置信度

    // 数据完整性影响置信度
    if (metrics.totalInteractions > 10) confidence += 0.1
    if (metrics.relationshipDuration > 180) confidence += 0.1

    // 信号强度影响置信度
    if (factors.behavioralFactors.engagementDecline > 0.7 ||
        factors.behavioralFactors.engagementDecline < 0.3) {
      confidence += 0.15 // 明显的信号提高置信度
    }

    // 多重信号确认
    const strongSignals = [
      factors.behavioralFactors.complaintFrequency > 3,
      factors.transactionalFactors.contractNonRenewal,
      factors.relationshipFactors.satisfactionScore < 50,
      factors.relationshipFactors.competitorMentions > 5
    ].filter(Boolean).length

    confidence += strongSignals * 0.05

    return Math.min(0.95, confidence)
  }

  /**
   * 批量预测流失风险
   */
  batchPredict(
    customers: Customer[],
    metricsMap: Map<string, CustomerMetrics>,
    factorsMap: Map<string, ChurnRiskFactors>,
    healthScores?: Map<string, HealthScoreResult>
  ): ChurnPredictionResult[] {
    return customers.map(customer => {
      const metrics = metricsMap.get(customer.id)
      const factors = factorsMap.get(customer.id)
      const healthScore = healthScores?.get(customer.id)

      if (!metrics || !factors) {
        throw new Error(`Missing data for customer ${customer.id}`)
      }

      return this.predictChurn(customer, metrics, factors, healthScore)
    })
  }

  /**
   * 获取高风险客户列表
   */
  getHighRiskCustomers(
    predictions: ChurnPredictionResult[],
    threshold: number = 0.6
  ): ChurnPredictionResult[] {
    return predictions
      .filter(p => p.churnProbability >= threshold)
      .sort((a, b) => b.churnProbability - a.churnProbability)
  }
}

// 导出单例
export const churnPredictionEngine = new ChurnPredictionEngine()