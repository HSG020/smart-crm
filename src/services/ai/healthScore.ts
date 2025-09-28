/**
 * 客户健康度评分系统
 * 通过多维度分析计算客户健康度分数
 */

import { Customer } from '../../types'
import dayjs from 'dayjs'

export interface HealthScoreFactors {
  engagementScore: number      // 互动频率分数
  recencyScore: number         // 最近联系分数
  responseScore: number        // 响应率分数
  purchaseScore: number        // 购买力分数
  relationshipScore: number    // 关系深度分数
  riskScore: number           // 风险因素分数
}

export interface HealthScoreResult {
  score: number               // 总分 (0-100)
  level: 'healthy' | 'at-risk' | 'critical' | 'excellent'
  factors: HealthScoreFactors
  recommendations: string[]
  trend: 'improving' | 'stable' | 'declining'
  predictedChurn: number     // 流失概率 (0-1)
}

export interface CustomerMetrics {
  totalInteractions: number
  lastContactDays: number
  avgResponseTime: number
  purchaseHistory: number[]
  relationshipDuration: number
  missedFollowUps: number
  negativeSignals: number
}

/**
 * 计算客户健康度分数
 */
export class HealthScoreCalculator {

  /**
   * 计算单个客户的健康度
   */
  calculateHealthScore(
    customer: Customer,
    metrics: CustomerMetrics
  ): HealthScoreResult {

    // 计算各维度分数
    const factors: HealthScoreFactors = {
      engagementScore: this.calculateEngagementScore(metrics),
      recencyScore: this.calculateRecencyScore(metrics),
      responseScore: this.calculateResponseScore(metrics),
      purchaseScore: this.calculatePurchaseScore(metrics),
      relationshipScore: this.calculateRelationshipScore(customer, metrics),
      riskScore: this.calculateRiskScore(customer, metrics)
    }

    // 权重配置
    const weights = {
      engagementScore: 0.20,
      recencyScore: 0.15,
      responseScore: 0.15,
      purchaseScore: 0.25,
      relationshipScore: 0.15,
      riskScore: 0.10
    }

    // 计算加权总分
    const score = Math.round(
      Object.entries(factors).reduce((total, [key, value]) => {
        return total + value * weights[key as keyof HealthScoreFactors]
      }, 0)
    )

    // 确定健康等级
    const level = this.determineHealthLevel(score)

    // 生成建议
    const recommendations = this.generateRecommendations(factors, customer, metrics)

    // 分析趋势
    const trend = this.analyzeTrend(metrics)

    // 预测流失概率
    const predictedChurn = this.predictChurnProbability(score, factors, metrics)

    return {
      score,
      level,
      factors,
      recommendations,
      trend,
      predictedChurn
    }
  }

  /**
   * 计算互动频率分数
   */
  private calculateEngagementScore(metrics: CustomerMetrics): number {
    const { totalInteractions, relationshipDuration } = metrics

    // 计算月均互动次数
    const monthsActive = Math.max(1, relationshipDuration / 30)
    const avgInteractionsPerMonth = totalInteractions / monthsActive

    // 根据互动频率打分
    if (avgInteractionsPerMonth >= 10) return 100
    if (avgInteractionsPerMonth >= 5) return 80
    if (avgInteractionsPerMonth >= 2) return 60
    if (avgInteractionsPerMonth >= 1) return 40
    return 20
  }

  /**
   * 计算最近联系分数
   */
  private calculateRecencyScore(metrics: CustomerMetrics): number {
    const { lastContactDays } = metrics

    if (lastContactDays <= 7) return 100
    if (lastContactDays <= 14) return 85
    if (lastContactDays <= 30) return 70
    if (lastContactDays <= 60) return 50
    if (lastContactDays <= 90) return 30
    return 10
  }

  /**
   * 计算响应率分数
   */
  private calculateResponseScore(metrics: CustomerMetrics): number {
    const { avgResponseTime } = metrics

    // 响应时间（小时）
    if (avgResponseTime <= 1) return 100
    if (avgResponseTime <= 4) return 85
    if (avgResponseTime <= 12) return 70
    if (avgResponseTime <= 24) return 50
    if (avgResponseTime <= 48) return 30
    return 10
  }

  /**
   * 计算购买力分数
   */
  private calculatePurchaseScore(metrics: CustomerMetrics): number {
    const { purchaseHistory } = metrics

    if (purchaseHistory.length === 0) return 20

    // 计算总购买金额和频率
    const totalAmount = purchaseHistory.reduce((sum, amount) => sum + amount, 0)
    const avgAmount = totalAmount / purchaseHistory.length

    // 根据购买金额和频率评分
    let score = 0

    // 购买频率分数
    if (purchaseHistory.length >= 10) score += 50
    else if (purchaseHistory.length >= 5) score += 35
    else if (purchaseHistory.length >= 2) score += 20
    else score += 10

    // 购买金额分数
    if (avgAmount >= 100000) score += 50
    else if (avgAmount >= 50000) score += 35
    else if (avgAmount >= 10000) score += 20
    else score += 10

    return score
  }

  /**
   * 计算关系深度分数
   */
  private calculateRelationshipScore(customer: Customer, metrics: CustomerMetrics): number {
    const { relationshipDuration } = metrics
    let score = 0

    // 关系时长分数
    if (relationshipDuration >= 365) score += 30
    else if (relationshipDuration >= 180) score += 20
    else if (relationshipDuration >= 90) score += 10
    else score += 5

    // 客户重要性分数
    if (customer.importance === 'high') score += 30
    else if (customer.importance === 'medium') score += 20
    else score += 10

    // 客户状态分数
    if (customer.status === 'signed') score += 40
    else if (customer.status === 'negotiating') score += 30
    else if (customer.status === 'contacted') score += 20
    else score += 10

    return score
  }

  /**
   * 计算风险因素分数（越高越健康）
   */
  private calculateRiskScore(customer: Customer, metrics: CustomerMetrics): number {
    const { missedFollowUps, negativeSignals } = metrics
    let score = 100

    // 错过跟进扣分
    score -= missedFollowUps * 10

    // 负面信号扣分
    score -= negativeSignals * 15

    // 长时间未联系扣分
    if (metrics.lastContactDays > 60) score -= 20

    // 状态风险
    if (customer.status === 'lost') score -= 30

    return Math.max(0, score)
  }

  /**
   * 确定健康等级
   */
  private determineHealthLevel(score: number): HealthScoreResult['level'] {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'healthy'
    if (score >= 40) return 'at-risk'
    return 'critical'
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(
    factors: HealthScoreFactors,
    customer: Customer,
    metrics: CustomerMetrics
  ): string[] {
    const recommendations: string[] = []

    // 基于各项分数生成建议
    if (factors.recencyScore < 50) {
      recommendations.push('立即安排跟进，已超过30天未联系')
    }

    if (factors.engagementScore < 50) {
      recommendations.push('增加互动频率，建议每月至少联系2次')
    }

    if (factors.responseScore < 50) {
      recommendations.push('提高响应速度，客户期望24小时内得到回复')
    }

    if (factors.purchaseScore < 40) {
      recommendations.push('探索交叉销售机会，提升客户价值')
    }

    if (factors.relationshipScore < 40) {
      recommendations.push('深化客户关系，考虑安排面对面会议')
    }

    if (factors.riskScore < 50) {
      recommendations.push('关注风险信号，制定挽留计划')
    }

    // 根据客户状态添加特定建议
    if (customer.status === 'potential') {
      recommendations.push('推进销售流程，转化为正式客户')
    }

    if (metrics.missedFollowUps > 0) {
      recommendations.push(`补充完成${metrics.missedFollowUps}个错过的跟进`)
    }

    return recommendations
  }

  /**
   * 分析健康度趋势
   */
  private analyzeTrend(metrics: CustomerMetrics): HealthScoreResult['trend'] {
    // 简化版：基于最近联系和互动频率判断
    if (metrics.lastContactDays <= 7 && metrics.totalInteractions > 5) {
      return 'improving'
    }
    if (metrics.lastContactDays > 30 || metrics.missedFollowUps > 2) {
      return 'declining'
    }
    return 'stable'
  }

  /**
   * 预测流失概率
   */
  private predictChurnProbability(
    score: number,
    factors: HealthScoreFactors,
    metrics: CustomerMetrics
  ): number {
    // 基础流失概率
    let churnProbability = (100 - score) / 100

    // 风险因素加权
    if (metrics.lastContactDays > 90) churnProbability += 0.2
    if (metrics.missedFollowUps > 3) churnProbability += 0.15
    if (factors.engagementScore < 30) churnProbability += 0.1
    if (factors.responseScore < 30) churnProbability += 0.1

    // 保护因素减权
    if (factors.purchaseScore > 70) churnProbability -= 0.15
    if (factors.relationshipScore > 70) churnProbability -= 0.1

    return Math.min(1, Math.max(0, churnProbability))
  }

  /**
   * 批量计算健康度分数
   */
  calculateBatchHealthScores(
    customers: Customer[],
    metricsMap: Map<string, CustomerMetrics>
  ): Map<string, HealthScoreResult> {
    const results = new Map<string, HealthScoreResult>()

    customers.forEach(customer => {
      const metrics = metricsMap.get(customer.id)
      if (metrics) {
        results.set(customer.id, this.calculateHealthScore(customer, metrics))
      }
    })

    return results
  }

  /**
   * 获取健康度分布统计
   */
  getHealthDistribution(scores: Map<string, HealthScoreResult>) {
    const distribution = {
      excellent: 0,
      healthy: 0,
      atRisk: 0,
      critical: 0
    }

    scores.forEach(result => {
      switch (result.level) {
        case 'excellent':
          distribution.excellent++
          break
        case 'healthy':
          distribution.healthy++
          break
        case 'at-risk':
          distribution.atRisk++
          break
        case 'critical':
          distribution.critical++
          break
      }
    })

    return distribution
  }
}

// 导出单例
export const healthScoreCalculator = new HealthScoreCalculator()