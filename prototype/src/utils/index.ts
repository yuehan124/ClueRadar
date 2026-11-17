import type {
  Identity,
  Lead,
  LeadStatus,
  Platform,
  ScoreResult,
  ScoreWeights,
  SignalKind,
  Stage,
} from '@/types'

export const PLATFORM_LABEL: Record<Platform, string> = {
  zhihu: '知乎',
  tieba: '贴吧',
  bilibili: 'B站',
  xhs: '小红书',
  wb: '微博',
  dy: '抖音',
  ks: '快手',
}

export const PLATFORM_COLOR: Record<Platform, string> = {
  zhihu: '#0f88eb',
  tieba: '#3385ff',
  bilibili: '#fb7299',
  xhs: '#ff2442',
  wb: '#e6162d',
  dy: '#170b1a',
  ks: '#ff5000',
}

export const STAGE_LABEL: Record<Stage, string> = {
  awareness: '认知期',
  research: '考察期',
  comparison: '对比期',
  decision: '决策期',
}

export const STAGE_TAG: Record<Stage, string> = {
  awareness: 'info',
  research: 'warning',
  comparison: 'primary',
  decision: 'danger',
}

export const IDENTITY_LABEL: Record<Identity, string> = {
  owner: '企业主/决策人',
  staff: '经办人',
  influencer: '影响者',
  individual: '个人用户',
  peer: '同行/服务商',
}

export const IDENTITY_TAG: Record<Identity, string> = {
  owner: 'danger',
  staff: 'warning',
  influencer: 'primary',
  individual: 'info',
  peer: 'info',
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: '待跟进',
  contacted: '已接触',
  quoted: '已报价',
  won: '已成交',
  lost: '已失效',
}

export const STATUS_TAG: Record<LeadStatus, string> = {
  new: 'primary',
  contacted: 'warning',
  quoted: 'warning',
  won: 'success',
  lost: 'info',
}

export const SIGNAL_LABEL: Record<SignalKind, string> = {
  noise: '噪声词',
  intent: '意向词',
  identity: '身份词',
  stage: '阶段词',
}

export const SIGNAL_TAG: Record<SignalKind, string> = {
  noise: 'info',
  intent: 'danger',
  identity: 'warning',
  stage: 'primary',
}

/** 决策阶段 → 分值 */
export const STAGE_SCORE: Record<Stage, number> = {
  awareness: 30,
  research: 60,
  comparison: 85,
  decision: 100,
}

/** 身份 → 分值 */
export const IDENTITY_SCORE: Record<Identity, number> = {
  owner: 100,
  staff: 85,
  influencer: 60,
  individual: 45,
  peer: 0,
}

export function scoreGrade(total: number): ScoreResult['grade'] {
  if (total >= 85) return 'S'
  if (total >= 70) return 'A'
  if (total >= 50) return 'B'
  return 'C'
}

/**
 * 线索评分：加权归一。
 * score = Σ(weight_i × raw_i) / Σ(weight_i)
 * 无效线索（噪声 / 同行）直接归零。
 */
export function calcScore(lead: Lead, weights: ScoreWeights): ScoreResult {
  const rawMap: Record<keyof ScoreWeights, number> = {
    intent: lead.intentStrength,
    stage: STAGE_SCORE[lead.stage],
    identity: IDENTITY_SCORE[lead.identity],
    specificity: lead.specificity,
    freshness: lead.freshness,
    engagement: lead.engagement,
  }

  const labelMap: Record<keyof ScoreWeights, string> = {
    intent: '意向词强度',
    stage: '决策阶段',
    identity: '身份信号',
    specificity: '需求具体度',
    freshness: '时效性',
    engagement: '互动热度',
  }

  const keys = Object.keys(rawMap) as (keyof ScoreWeights)[]
  const totalWeight = keys.reduce((s, k) => s + (weights[k] || 0), 0) || 1

  const breakdown = keys.map((k) => ({
    key: k,
    label: labelMap[k],
    weight: weights[k],
    raw: Math.round(rawMap[k]),
    contribution: +(((rawMap[k] * weights[k]) / totalWeight) || 0).toFixed(1),
  }))

  const weighted = keys.reduce((s, k) => s + rawMap[k] * weights[k], 0) / totalWeight
  const total = lead.valid ? Math.round(weighted) : 0

  return { total, grade: scoreGrade(total), breakdown }
}

/** 把命中词包进 {原文片段}，用于可解释性高亮 */
export function highlightSnippet(text: string, words: string[]): string {
  let out = escapeHtml(text)
  const unique = [...new Set(words)].filter(Boolean).sort((a, b) => b.length - a.length)
  for (const w of unique) {
    const safe = escapeHtml(w)
    if (!safe) continue
    out = out.split(safe).join(`<span class="hit">${safe}</span>`)
  }
  return out
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 相对时间：3 小时前 */
export function fromNow(iso: string, now = new Date('2026-10-19T09:30:00')): string {
  const t = new Date(iso).getTime()
  const diff = now.getTime() - t
  if (Number.isNaN(t)) return '-'
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return iso.slice(0, 10)
}

export function formatDateTime(iso: string): string {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}

/** 当前本地时间串，格式与 mock 数据的 commentTime 保持一致（避免时区偏移） */
export function nowLocal(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  )
}
