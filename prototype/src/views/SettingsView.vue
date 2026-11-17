<template>
  <div>
    <div class="grid grid-2">
      <!-- 评分权重 -->
      <div class="panel">
        <div class="panel-title">
          线索评分权重
          <el-button link type="primary" size="small" @click="leadStore.resetWeights()">恢复默认</el-button>
        </div>

        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 14px"
          title="TO B 高客单场景下，身份信号与决策阶段应占更高权重；TO C 走量场景则相反"
        />

        <div v-for="w in weightFields" :key="w.key" class="weight-row">
          <div class="weight-head">
            <span>{{ w.label }}</span>
            <span class="muted mono" style="font-size: 12px">
              {{ weights[w.key] }} · {{ pct(w.key) }}%
            </span>
          </div>
          <el-slider
            :model-value="weights[w.key]"
            :min="0"
            :max="50"
            :step="1"
            @update:model-value="(v: number) => (weights[w.key] = v)"
          />
        </div>
      </div>

      <!-- 实时预览 -->
      <div class="panel">
        <div class="panel-title">
          排序实时预览
          <span class="muted">调整左侧权重，排名立刻变化</span>
        </div>

        <div v-for="(item, idx) in preview" :key="item.id" class="preview-row">
          <div class="rank-badge" :class="{ top1: idx === 0 }">{{ idx + 1 }}</div>
          <div style="flex: 1; min-width: 0">
            <div style="font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
              {{ item.summary }}
            </div>
            <div class="muted" style="font-size: 11.5px">
              {{ item.platform }} · {{ item.stage }}
            </div>
          </div>
          <div style="text-align: right; flex: none">
            <div class="mono" style="font-weight: 700; font-size: 15px">{{ item.total }}</div>
            <el-tag v-if="item.delta > 0" type="success" size="small" effect="plain">
              ↑{{ item.delta }}
            </el-tag>
            <el-tag v-else-if="item.delta < 0" type="danger" size="small" effect="plain">
              ↓{{ -item.delta }}
            </el-tag>
            <el-tag v-else type="info" size="small" effect="plain">—</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 模型 -->
    <div class="panel" style="margin-top: 14px">
      <div class="panel-title">
        AI 意向识别模型
        <span class="muted">负责输出阶段、身份、需求摘要与可解释依据</span>
      </div>
      <el-form :model="s" label-width="118px" style="max-width: 720px">
        <el-form-item label="模型服务商">
          <el-select v-model="s.llmProvider" style="width: 220px" @change="onProviderChange">
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="阿里通义千问" value="qwen" />
            <el-option label="OpenAI" value="openai" />
            <el-option label="本地部署（vLLM）" value="local" />
          </el-select>
          <span class="muted" style="margin-left: 10px; font-size: 12px">
            建议：小模型初筛 + 大模型精判，成本可降一个数量级
          </span>
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="s.llmModel" style="width: 320px" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="s.llmApiKey" type="password" show-password style="width: 320px" />
        </el-form-item>
        <el-form-item label="温度">
          <el-slider v-model="s.llmTemperature" :min="0" :max="1" :step="0.1" :show-tooltip="false" style="width: 320px" />
          <span class="muted" style="margin-left: 10px; font-size: 12px">{{ s.llmTemperature }}</span>
        </el-form-item>
        <el-form-item label="每日预算">
          <el-input-number v-model="s.dailyBudget" :min="1" :max="1000" />
          <span class="muted" style="margin-left: 12px; font-size: 12px">
            今日已用 ¥{{ s.usedBudget }}（{{ sysStore.budgetUsedPct }}%）
          </span>
        </el-form-item>
        <el-form-item label="">
          <el-progress :percentage="sysStore.budgetUsedPct" :stroke-width="10" style="width: 420px" />
        </el-form-item>
      </el-form>
    </div>

    <div class="grid grid-2" style="margin-top: 14px">
      <!-- 采集策略 -->
      <div class="panel">
        <div class="panel-title">
          采集策略
          <span class="muted">映射到 MediaCrawler 的 config/base_config.py</span>
        </div>
        <el-form :model="s" label-width="150px">
          <el-form-item label="请求间隔(秒)">
            <el-input-number v-model="s.maxSleepSec" :min="0" :max="60" :step="0.5" />
            <div class="muted" style="font-size: 11.5px; margin-top: 3px">
              CRAWLER_MAX_SLEEP_SEC
            </div>
          </el-form-item>
          <el-form-item label="并发数">
            <el-input-number v-model="s.maxConcurrency" :min="1" :max="10" />
            <span class="muted" style="font-size: 11.5px; margin-left: 8px">MAX_CONCURRENCY_NUM</span>
          </el-form-item>
          <el-form-item label="单任务最大条数">
            <el-input-number v-model="s.crawlerMaxNotes" :min="1" :max="200" />
            <span class="muted" style="font-size: 11.5px; margin-left: 8px">CRAWLER_MAX_NOTES_COUNT</span>
          </el-form-item>
          <el-form-item label="启用 IP 代理">
            <el-switch v-model="s.enableProxy" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 合规 -->
      <div class="panel">
        <div class="panel-title">
          合规策略
          <el-tag type="success" size="small" effect="light">重要</el-tag>
        </div>

        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 14px"
          title="本工具的数据源为脱敏版 MediaCrawler：不落库用户 ID、主页链接、头像、签名等可识别字段，昵称中间脱敏"
        />

        <div class="compliance-item">
          <div style="flex: 1">
            <div style="font-weight: 500">仅公开互动模式</div>
            <div class="muted" style="font-size: 12px; margin-top: 3px">
              禁止私信/批量触达，只产出「去哪条内容下公开回复」的作业单，由人工执行。
              关闭后将失去合规保护。
            </div>
          </div>
          <el-switch v-model="s.publicInteractionOnly" />
        </div>

        <el-divider style="margin: 14px 0" />

        <div class="compliance-item">
          <div style="flex: 1">
            <div style="font-weight: 500">线索留存期限</div>
            <div class="muted" style="font-size: 12px; margin-top: 3px">
              超过期限自动匿名化处理，遵循 PIPL 最小必要原则
            </div>
          </div>
          <el-select model-value="90 天" size="small" style="width: 110px">
            <el-option label="30 天" value="30 天" />
            <el-option label="90 天" value="90 天" />
            <el-option label="180 天" value="180 天" />
          </el-select>
        </div>

        <el-divider style="margin: 14px 0" />

        <div class="risk-note">
          <el-icon style="vertical-align: -2px"><WarningFilled /></el-icon>
          风险提示：脱离脱敏层采集用户身份并用于批量触达，将同时违反 MediaCrawler 的非商业学习许可、
          平台用户协议与《个人信息保护法》，请勿开启。
        </div>
      </div>
    </div>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end">
      <el-button type="primary" :disabled="!sysStore.dirty" @click="save">保存设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import type { ScoreWeights } from '@/types'
import { useLeadStore } from '@/stores/leads'
import { useSystemStore } from '@/stores/system'
import { calcScore, IDENTITY_LABEL, PLATFORM_LABEL, STAGE_LABEL } from '@/utils'

const leadStore = useLeadStore()
const sysStore = useSystemStore()
const { weights } = storeToRefs(leadStore)
const { settings: s } = storeToRefs(sysStore)

const DEFAULT_W: ScoreWeights = {
  intent: 30,
  stage: 25,
  identity: 20,
  specificity: 10,
  freshness: 10,
  engagement: 5,
}

const weightFields: { key: keyof ScoreWeights; label: string }[] = [
  { key: 'intent', label: '意向词强度' },
  { key: 'stage', label: '决策阶段' },
  { key: 'identity', label: '身份信号' },
  { key: 'specificity', label: '需求具体度' },
  { key: 'freshness', label: '时效性' },
  { key: 'engagement', label: '互动热度' },
]

const totalWeight = computed(() =>
  weightFields.reduce((sum, f) => sum + weights.value[f.key], 0) || 1,
)

function pct(key: keyof ScoreWeights) {
  return Math.round((weights.value[key] / totalWeight.value) * 100)
}

const defaultRankMap = computed(() => {
  const arr = leadStore.leads
    .filter((l) => l.valid)
    .map((l) => ({ id: l.id, total: calcScore(l, DEFAULT_W).total }))
    .sort((a, b) => b.total - a.total)
  const map = new Map<string, number>()
  arr.forEach((x, i) => map.set(x.id, i + 1))
  return map
})

const preview = computed(() =>
  leadStore.scored
    .filter((x) => x.lead.valid)
    .slice(0, 6)
    .map((x, i) => ({
      id: x.lead.id,
      total: x.score.total,
      summary: x.lead.needSummary,
      platform: PLATFORM_LABEL[x.lead.platform],
      stage: `${STAGE_LABEL[x.lead.stage]} · ${IDENTITY_LABEL[x.lead.identity]}`,
      delta: (defaultRankMap.value.get(x.lead.id) ?? i + 1) - (i + 1),
    })),
)

function onProviderChange(v: string) {
  const models: Record<string, string> = {
    deepseek: 'deepseek-chat',
    qwen: 'qwen-plus',
    openai: 'gpt-4o-mini',
    local: 'Qwen2.5-7B-Instruct',
  }
  sysStore.update({ llmModel: models[v] ?? '' })
}

function save() {
  sysStore.save()
  ElMessage.success('设置已保存，新的权重已即时生效')
}
</script>

<style scoped>
.grid-2 {
  grid-template-columns: 1fr 1fr;
}
.weight-row {
  margin-bottom: 2px;
}
.weight-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: -6px;
}
.preview-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--lr-border);
}
.preview-row:last-child {
  border-bottom: none;
}
.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: #eef1ff;
  color: #4f6ef7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12.5px;
  flex: none;
}
.rank-badge.top1 {
  background: #ffeaea;
  color: #e0393e;
}
.compliance-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.risk-note {
  font-size: 12px;
  line-height: 1.7;
  color: #b06f00;
  background: #fff8e6;
  border-radius: 8px;
  padding: 10px 12px;
}
@media (max-width: 1200px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
