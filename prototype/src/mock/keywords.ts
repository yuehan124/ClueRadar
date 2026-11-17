import type { CrawlTask, Keyword, Platform, SignalKind } from '@/types'

let seq = 0
function kw(
  word: string,
  kind: SignalKind,
  pack: string,
  weight: number,
  hitCount: number,
  platforms: Platform[],
  enabled = true,
): Keyword {
  seq += 1
  return {
    id: `KW-${String(seq).padStart(4, '0')}`,
    word,
    kind,
    pack,
    weight,
    hitCount,
    platforms,
    enabled,
  }
}

const TO_B: Platform[] = ['zhihu', 'tieba', 'bilibili']
const ALL: Platform[] = ['zhihu', 'tieba', 'bilibili', 'xhs', 'wb', 'dy', 'ks']

export const DEMO_KEYWORDS: Keyword[] = [
  // ---------- 第 1 层：噪声词（先砍掉 80%） ----------
  kw('学习了', 'noise', '通用噪声词', 90, 1284, ALL),
  kw('感谢分享', 'noise', '通用噪声词', 85, 976, ALL),
  kw('沙发', 'noise', '通用噪声词', 95, 412, ALL),
  kw('收藏了', 'noise', '通用噪声词', 70, 655, ALL),
  kw('码住', 'noise', '通用噪声词', 70, 233, ALL),
  kw('哈哈', 'noise', '通用噪声词', 60, 812, ALL),
  kw('需要的可以找我', 'noise', '同行广告词', 80, 96, ALL),
  kw('推荐我们家', 'noise', '同行广告词', 95, 74, ALL),
  kw('欢迎咨询', 'noise', '同行广告词', 75, 121, ALL),

  // ---------- 第 2 层：意向词 ----------
  kw('有推荐的吗', 'intent', '求供应商', 90, 216, ALL),
  kw('求推荐', 'intent', '求供应商', 85, 341, ALL),
  kw('有没有做', 'intent', '求供应商', 80, 188, TO_B),
  kw('厂家推荐', 'intent', '求供应商', 90, 67, TO_B),
  kw('找个外包', 'intent', '求供应商', 78, 92, ALL),
  kw('有能做的吗', 'intent', '求供应商', 90, 143, ALL),
  kw('怎么选', 'intent', '比价选型', 80, 264, ALL),
  kw('哪个更好', 'intent', '比价选型', 78, 197, ALL),
  kw('想换家', 'intent', '比价选型', 85, 48, ALL),
  kw('横向测评', 'intent', '比价选型', 70, 39, TO_B),
  kw('报价多少', 'intent', '预算咨询', 90, 158, ALL),
  kw('预算', 'intent', '预算咨询', 85, 402, ALL),
  kw('大概多少钱', 'intent', '预算咨询', 75, 311, ALL),
  kw('交付周期', 'intent', '采购流程', 85, 76, ALL),
  kw('能做到吗', 'intent', '能力确认', 72, 118, ALL),
  kw('有没有案例', 'intent', '能力确认', 70, 134, ALL),

  // ---------- 第 3 层：身份词（TO B 最高价值） ----------
  kw('我们公司', 'identity', '组织身份', 90, 187, ALL),
  kw('我们厂', 'identity', '组织身份', 95, 43, ['tieba', 'ks', 'dy']),
  kw('我们店', 'identity', '组织身份', 85, 96, ['xhs', 'dy', 'ks']),
  kw('我们部门', 'identity', '组织身份', 80, 112, ALL),
  kw('我负责', 'identity', '决策权', 90, 64, ALL),
  kw('老板让我', 'identity', '决策权', 90, 28, ALL),
  kw('我们团队', 'identity', '组织身份', 80, 87, ALL),
  kw('招聘', 'identity', '业务信号', 60, 205, ALL),
  kw('从 0 到 1', 'identity', '业务信号', 55, 143, ALL),

  // ---------- 第 4 层：阶段词（判断决策进度） ----------
  kw('是什么', 'stage', '认知期', 30, 421, ALL),
  kw('有必要吗', 'stage', '认知期', 32, 178, ALL),
  kw('了解一下', 'stage', '考察期', 55, 264, ALL),
  kw('怎么比较', 'stage', '对比期', 80, 92, ALL),
  kw('和哪个好', 'stage', '对比期', 82, 76, ALL),
  kw('能开专票', 'stage', '决策期', 95, 34, TO_B),
  kw('走招标', 'stage', '决策期', 92, 21, TO_B),
  kw('下个月就要', 'stage', '决策期', 88, 47, ALL),
  kw('尽快', 'stage', '决策期', 72, 139, ALL),
  kw('比较急', 'stage', '决策期', 80, 58, ALL),
]

export const DEMO_PACKS = [
  { name: '通用噪声词', desc: '先过滤无效互动与同行广告，降低人工跟进成本' },
  { name: '同行广告词', desc: '识别自荐服务商，避免把同行当客户跟进' },
  { name: '求供应商', desc: '明确的采购意图表达，价值最高' },
  { name: '比价选型', desc: '正在做供应商对比，处于转化黄金期' },
  { name: '预算咨询', desc: '有预算概念，付费意愿明确' },
  { name: '采购流程', desc: '关注发票/合同/交付，已进入商务阶段' },
  { name: '能力确认', desc: '在做供应商能力评估' },
  { name: '组织身份', desc: '出现企业主体线索，判断是否为真实采购方' },
  { name: '决策权', desc: '判断提问者是否具备决策或推动能力' },
  { name: '业务信号', desc: '间接机会：招人、起号等组织动作' },
  { name: '认知期', desc: '仍在扫盲，优先级低' },
  { name: '考察期', desc: '开始建立候选池' },
  { name: '对比期', desc: '正在做最终选择' },
  { name: '决策期', desc: '临门一脚，当天跟进' },
]

export const DEMO_TASKS: CrawlTask[] = [
  {
    id: 'TASK-01',
    name: '知乎 · 代运营需求监听',
    packs: ['求供应商', '比价选型', '预算咨询', '组织身份'],
    platforms: ['zhihu'],
    schedule: '每 2 小时',
    enabled: true,
    lastRunAt: '2026-10-19T08:00:00',
    crawledCount: 486,
    newLeadCount: 7,
    status: 'idle',
  },
  {
    id: 'TASK-02',
    name: '贴吧 · 制造业 ERP 线索',
    packs: ['求供应商', '组织身份', '决策期'],
    platforms: ['tieba'],
    schedule: '每天 09:00',
    enabled: true,
    lastRunAt: '2026-10-19T09:00:00',
    crawledCount: 213,
    newLeadCount: 3,
    status: 'idle',
  },
  {
    id: 'TASK-03',
    name: 'B站 · 企业服务意向',
    packs: ['求供应商', '能力确认', '采购流程'],
    platforms: ['bilibili'],
    schedule: '每 6 小时',
    enabled: true,
    lastRunAt: '2026-10-19T06:00:00',
    crawledCount: 158,
    newLeadCount: 2,
    status: 'idle',
  },
  {
    id: 'TASK-04',
    name: '小红书 · 本地生活商家',
    packs: ['比价选型', '组织身份', '预算咨询'],
    platforms: ['xhs'],
    schedule: '每天 10:00',
    enabled: true,
    lastRunAt: '2026-10-18T10:00:00',
    crawledCount: 342,
    newLeadCount: 4,
    status: 'running',
  },
  {
    id: 'TASK-05',
    name: '微博 · 财税代理需求',
    packs: ['求供应商', '组织身份'],
    platforms: ['wb'],
    schedule: '每 12 小时',
    enabled: false,
    lastRunAt: '2026-10-18T21:00:00',
    crawledCount: 97,
    newLeadCount: 0,
    status: 'idle',
  },
  {
    id: 'TASK-06',
    name: '抖音 · 获客成本话题',
    packs: ['预算咨询', '通用噪声词'],
    platforms: ['dy'],
    schedule: '每天 12:00',
    enabled: true,
    lastRunAt: '2026-10-19T12:00:00',
    crawledCount: 1204,
    newLeadCount: 1,
    status: 'failed',
  },
]
