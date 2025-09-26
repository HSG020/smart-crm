import { create } from 'zustand'
import { ScriptTemplate } from '../types'
import { storage } from '../utils/storage'

interface ScriptStore {
  scripts: ScriptTemplate[]
  loading: boolean
  searchTerm: string
  selectedCategory: string
  
  setScripts: (scripts: ScriptTemplate[]) => void
  addScript: (script: ScriptTemplate) => Promise<void>
  updateScript: (script: ScriptTemplate) => Promise<void>
  deleteScript: (id: string) => Promise<void>
  loadScripts: () => Promise<void>
  setSearchTerm: (term: string) => void
  setSelectedCategory: (category: string) => void
  getFilteredScripts: () => ScriptTemplate[]
  getCategories: () => string[]
}

export const useScriptStore = create<ScriptStore>((set, get) => ({
  scripts: [],
  loading: false,
  searchTerm: '',
  selectedCategory: '',

  setScripts: (scripts) => set({ scripts }),

  addScript: async (script) => {
    try {
      await storage.save('scripts', script)
      set((state) => ({ scripts: [...state.scripts, script] }))
    } catch (error) {
      console.error('Failed to add script:', error)
    }
  },

  updateScript: async (script) => {
    try {
      await storage.save('scripts', script)
      set((state) => ({
        scripts: state.scripts.map((s) => s.id === script.id ? script : s)
      }))
    } catch (error) {
      console.error('Failed to update script:', error)
    }
  },

  deleteScript: async (id) => {
    try {
      await storage.delete('scripts', id)
      set((state) => ({
        scripts: state.scripts.filter((s) => s.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete script:', error)
    }
  },

  loadScripts: async () => {
    set({ loading: true })
    try {
      const scripts = await storage.getAll<ScriptTemplate>('scripts')
      set({ scripts, loading: false })
    } catch (error) {
      console.error('Failed to load scripts:', error)
      set({ loading: false })
    }
  },

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  getFilteredScripts: () => {
    const { scripts, searchTerm, selectedCategory } = get()
    let filtered = scripts

    if (selectedCategory) {
      filtered = filtered.filter(script => script.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(script =>
        script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return filtered
  },

  getCategories: () => {
    const { scripts } = get()
    const categories = [...new Set(scripts.map(script => script.category))]
    return categories.sort()
  }
}))

// 初始化默认话术模板
export const initializeDefaultScripts = async () => {
  const defaultScripts: ScriptTemplate[] = [
    {
      id: 'script_1',
      title: '首次电话开场白',
      category: '开场白',
      scenario: '第一次给潜在客户打电话',
      content: `您好，我是[公司名]的[姓名]。

首先感谢您百忙之中接听我的电话。我们是专业的[行业/服务]提供商，注意到您的公司在[具体业务领域]方面很有实力。

我想简单了解一下，您现在在[相关业务场景]方面有什么需求或者遇到什么挑战吗？

我们帮助过很多像您这样的企业解决[具体问题]，如果方便的话，我可以用3-5分钟时间简单介绍一下我们的解决方案。`,
      tags: ['开场白', '首次联系', '电话']
    },
    {
      id: 'script_2', 
      title: '价格异议处理',
      category: '异议处理',
      scenario: '客户觉得价格太高',
      content: `我理解您对价格的关注，这说明您是一个谨慎负责的决策者。

让我们换个角度来看这个投资：
1. 如果不解决这个问题，您每个月的损失可能是多少？
2. 我们的解决方案可以为您节省多少时间和人力成本？
3. 提高的效率能为您带来多少额外收益？

实际上，大部分客户在使用我们的服务3个月后，投资回报率都超过了300%。

我们也有分期付款的方案，可以减轻您的资金压力。您觉得哪种方式更适合？`,
      tags: ['异议处理', '价格', '投资回报']
    },
    {
      id: 'script_3',
      title: '竞争对手比较',
      category: '异议处理', 
      scenario: '客户说其他公司价格更便宜',
      content: `您提到的那家公司确实是我们的同行，我们也很尊重他们。

不过选择供应商，价格只是考虑因素之一。更重要的是：
1. 服务质量 - 我们的客户满意度是98%，而行业平均水平是85%
2. 技术实力 - 我们有专门的研发团队，技术更新更快
3. 售后服务 - 我们提供24小时技术支持，响应时间平均2小时内

便宜的选择可能在后期会产生更多隐性成本。就像买车一样，除了看价格，还要看品质、售后和保值率。

我建议您不妨先试用我们的服务，亲自体验一下差别。`,
      tags: ['竞争对手', '差异化', '价值']
    },
    {
      id: 'script_4',
      title: '跟进未回复客户',
      category: '跟进',
      scenario: '客户之前表示有兴趣但最近没有回复',
      content: `[客户姓名]，您好！

我是[公司]的[姓名]，上周我们聊过关于[具体业务]的事情。

我知道您工作很忙，可能暂时没时间考虑这个项目。不过最近我们又有一些新的想法，可能对您会有帮助。

另外，我们下个月会有一个针对[行业]的优惠活动，现在确定的话可以享受8折优惠。

您现在方便聊5分钟吗？还是我改天再联系您？`,
      tags: ['跟进', '未回复', '优惠']
    },
    {
      id: 'script_5',
      title: '节日问候结合销售',
      category: '节日营销',
      scenario: '节假日期间的问候和销售',
      content: `[客户姓名]，[节日名称]快乐！

新的一年，祝您和您的公司业务蒸蒸日上！

趁着新年的好兆头，我想和您分享一个好消息：我们推出了新年特惠方案，专门为像您这样的优质客户准备的。

这个方案不仅价格有优势，还包含了一些新功能，特别适合您之前提到的[具体需求]。

如果您有兴趣，我可以安排时间详细介绍。这个优惠只到月底，希望不要错过。

再次祝您新年快乐，期待我们新一年的合作！`,
      tags: ['节日', '问候', '特惠']
    },
    {
      id: 'script_6',
      title: '决策人不在场',
      category: '异议处理',
      scenario: '对方说需要和老板或团队商量',
      content: `我完全理解，这样的决策确实需要团队一起讨论。

为了帮助您更好地向同事介绍我们的方案，我可以：
1. 准备一份详细的方案书，包含价格、功能、实施计划
2. 制作一个5分钟的视频演示，展示关键功能
3. 提供一些成功案例，特别是您同行业的案例

另外，如果方便的话，我也可以参加您们的内部讨论会议，直接回答大家的疑问。这样可以避免信息传递过程中的误解。

您觉得哪种方式比较合适？`,
      tags: ['决策', '团队讨论', '支持']
    }
  ]

  const scriptStore = useScriptStore.getState()
  for (const script of defaultScripts) {
    await scriptStore.addScript(script)
  }
}