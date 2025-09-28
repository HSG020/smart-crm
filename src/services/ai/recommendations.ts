/**
 * 智能推荐引擎
 * 基于客户数据和行为模式提供个性化推荐
 */

import { Customer } from '../../types'
import { HealthScoreResult } from './healthScore'
import dayjs from 'dayjs'

export type RecommendationType =
  | 'follow-up'      // 跟进建议
  | 'upsell'         // 追加销售
  | 'cross-sell'     // 交叉销售
  | 'retention'      // 挽留措施
  | 'engagement'     // 互动提升
  | 'upgrade'        // 升级建议
  | 'renewal'        // 续约提醒
  | 'referral'       // 转介绍

export interface Recommendation {
  id: string
  type: RecommendationType
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionItems: string[]
  expectedOutcome: string
  confidence: number      // 推荐置信度 (0-1)
  timing: {
    suggestedDate: string
    deadline?: string
    bestTime?: string    // 最佳联系时间
  }
  metrics?: {
    potentialValue: number
    successProbability: number
    effortRequired: 'low' | 'medium' | 'high'
  }
}

export interface RecommendationContext {
  customer: Customer
  healthScore?: HealthScoreResult
  purchaseHistory?: any[]
  communicationHistory?: any[]
  industryTrends?: any
}

/**
 * 智能推荐引擎
 */
export class RecommendationEngine {

  /**
   * 生成客户推荐
   */
  generateRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = []

    // 基于健康度生成推荐
    if (context.healthScore) {
      recommendations.push(...this.healthBasedRecommendations(context))
    }

    // 基于客户状态生成推荐
    recommendations.push(...this.statusBasedRecommendations(context))

    // 基于时间节点生成推荐
    recommendations.push(...this.timeBasedRecommendations(context))

    // 基于行业特征生成推荐
    recommendations.push(...this.industryBasedRecommendations(context))

    // 排序和过滤
    return this.prioritizeRecommendations(recommendations)
  }

  /**
   * 基于健康度的推荐
   */
  private healthBasedRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = []
    const { customer, healthScore } = context

    if (!healthScore) return recommendations

    // 流失风险客户 - 挽留措施
    if (healthScore.predictedChurn > 0.6) {
      recommendations.push({
        id: `retention-${customer.id}`,
        type: 'retention',
        priority: 'high',
        title: '高流失风险 - 立即采取挽留措施',
        description: `${customer.name} 的流失概率达到 ${(healthScore.predictedChurn * 100).toFixed(0)}%，需要立即干预`,
        actionItems: [
          '安排高层拜访，了解客户关切',
          '提供专属优惠或增值服务',
          '分析历史问题，制定改进方案',
          '指派专门客户成功经理'
        ],
        expectedOutcome: '降低流失风险，提升客户满意度',
        confidence: 0.85,
        timing: {
          suggestedDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          deadline: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          bestTime: '10:00-11:00'
        },
        metrics: {
          potentialValue: 100000,
          successProbability: 0.6,
          effortRequired: 'high'
        }
      })
    }

    // 健康客户 - 追加销售
    if (healthScore.level === 'excellent') {
      recommendations.push({
        id: `upsell-${customer.id}`,
        type: 'upsell',
        priority: 'medium',
        title: '追加销售机会',
        description: `${customer.name} 健康度优秀，适合推荐高级产品或服务`,
        actionItems: [
          '分析客户当前使用情况',
          '准备升级方案演示',
          '提供试用或优惠',
          '强调ROI和价值提升'
        ],
        expectedOutcome: '提升客单价20-30%',
        confidence: 0.75,
        timing: {
          suggestedDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
          bestTime: '14:00-16:00'
        },
        metrics: {
          potentialValue: 50000,
          successProbability: 0.7,
          effortRequired: 'medium'
        }
      })
    }

    // 互动不足 - 提升互动
    if (healthScore.factors.engagementScore < 40) {
      recommendations.push({
        id: `engagement-${customer.id}`,
        type: 'engagement',
        priority: 'medium',
        title: '提升客户互动频率',
        description: '客户互动频率低，需要主动创造接触点',
        actionItems: [
          '分享行业洞察报告',
          '邀请参加网络研讨会',
          '安排季度业务回顾',
          '发送个性化内容推荐'
        ],
        expectedOutcome: '互动频率提升50%',
        confidence: 0.8,
        timing: {
          suggestedDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
          bestTime: '09:00-10:00'
        }
      })
    }

    return recommendations
  }

  /**
   * 基于客户状态的推荐
   */
  private statusBasedRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = []
    const { customer } = context

    switch (customer.status) {
      case 'potential':
        recommendations.push({
          id: `convert-${customer.id}`,
          type: 'follow-up',
          priority: 'high',
          title: '推进潜在客户转化',
          description: '潜在客户需要持续跟进以推进销售流程',
          actionItems: [
            '了解决策流程和时间表',
            '识别关键决策者',
            '提供产品演示',
            '发送报价方案'
          ],
          expectedOutcome: '转化为正式客户',
          confidence: 0.7,
          timing: {
            suggestedDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            bestTime: '10:00-11:00'
          },
          metrics: {
            potentialValue: 80000,
            successProbability: 0.5,
            effortRequired: 'high'
          }
        })
        break

      case 'negotiating':
        recommendations.push({
          id: `close-${customer.id}`,
          type: 'follow-up',
          priority: 'high',
          title: '加速成交进程',
          description: '客户处于谈判阶段，需要积极推进成交',
          actionItems: [
            '解决剩余疑虑',
            '提供限时优惠',
            '协调内部资源',
            '准备合同文件'
          ],
          expectedOutcome: '本月内完成签约',
          confidence: 0.8,
          timing: {
            suggestedDate: dayjs().format('YYYY-MM-DD'),
            deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
            bestTime: '14:00-15:00'
          },
          metrics: {
            potentialValue: 150000,
            successProbability: 0.75,
            effortRequired: 'medium'
          }
        })
        break

      case 'signed':
        // 交叉销售机会
        recommendations.push({
          id: `cross-sell-${customer.id}`,
          type: 'cross-sell',
          priority: 'low',
          title: '探索交叉销售机会',
          description: '现有客户可能对其他产品线感兴趣',
          actionItems: [
            '分析使用数据找出需求',
            '推荐互补产品',
            '提供捆绑优惠',
            '安排产品介绍会'
          ],
          expectedOutcome: '增加产品采用率',
          confidence: 0.65,
          timing: {
            suggestedDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
            bestTime: '15:00-16:00'
          },
          metrics: {
            potentialValue: 30000,
            successProbability: 0.4,
            effortRequired: 'low'
          }
        })

        // 转介绍机会
        if (customer.importance === 'high') {
          recommendations.push({
            id: `referral-${customer.id}`,
            type: 'referral',
            priority: 'low',
            title: '请求客户转介绍',
            description: '满意的重要客户是最好的推荐人',
            actionItems: [
              '确认客户满意度',
              '识别潜在推荐对象',
              '提供推荐激励',
              '简化推荐流程'
            ],
            expectedOutcome: '获得2-3个高质量线索',
            confidence: 0.6,
            timing: {
              suggestedDate: dayjs().add(30, 'day').format('YYYY-MM-DD')
            },
            metrics: {
              potentialValue: 200000,
              successProbability: 0.3,
              effortRequired: 'low'
            }
          })
        }
        break

      case 'lost':
        recommendations.push({
          id: `win-back-${customer.id}`,
          type: 'retention',
          priority: 'low',
          title: '赢回流失客户',
          description: '尝试重新激活流失客户',
          actionItems: [
            '了解流失原因',
            '展示产品改进',
            '提供回归优惠',
            '重建信任关系'
          ],
          expectedOutcome: '重新激活客户关系',
          confidence: 0.3,
          timing: {
            suggestedDate: dayjs().add(60, 'day').format('YYYY-MM-DD')
          },
          metrics: {
            potentialValue: 50000,
            successProbability: 0.2,
            effortRequired: 'high'
          }
        })
        break
    }

    return recommendations
  }

  /**
   * 基于时间节点的推荐
   */
  private timeBasedRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = []
    const { customer } = context

    // 生日祝福
    if (customer.birthday) {
      const birthday = dayjs(customer.birthday)
      const today = dayjs()
      const daysUntilBirthday = birthday.month() === today.month()
        ? birthday.date() - today.date()
        : -1

      if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
        recommendations.push({
          id: `birthday-${customer.id}`,
          type: 'engagement',
          priority: 'medium',
          title: '生日关怀',
          description: `${customer.name} 的生日即将到来`,
          actionItems: [
            '发送生日祝福',
            '准备生日礼品',
            '提供专属优惠',
            '安排庆祝活动'
          ],
          expectedOutcome: '增强客户情感连接',
          confidence: 0.95,
          timing: {
            suggestedDate: birthday.format('YYYY-MM-DD'),
            bestTime: '09:00-10:00'
          }
        })
      }
    }

    // 长时间未联系
    if (customer.lastContactDate) {
      const daysSinceContact = dayjs().diff(customer.lastContactDate, 'day')

      if (daysSinceContact > 30 && daysSinceContact <= 60) {
        recommendations.push({
          id: `reactivate-${customer.id}`,
          type: 'follow-up',
          priority: 'medium',
          title: '重新激活客户关系',
          description: `已经 ${daysSinceContact} 天未联系`,
          actionItems: [
            '主动问候和关心',
            '了解最新需求',
            '分享价值内容',
            '预约下次沟通'
          ],
          expectedOutcome: '恢复正常沟通节奏',
          confidence: 0.8,
          timing: {
            suggestedDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            deadline: dayjs().add(3, 'day').format('YYYY-MM-DD')
          }
        })
      }
    }

    // 合同续约提醒
    if (customer.contractEndDate) {
      const daysUntilExpiry = dayjs(customer.contractEndDate).diff(dayjs(), 'day')

      if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
        recommendations.push({
          id: `renewal-${customer.id}`,
          type: 'renewal',
          priority: 'high',
          title: '合同续约提醒',
          description: `合同将在 ${daysUntilExpiry} 天后到期`,
          actionItems: [
            '评估客户满意度',
            '准备续约方案',
            '提供续约激励',
            '协商新条款'
          ],
          expectedOutcome: '成功续约并可能升级',
          confidence: 0.85,
          timing: {
            suggestedDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            deadline: dayjs(customer.contractEndDate).subtract(30, 'day').format('YYYY-MM-DD')
          },
          metrics: {
            potentialValue: 120000,
            successProbability: 0.8,
            effortRequired: 'medium'
          }
        })
      }
    }

    return recommendations
  }

  /**
   * 基于行业的推荐
   */
  private industryBasedRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = []
    const { customer } = context

    // 根据行业特点生成推荐
    switch (customer.industry?.toLowerCase()) {
      case '互联网':
      case '科技':
        recommendations.push({
          id: `tech-upgrade-${customer.id}`,
          type: 'upgrade',
          priority: 'low',
          title: '技术升级建议',
          description: '科技行业客户通常对新技术感兴趣',
          actionItems: [
            '介绍最新产品功能',
            '提供技术培训',
            '分享成功案例',
            '邀请参加技术峰会'
          ],
          expectedOutcome: '提升产品使用深度',
          confidence: 0.7,
          timing: {
            suggestedDate: dayjs().add(7, 'day').format('YYYY-MM-DD')
          }
        })
        break

      case '金融':
      case '银行':
        recommendations.push({
          id: `compliance-${customer.id}`,
          type: 'engagement',
          priority: 'medium',
          title: '合规性更新',
          description: '金融行业客户重视合规和安全',
          actionItems: [
            '分享合规更新',
            '提供安全审计报告',
            '展示认证资质',
            '定期合规检查'
          ],
          expectedOutcome: '增强信任和粘性',
          confidence: 0.8,
          timing: {
            suggestedDate: dayjs().add(14, 'day').format('YYYY-MM-DD')
          }
        })
        break

      case '制造业':
        recommendations.push({
          id: `efficiency-${customer.id}`,
          type: 'upsell',
          priority: 'medium',
          title: '效率提升方案',
          description: '制造业客户关注成本和效率',
          actionItems: [
            '分析当前流程瓶颈',
            '提供优化建议',
            '计算ROI',
            '安排现场考察'
          ],
          expectedOutcome: '降低成本15-20%',
          confidence: 0.65,
          timing: {
            suggestedDate: dayjs().add(10, 'day').format('YYYY-MM-DD')
          },
          metrics: {
            potentialValue: 75000,
            successProbability: 0.5,
            effortRequired: 'high'
          }
        })
        break
    }

    return recommendations
  }

  /**
   * 优先级排序
   */
  private prioritizeRecommendations(recommendations: Recommendation[]): Recommendation[] {
    // 优先级权重
    const priorityWeight = { high: 3, medium: 2, low: 1 }

    // 排序：优先级 * 置信度 * 成功概率
    return recommendations.sort((a, b) => {
      const scoreA = priorityWeight[a.priority] * a.confidence * (a.metrics?.successProbability || 0.5)
      const scoreB = priorityWeight[b.priority] * b.confidence * (b.metrics?.successProbability || 0.5)
      return scoreB - scoreA
    }).slice(0, 10) // 最多返回10个推荐
  }

  /**
   * 获取下一步最佳行动
   */
  getNextBestAction(recommendations: Recommendation[]): Recommendation | null {
    if (recommendations.length === 0) return null

    // 返回优先级最高且时间最紧迫的推荐
    const urgent = recommendations.filter(r => r.priority === 'high')
    if (urgent.length > 0) {
      return urgent.sort((a, b) => {
        const dateA = dayjs(a.timing.suggestedDate)
        const dateB = dayjs(b.timing.suggestedDate)
        return dateA.diff(dateB)
      })[0]
    }

    return recommendations[0]
  }
}

// 导出单例
export const recommendationEngine = new RecommendationEngine()