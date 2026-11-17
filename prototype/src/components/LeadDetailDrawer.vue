<template>
  <el-drawer
    :model-value="modelValue"
    size="720px"
    :with-header="false"
    body-class="lead-drawer-body"
    @update:model-value="(v: boolean) => $emit('update:modelValue', v)"
  >
    <template v-if="item">
      <!-- 头部 -->
      <div class="dr-header">
        <div style="flex: 1">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
            <el-tag effect="plain" size="small">{{ PLATFORM_LABEL[item.lead.platform] }}</el-tag>
            <el-tag :type="STAGE_TAG[item.lead.stage]" size="small" effect="dark">
              {{ STAGE_LABEL[item.lead.stage] }}
            </el-tag>
            <el-tag :type="IDENTITY_TAG[item.lead.identity]" size="small" effect="light">
              {{ IDENTITY_LABEL[item.lead.identity] }}
            </el-tag>
            <el-tag v-if="!item.lead.valid" type="info" size="small" effect="dark">已过滤</el-tag>
          </div>
          <div class="dr-title">{{ item.lead.nickname }}</div>
          <div class="muted mono" style="font-size: 11.5px">
            {{ item.lead.id }} · creator_hash: {{ item.lead.creatorHash }} · {{ fromNow(item.lead.commentTime) }}
          </div>
        </div>
        <div style="text-align: center">
          <el-progress
            type="circle"
            :percentage="item.score.total"
            :width="76"
            :stroke-width="7"
            :color="scoreColor"
          >
            <template #default>
              <div style="line-height: 1.1">
                <div :style="{ fontSize: '20px', fontWeight: 700, color: scoreColor }">
                  {{ item.score.total }}
                </div>
                <div style="font-size: 11px; color: #909399">{{ item.score.grade }} 级</div>
              </div>
            </template>
          </el-progress>
        </div>
      </div>

      <el-alert
        v-if="!item.lead.valid"
        :title="item.lead.invalidReason || '该评论被判为无效，不进入跟进流程'"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 14px"
      />

      <!-- 原帖 + 原文 -->
      <div class="sec">
        <div class="sec-title">线索原文</div>
        <div class="meta-row">
          <span class="muted">所属内容：</span>
          <el-link type="primary" :href="item.lead.contentUrl" target="_blank" :underline="false">
            {{ item.lead.contentTitle }}
          </el-link>
        </div>
        <div class="meta-row">
          <span class="muted">来源关键词：</span>
          <el-tag size="small" effect="plain">{{ item.lead.sourceKeyword }}</el-tag>
        </div>
        <div class="quote" v-html="highlighted"></div>
      </div>

      <!-- AI 判定 -->
      <div class="sec">
        <div class="sec-title">
          AI 判定结果
          <el-tag size="small" effect="plain" type="primary" style="margin-left: 6px">可解释</el-tag>
        </div>
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="需求摘要" :span="2">
            {{ item.lead.needSummary }}
          </el-descriptions-item>
          <el-descriptions-item label="决策阶段">
            {{ STAGE_LABEL[item.lead.stage] }}
          </el-descriptions-item>
          <el-descriptions-item label="身份判断">
            {{ IDENTITY_LABEL[item.lead.identity] }}
          </el-descriptions-item>
          <el-descriptions-item label="身份依据" :span="2">
            {{ item.lead.identityNote || '无明确组织线索' }}
          </el-descriptions-item>
          <el-descriptions-item label="竞品提及" :span="2">
            <template v-if="item.lead.competitors.length">
              <el-tag v-for="c in item.lead.competitors" :key="c" size="small" type="warning" effect="light" style="margin-right: 6px">
                {{ c }}
              </el-tag>
            </template>
            <span v-else class="muted">未提及</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 信号命中明细 -->
      <div class="sec">
        <div class="sec-title">信号命中明细（{{ item.lead.signals.length }} 条）</div>
        <el-table :data="item.lead.signals" size="small" style="width: 100%">
          <el-table-column label="命中词" width="150">
            <template #default="{ row }">
              <span class="mono" style="font-weight: 600">{{ row.word }}</span>
            </template>
          </el-table-column>
          <el-table-column label="信号层级" width="100">
            <template #default="{ row }">
              <el-tag :type="SIGNAL_TAG[row.kind as SignalKind]" size="small" effect="light">
                {{ SIGNAL_LABEL[row.kind as SignalKind] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="权重" width="90">
            <template #default="{ row }">
              <el-progress :percentage="row.weight" :stroke-width="6" :show-text="false" />
              <span class="muted" style="font-size: 11px">{{ row.weight }}</span>
            </template>
          </el-table-column>
          <el-table-column label="原文片段" prop="snippet" show-overflow-tooltip />
        </el-table>
      </div>

      <!-- 评分构成 -->
      <div class="sec">
        <div class="sec-title">
          评分构成
          <span class="muted" style="font-weight: 400; font-size: 12px; margin-left: 8px">
            权重可在「设置」中调整，调整后全站实时重排
          </span>
        </div>
        <div v-for="b in item.score.breakdown" :key="b.key" class="score-row">
          <span class="score-label">{{ b.label }}</span>
          <span class="muted mono" style="width: 46px; font-size: 11px">w={{ b.weight }}</span>
          <el-progress
            :percentage="b.raw"
            :stroke-width="8"
            :show-text="false"
            style="flex: 1"
            :color="barColor(b.raw)"
          />
          <span class="mono" style="width: 78px; text-align: right; font-size: 12px">
            {{ b.raw }} <span class="muted">→ +{{ b.contribution }}</span>
          </span>
        </div>
      </div>

      <!-- 公开互动作业单 -->
      <div class="sec" v-if="item.lead.valid">
        <div class="sec-title">
          公开互动作业单
          <el-tag size="small" type="success" effect="light" style="margin-left: 6px">合规路径</el-tag>
        </div>
        <div class="sheet">
          <div class="sheet-row"><b>去向</b><span>{{ sheet.where }}</span></div>
          <div class="sheet-row"><b>动作</b><span>{{ sheet.action }}</span></div>
          <div class="sheet-row"><b>切入点</b><span>{{ sheet.angle }}</span></div>
          <div class="sheet-row"><b>话术</b><span>{{ sheet.script }}</span></div>
          <div class="sheet-cautions">
            <div v-for="(c, i) in sheet.cautions" :key="i">· {{ c }}</div>
          </div>
          <el-button size="small" type="primary" plain :icon="CopyDocument" @click="copySheet">
            复制作业单
          </el-button>
        </div>
      </div>

      <!-- 跟进 -->
      <div class="sec" v-if="item.lead.valid">
        <div class="sec-title">
          跟进记录
          <el-tag size="small" effect="plain">{{ item.lead.activities.length }} 条</el-tag>
        </div>

        <div class="follow-bar">
          <el-select
            :model-value="item.lead.status"
            size="small"
            style="width: 118px"
            @update:model-value="(v: LeadStatus) => leadStore.setStatus(item!.lead.id, v)"
          >
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
          <el-select
            :model-value="item.lead.owner"
            size="small"
            placeholder="分配负责人"
            style="width: 128px"
            @update:model-value="(v: string) => leadStore.assignOwner(item!.lead.id, v)"
          >
            <el-option v-for="o in owners" :key="o" :label="o" :value="o" />
          </el-select>
          <el-input
            v-model="noteInput"
            size="small"
            placeholder="填写跟进记录，如：已发送案例清单，对方本周五回复"
            @keyup.enter="submitNote"
          />
          <el-button size="small" type="primary" @click="submitNote">添加</el-button>
        </div>

        <el-timeline v-if="item.lead.activities.length" style="padding-left: 4px; margin-top: 12px">
          <el-timeline-item
            v-for="a in [...item.lead.activities].reverse()"
            :key="a.id"
            :timestamp="formatDateTime(a.time)"
            placement="top"
            size="normal"
          >
            <div style="font-size: 12.5px">
              <el-tag size="small" effect="plain">{{ a.action }}</el-tag>
              <span class="muted" style="margin-left: 6px">{{ a.operator }}</span>
            </div>
            <div v-if="a.note" class="timeline-note muted" style="margin-top: 4px">{{ a.note }}</div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无跟进记录" :image-size="60" />
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import type { LeadStatus, SignalKind } from '@/types'
import type { ScoredLead } from '@/stores/leads'
import { useLeadStore } from '@/stores/leads'
import {
  formatDateTime,
  fromNow,
  highlightSnippet,
  IDENTITY_LABEL,
  IDENTITY_TAG,
  PLATFORM_LABEL,
  SIGNAL_LABEL,
  SIGNAL_TAG,
  STAGE_LABEL,
  STAGE_TAG,
  STATUS_LABEL,
} from '@/utils'
import { buildActionSheet } from '@/utils/actionSheet'

const props = defineProps<{ modelValue: boolean; leadId: string | null }>()
defineEmits<{ 'update:modelValue': [boolean] }>()

const leadStore = useLeadStore()
const noteInput = ref('')

const owners = ['王磊', '李静', '赵敏', '陈鹏']
const statusOptions = (Object.keys(STATUS_LABEL) as LeadStatus[]).map((v) => ({
  value: v,
  label: STATUS_LABEL[v],
}))

const item = computed<ScoredLead | null>(() =>
  props.leadId ? (leadStore.byId(props.leadId) as ScoredLead | null) : null,
)

const highlighted = computed(() =>
  item.value
    ? highlightSnippet(
        item.value.lead.commentText,
        item.value.lead.signals.map((s) => s.word),
      )
    : '',
)

const sheet = computed(() =>
  item.value ? buildActionSheet(item.value.lead) : { where: '', action: '', angle: '', script: '', cautions: [] },
)

const scoreColor = computed(() => {
  const g = item.value?.score.grade
  if (g === 'S') return '#e0393e'
  if (g === 'A') return '#f0851f'
  if (g === 'B') return '#2f8ef0'
  return '#909399'
})

function barColor(v: number) {
  if (v >= 85) return '#e0393e'
  if (v >= 70) return '#f0851f'
  if (v >= 50) return '#2f8ef0'
  return '#c0c4cc'
}

function submitNote() {
  if (!item.value) return
  if (!noteInput.value.trim()) {
    ElMessage.warning('请先填写跟进内容')
    return
  }
  leadStore.addActivity(item.value.lead.id, noteInput.value.trim())
  noteInput.value = ''
  ElMessage.success('跟进记录已添加')
}

async function copySheet() {
  if (!item.value) return
  const s = sheet.value
  const text = [
    `【线索 ${item.value.lead.id}】${PLATFORM_LABEL[item.value.lead.platform]} · ${STAGE_LABEL[item.value.lead.stage]}`,
    `去向：${s.where}`,
    `动作：${s.action}`,
    `切入点：${s.angle}`,
    `建议话术：${s.script}`,
    '',
    '合规提醒：',
    ...s.cautions.map((c) => `- ${c}`),
  ].join('\n')

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('作业单已复制到剪贴板')
  } catch {
    ElMessage.warning('浏览器未授权剪贴板，请手动复制')
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) noteInput.value = ''
  },
)
</script>

<style scoped>
.dr-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--lr-border);
}
.dr-title {
  font-size: 18px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.sec {
  margin-top: 18px;
}
.sec-title {
  font-size: 13.5px;
  font-weight: 600;
  margin-bottom: 9px;
  display: flex;
  align-items: center;
}
.meta-row {
  font-size: 12.5px;
  margin-bottom: 6px;
}
.quote {
  background: #f7f8fc;
  border-left: 3px solid var(--el-color-primary);
  border-radius: 0 8px 8px 0;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.8;
  margin-top: 8px;
  word-break: break-all;
}
.score-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 7px;
}
.score-label {
  font-size: 12.5px;
  width: 74px;
  color: #414a63;
}
.sheet {
  border: 1px solid var(--lr-border);
  border-radius: 10px;
  padding: 13px 15px;
  background: #fbfcff;
}
.sheet-row {
  display: flex;
  gap: 10px;
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 7px;
}
.sheet-row b {
  flex: none;
  width: 52px;
  color: #6b7280;
  font-weight: 500;
}
.sheet-cautions {
  font-size: 11.5px;
  color: #909399;
  line-height: 1.7;
  border-top: 1px dashed var(--lr-border);
  padding-top: 8px;
  margin: 10px 0;
}
.follow-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
