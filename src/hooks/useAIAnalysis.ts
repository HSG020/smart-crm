/**
 * AI分析系统的React Hook
 * 整合健康度评分、智能推荐、流失预警等功能
 */

import { useState, useEffect, useCallback } from 'react'
import { Customer } from '../types'
import { useCustomerStore } from '../store/customerStore'
import { useCommunicationStore } from '../store/communicationStore'
import { useReminderStore } from '../store/reminderStore'
import {
  healthScoreCalculator,
  HealthScoreResult,
  CustomerMetrics
} from '../services/ai/healthScore'
import {
  recommendationEngine,
  Recommendation
} from '../services/ai/recommendations'
import {
  churnPredictionEngine,
  ChurnPredictionResult,
  ChurnRiskFactors
} from '../services/ai/churnPrediction'
import dayjs from 'dayjs'

export interface AIAnalysisState {
  healthScores: Map<string, HealthScoreResult>
  recommendations: Map<string, Recommendation[]>
  churnPredictions: ChurnPredictionResult[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

export interface AIAnalysisSummary {
  totalCustomers: number
  averageHealthScore: number
  healthDistribution: {
    excellent: number
    healthy: number
    atRisk: number
    critical: number
  }
  topRecommendations: Recommendation[]
  highRiskCustomers: ChurnPredictionResult[]
  churnRiskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

/**
 * 使用AI分析系统
 */
export function useAIAnalysis() {
  const { customers } = useCustomerStore()
  const { communications } = useCommunicationStore()
  const { reminders } = useReminderStore()

  const [state, setState] = useState<AIAnalysisState>({
    healthScores: new Map(),
    recommendations: new Map(),
    churnPredictions: [],
    loading: false,
    error: null,
    lastUpdated: null
  })

  /**
   * 生成客户指标数据
   */
  const generateCustomerMetrics = useCallback((customer: Customer): CustomerMetrics => {
    // 获取客户相关的沟通记录
    const customerComms = communications.filter(c => c.customerId === customer.id)

    // 获取客户相关的提醒
    const customerReminders = reminders.filter(r => r.customerId === customer.id)

    // 计算最后联系天数
    const lastContactDays = customer.lastContactDate
      ? dayjs().diff(customer.lastContactDate, 'day')
      : 999

    // 计算平均响应时间（模拟数据）
    const avgResponseTime = Math.random() * 48 // 0-48小时

    // 计算错过的跟进次数
    const missedFollowUps = customerReminders.filter(r =>
      r.status === 'overdue' ||
      (r.status === 'pending' && dayjs(r.remindDate).isBefore(dayjs()))
    ).length

    // 生成模拟购买历史
    const purchaseHistory: number[] = []
    if (customer.status === 'signed') {
      const purchaseCount = Math.floor(Math.random() * 10) + 1
      for (let i = 0; i < purchaseCount; i++) {
        purchaseHistory.push(Math.random() * 100000 + 10000)
      }
    }

    // 计算关系持续时间
    const relationshipDuration = customer.createdAt
      ? dayjs().diff(customer.createdAt, 'day')
      : 30

    return {
      totalInteractions: customerComms.length,
      lastContactDays,
      avgResponseTime,
      purchaseHistory,
      relationshipDuration,
      missedFollowUps,
      negativeSignals: Math.floor(Math.random() * 3) // 模拟负面信号
    }
  }, [communications, reminders])

  /**
   * 生成风险因素数据
   */
  const generateRiskFactors = useCallback((
    customer: Customer,
    metrics: CustomerMetrics
  ): ChurnRiskFactors => {
    // 模拟生成风险因素数据
    return {
      behavioralFactors: {
        engagementDecline: Math.random() * 0.5,
        responseTimeIncrease: Math.random() * 0.3,
        complaintFrequency: Math.floor(Math.random() * 3),
        supportTickets: Math.floor(Math.random() * 5)
      },
      transactionalFactors: {
        purchaseFrequencyDecline: Math.random() * 0.4,
        averageOrderValueDecline: Math.random() * 0.3,
        paymentDelays: Math.floor(Math.random() * 3),
        contractNonRenewal: Math.random() > 0.8
      },
      relationshipFactors: {
        satisfactionScore: 60 + Math.random() * 40, // 60-100
        npsScore: 20 + Math.random() * 80, // 20-100
        keyContactChanges: Math.floor(Math.random() * 2),
        competitorMentions: Math.floor(Math.random() * 4)
      },
      externalFactors: {
        industryVolatility: Math.random() * 0.5,
        economicIndicators: Math.random() * 0.5,
        seasonalFactors: Math.random() * 0.3
      }
    }
  }, [])

  /**
   * 运行完整的AI分析
   */
  const runAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const healthScores = new Map<string, HealthScoreResult>()
      const recommendations = new Map<string, Recommendation[]>()
      const churnPredictions: ChurnPredictionResult[] = []

      // 为每个客户运行分析
      for (const customer of customers) {
        // 生成指标和风险因素
        const metrics = generateCustomerMetrics(customer)
        const riskFactors = generateRiskFactors(customer, metrics)

        // 计算健康度评分
        const healthScore = healthScoreCalculator.calculateHealthScore(customer, metrics)
        healthScores.set(customer.id, healthScore)

        // 生成推荐
        const customerRecommendations = recommendationEngine.generateRecommendations({
          customer,
          healthScore,
          purchaseHistory: metrics.purchaseHistory,
          communicationHistory: communications.filter(c => c.customerId === customer.id)
        })
        recommendations.set(customer.id, customerRecommendations)

        // 预测流失风险
        const churnPrediction = churnPredictionEngine.predictChurn(
          customer,
          metrics,
          riskFactors,
          healthScore
        )
        churnPredictions.push(churnPrediction)
      }

      setState({
        healthScores,
        recommendations,
        churnPredictions,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '分析失败'
      }))
    }
  }, [customers, communications, generateCustomerMetrics, generateRiskFactors])

  /**
   * 获取分析摘要
   */
  const getSummary = useCallback((): AIAnalysisSummary => {
    const { healthScores, recommendations, churnPredictions } = state

    // 计算平均健康度分数
    let totalScore = 0
    const healthDistribution = {
      excellent: 0,
      healthy: 0,
      atRisk: 0,
      critical: 0
    }

    healthScores.forEach(score => {
      totalScore += score.score
      switch (score.level) {
        case 'excellent':
          healthDistribution.excellent++
          break
        case 'healthy':
          healthDistribution.healthy++
          break
        case 'at-risk':
          healthDistribution.atRisk++
          break
        case 'critical':
          healthDistribution.critical++
          break
      }
    })

    const averageHealthScore = healthScores.size > 0
      ? Math.round(totalScore / healthScores.size)
      : 0

    // 获取顶级推荐
    const allRecommendations: Recommendation[] = []
    recommendations.forEach(recs => {
      allRecommendations.push(...recs)
    })
    const topRecommendations = allRecommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 10)

    // 获取高风险客户
    const highRiskCustomers = churnPredictions
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
      .sort((a, b) => b.churnProbability - a.churnProbability)
      .slice(0, 10)

    // 计算流失风险分布
    const churnRiskDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    churnPredictions.forEach(prediction => {
      churnRiskDistribution[prediction.riskLevel]++
    })

    return {
      totalCustomers: customers.length,
      averageHealthScore,
      healthDistribution,
      topRecommendations,
      highRiskCustomers,
      churnRiskDistribution
    }
  }, [state, customers.length])

  /**
   * 获取单个客户的AI分析
   */
  const getCustomerAnalysis = useCallback((customerId: string) => {
    return {
      healthScore: state.healthScores.get(customerId),
      recommendations: state.recommendations.get(customerId) || [],
      churnPrediction: state.churnPredictions.find(p => p.customerId === customerId)
    }
  }, [state])

  /**
   * 初始加载时运行分析
   */
  useEffect(() => {
    if (customers.length > 0 && state.healthScores.size === 0) {
      runAnalysis()
    }
  }, [customers.length, state.healthScores.size, runAnalysis])

  return {
    ...state,
    runAnalysis,
    getSummary,
    getCustomerAnalysis
  }
}