import { defineStore } from 'pinia'
import type {
  Identity,
  Lead,
  LeadStatus,
  Platform,
  ScoreResult,
  ScoreWeights,
  Stage,
} from '@/types'
import { calcScore, nowLocal, PLATFORM_LABEL } from '@/utils'
import { DEMO_LEADS } from '@/mock/leads'

export interface ScoredLead {
  lead: Lead
  score: ScoreResult
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  intent: 30,
  stage: 25,
  identity: 20,
  specificity: 10,
  freshness: 10,
  engagement: 5,
}

export const useLeadStore = defineStore('leads', {
  state: () => ({
    leads: clone(DEMO_LEADS) as Lead[],
    weights: { ...DEFAULT_WEIGHTS } as ScoreWeights,
    filters: {
      platform: [] as Platform[],
      stage: [] as Stage[],
      identity: [] as Identity[],
      status: [] as LeadStatus[],
      minScore: 0,
      keyword: '',
      onlyValid: true,
    },
    currentPage: 1,
    pageSize: 10,
  }),

  getters: {
    /** 全部线索 + 实时评分 */
    scored(state): ScoredLead[] {
      return state.leads
        .map((lead) => ({ lead, score: calcScore(lead, state.weights) }))
        .sort((a, b) => b.score.total - a.score.total)
    },

    /** 应用筛选后的线索 */
    filtered(): ScoredLead[] {
      const f = this.filters
      const kw = f.keyword.trim().toLowerCase()
      return this.scored.filter(({ lead, score }) => {
        if (f.onlyValid && !lead.valid) return false
        if (f.platform.length && !f.platform.includes(lead.platform)) return false
        if (f.stage.length && !f.stage.includes(lead.stage)) return false
        if (f.identity.length && !f.identity.includes(lead.identity)) return false
        if (f.status.length && !f.status.includes(lead.status)) return false
        if (score.total < f.minScore) return false
        if (kw) {
          const hay = [
            lead.commentText,
            lead.needSummary,
            lead.contentTitle,
            lead.sourceKeyword,
            lead.nickname,
            ...lead.competitors,
          ]
            .join(' ')
            .toLowerCase()
          if (!hay.includes(kw)) return false
        }
        return true
      })
    },

    paged(): ScoredLead[] {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filtered.slice(start, start + this.pageSize)
    },

    /** 概览 KPI */
    stats(): {
      todayNew: number
      highValue: number
      pending: number
      validCount: number
      noiseCount: number
      avgScore: number
      conversionRate: number
    } {
      const all = this.scored
      const valid = all.filter((s) => s.lead.valid)
      const todayNew = valid.filter(
        (s) => new Date(s.lead.commentTime).getTime() >= new Date('2026-10-19T00:00:00').getTime(),
      ).length
      const highValue = valid.filter((s) => s.score.grade === 'S' || s.score.grade === 'A').length
      const pending = valid.filter((s) => s.lead.status === 'new').length
      const won = valid.filter((s) => s.lead.status === 'won').length
      const touched = valid.filter((s) => s.lead.status !== 'new').length
      const avgScore = valid.length
        ? Math.round(valid.reduce((s, x) => s + x.score.total, 0) / valid.length)
        : 0

      return {
        todayNew,
        highValue,
        pending,
        validCount: valid.length,
        noiseCount: all.length - valid.length,
        avgScore,
        conversionRate: touched ? Math.round((won / touched) * 100) : 0,
      }
    },

    /** 今日线索播报：S/A 级、未跟进的排前面 */
    briefing(): ScoredLead[] {
      return this.scored
        .filter((s) => s.lead.valid && s.score.total >= 65)
        .sort((a, b) => {
          const rank = (x: ScoredLead) => (x.lead.status === 'new' ? 0 : 1)
          return rank(a) - rank(b) || b.score.total - a.score.total
        })
        .slice(0, 6)
    },

    stageFunnel(): { stage: Stage; label: string; count: number; avgScore: number }[] {
      const defs: { stage: Stage; label: string }[] = [
        { stage: 'awareness', label: '认知期' },
        { stage: 'research', label: '考察期' },
        { stage: 'comparison', label: '对比期' },
        { stage: 'decision', label: '决策期' },
      ]
      return defs.map((d) => {
        const hit = this.scored.filter((s) => s.lead.valid && s.lead.stage === d.stage)
        return {
          ...d,
          count: hit.length,
          avgScore: hit.length
            ? Math.round(hit.reduce((s, x) => s + x.score.total, 0) / hit.length)
            : 0,
        }
      })
    },

    platformStats(): { platform: Platform; label: string; count: number; avgScore: number; leads: number }[] {
      const map = new Map<Platform, { count: number; sum: number; leads: number }>()
      this.scored.forEach(({ lead, score }) => {
        const cur = map.get(lead.platform) ?? { count: 0, sum: 0, leads: 0 }
        cur.count += 1
        cur.sum += score.total
        if (lead.valid) cur.leads += 1
        map.set(lead.platform, cur)
      })
      return [...map.entries()]
        .map(([platform, v]) => ({
          platform,
          label: PLATFORM_LABEL[platform],
          count: v.count,
          leads: v.leads,
          avgScore: v.count ? Math.round(v.sum / v.count) : 0,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
    },

    /** 需求主题分布（按来源关键词归集） */
    needTopics(): { topic: string; count: number; highValue: number; avgScore: number }[] {
      const map = new Map<string, { count: number; high: number; sum: number }>()
      this.scored
        .filter((s) => s.lead.valid)
        .forEach(({ lead, score }) => {
          const key = lead.sourceKeyword || '未分类'
          const cur = map.get(key) ?? { count: 0, high: 0, sum: 0 }
          cur.count += 1
          cur.sum += score.total
          if (score.grade === 'S' || score.grade === 'A') cur.high += 1
          map.set(key, cur)
        })
      return [...map.entries()]
        .map(([topic, v]) => ({
          topic,
          count: v.count,
          highValue: v.high,
          avgScore: Math.round(v.sum / v.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    },

    /** 竞品提及统计 */
    competitorStats(): { name: string; count: number }[] {
      const map = new Map<string, number>()
      this.scored.forEach(({ lead }) => {
        lead.competitors.forEach((c) => map.set(c, (map.get(c) ?? 0) + 1))
      })
      return [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    },

    /** 来源关键词 ROI */
    keywordRoi(): {
      keyword: string
      leads: number
      highValue: number
      avgScore: number
      won: number
    }[] {
      const map = new Map<string, { leads: number; high: number; sum: number; won: number }>()
      this.scored
        .filter((s) => s.lead.valid)
        .forEach(({ lead, score }) => {
          const cur = map.get(lead.sourceKeyword) ?? { leads: 0, high: 0, sum: 0, won: 0 }
          cur.leads += 1
          cur.sum += score.total
          if (score.grade === 'S' || score.grade === 'A') cur.high += 1
          if (lead.status === 'won') cur.won += 1
          map.set(lead.sourceKeyword, cur)
        })
      return [...map.entries()]
        .map(([keyword, v]) => ({
          keyword,
          leads: v.leads,
          highValue: v.high,
          avgScore: Math.round(v.sum / v.leads),
          won: v.won,
        }))
        .sort((a, b) => b.highValue - a.highValue || b.avgScore - a.avgScore)
    },

    statusBoard(): { status: LeadStatus; count: number }[] {
      const defs: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost']
      return defs.map((status) => ({
        status,
        count: this.scored.filter((s) => s.lead.valid && s.lead.status === status).length,
      }))
    },

    byId: (state) => (id: string) => {
      const lead = state.leads.find((l) => l.id === id)
      if (!lead) return null
      return { lead, score: calcScore(lead, state.weights) } as ScoredLead
    },
  },

  actions: {
    setStatus(id: string, status: LeadStatus, note?: string) {
      const lead = this.leads.find((l) => l.id === id)
      if (!lead) return
      const from = lead.status
      lead.status = status
      lead.activities.push({
        id: `a_${Date.now()}`,
        time: nowLocal(),
        action: '状态变更',
        operator: lead.owner ?? '当前用户',
        note: `状态：${from} → ${status}${note ? `；${note}` : ''}`,
      })
    },

    addActivity(id: string, note: string, action = '添加跟进') {
      const lead = this.leads.find((l) => l.id === id)
      if (!lead) return
      lead.activities.push({
        id: `a_${Date.now()}`,
        time: nowLocal(),
        action,
        operator: lead.owner ?? '当前用户',
        note,
      })
    },

    assignOwner(id: string, owner: string) {
      const lead = this.leads.find((l) => l.id === id)
      if (!lead) return
      const from = lead.owner
      lead.owner = owner
      lead.activities.push({
        id: `a_${Date.now()}`,
        time: nowLocal(),
        action: '分配负责人',
        operator: '当前用户',
        note: `负责人：${from || '未分配'} → ${owner}`,
      })
    },

    resetFilters() {
      this.filters = {
        platform: [],
        stage: [],
        identity: [],
        status: [],
        minScore: 0,
        keyword: '',
        onlyValid: true,
      }
      this.currentPage = 1
    },

    resetWeights() {
      this.weights = { ...DEFAULT_WEIGHTS }
    },

    resetDemoData() {
      this.leads = clone(DEMO_LEADS)
      this.resetWeights()
      this.resetFilters()
    },
  },
})
