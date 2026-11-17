/** 平台 */
export type Platform = 'zhihu' | 'tieba' | 'bilibili' | 'xhs' | 'wb' | 'dy' | 'ks'

/** 决策阶段 —— TO B 高客单场景下最核心的字段 */
export type Stage = 'awareness' | 'research' | 'comparison' | 'decision'

/** 提问者身份 */
export type Identity = 'owner' | 'staff' | 'influencer' | 'individual' | 'peer'

/** 线索跟进状态 */
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost'

/** 信号层级：4 层信号体系 */
export type SignalKind = 'noise' | 'intent' | 'identity' | 'stage'

export interface SignalHit {
  /** 命中的词 */
  word: string
  kind: SignalKind
  /** 该词权重 0-100 */
  weight: number
  /** 命中的原文片段 */
  snippet: string
}

export interface LeadActivity {
  id: string
  time: string
  action: string
  operator: string
  note?: string
}

export interface Lead {
  id: string
  platform: Platform
  /** 脱敏后的创作者哈希（对应 MediaCrawler 的 creator_hash） */
  creatorHash: string
  /** 已脱敏昵称，如「程***江」 */
  nickname: string
  /** 评论ID，对应 comment_id */
  commentId: string
  /** 所属内容 */
  contentId: string
  contentTitle: string
  contentUrl: string
  /** 来源关键词，对应 source_keyword */
  sourceKeyword: string
  /** 评论原文 */
  commentText: string
  commentTime: string
  likeCount: number

  /** ===== AI / 规则判定结果 ===== */
  valid: boolean
  invalidReason?: string
  stage: Stage
  identity: Identity
  identityNote?: string
  needSummary: string
  competitors: string[]
  signals: SignalHit[]

  /** ===== 评分输入（0-100），最终分由权重计算 ===== */
  intentStrength: number
  specificity: number
  freshness: number
  engagement: number

  /** ===== 跟进 ===== */
  status: LeadStatus
  owner?: string
  activities: LeadActivity[]
}

export interface ScoreWeights {
  intent: number
  stage: number
  identity: number
  specificity: number
  freshness: number
  engagement: number
}

export interface ScoreBreakdown {
  key: keyof ScoreWeights
  label: string
  weight: number
  /** 该项的原始得分 0-100 */
  raw: number
  /** 加权后贡献的分值 */
  contribution: number
}

export interface ScoreResult {
  total: number
  grade: 'S' | 'A' | 'B' | 'C'
  breakdown: ScoreBreakdown[]
}

/** 词包 */
export interface Keyword {
  id: string
  word: string
  kind: SignalKind
  pack: string
  platforms: Platform[]
  weight: number
  hitCount: number
  enabled: boolean
}

/** 采集任务 */
export interface CrawlTask {
  id: string
  name: string
  packs: string[]
  platforms: Platform[]
  schedule: string
  enabled: boolean
  lastRunAt: string
  crawledCount: number
  newLeadCount: number
  status: 'idle' | 'running' | 'failed'
}

/** LLM / 系统设置 */
export interface SystemSettings {
  llmProvider: string
  llmModel: string
  llmApiKey: string
  llmTemperature: number
  dailyBudget: number
  usedBudget: number
  maxSleepSec: number
  maxConcurrency: number
  crawlerMaxNotes: number
  enableProxy: boolean
  /** 合规：仅公开互动，禁止私信触达 */
  publicInteractionOnly: boolean
}
