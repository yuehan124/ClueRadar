import type { Identity, Lead, Stage } from '@/types'

/**
 * 生成「公开互动作业单」。
 * 注意：本工具不产出用户 ID 与私信话术，只产出"去哪、做什么、怎么说"，
 * 由人工在平台内以公开互动方式执行 —— 这是合规触达路径。
 */
export function buildActionSheet(lead: Lead): {
  where: string
  action: string
  angle: string
  script: string
  cautions: string[]
} {
  const stageScript: Record<Stage, string> = {
    awareness:
      '看到你在了解这块，先不推销。整理了一份《XX 选型避坑清单》，里面几个判断标准你先对着看，有问题随时问。',
    research:
      '你问的这个我们做过不少类似 case。有个提醒比较关键：别只看报价，重点看对方给不给落地排期表。需要的话我可以把我们内部的评估清单发你参考。',
    comparison:
      '你在这两家之间纠结，我说个中立视角：稳定性看 SLA 承诺，售后看响应时效写没写进合同。这两个点最能筛掉不靠谱的。方便说下你们现在最卡的是哪块吗？',
    decision:
      '看到你在确认发票和交付周期，这两块我们都能明确给到。为了不耽误你上线，我先把标准交付排期和开票流程整理给你，你对比一下就能判断。',
  }

  const identityHint: Record<Identity, string> = {
    owner: '对话对象大概率是决策人 → 直接给结论和报价区间，少铺垫',
    staff: '对话对象是经办人 → 帮他减少内部汇报成本，提供可转发的材料',
    influencer: '对方可能是影响者/顾问 → 提供结构化对比信息，建立专业信任',
    individual: '暂无组织线索 → 先确认背景（个人还是代表公司），再投入时间',
    peer: '识别为同行，不进入常规跟进流程',
  }

  const cautions: string[] = [
    '仅通过平台公开评论区/回答区互动，不使用私信批量触达',
    '不索取、不存储对方联系方式以外的身份信息，遵守 PIPL 最小必要原则',
    '同一用户 24 小时内只公开互动一次，避免被判定为骚扰',
  ]

  return {
    where: `${platformName(lead.platform)} · 《${lead.contentTitle}》`,
    action:
      lead.stage === 'decision'
        ? '当天公开回答/评论，优先响应（决策期线索，时效性最关键）'
        : '24 小时内公开评论互动，先建立专业印象',
    angle: lead.needSummary,
    script: stageScript[lead.stage],
    cautions,
  }
}

function platformName(p: string): string {
  const map: Record<string, string> = {
    zhihu: '知乎',
    tieba: '贴吧',
    bilibili: 'B站',
    xhs: '小红书',
    wb: '微博',
    dy: '抖音',
    ks: '快手',
  }
  return map[p] ?? p
}

export function identityHintOf(identity: Identity): string {
  const map: Record<Identity, string> = {
    owner: '对话对象大概率是决策人 → 直接给结论和报价区间，少铺垫',
    staff: '对话对象是经办人 → 帮他减少内部汇报成本，提供可转发的材料',
    influencer: '对方可能是影响者/顾问 → 提供结构化对比信息，建立专业信任',
    individual: '暂无组织线索 → 先确认背景（个人还是代表公司），再投入时间',
    peer: '识别为同行，不进入常规跟进流程',
  }
  return map[identity]
}
