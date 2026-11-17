<template>
  <div class="brief-card" @click="$emit('open', item.lead.id)">
    <div class="brief-head">
      <span class="score-badge" :class="`score-${item.score.grade.toLowerCase()}`">
        {{ item.score.total }}<span class="score-unit">分</span>
      </span>
      <el-tag :type="gradeTag" size="small" effect="dark" round>{{ item.score.grade }} 级</el-tag>
      <el-tag size="small" effect="plain" :color="undefined">
        {{ PLATFORM_LABEL[item.lead.platform] }}
      </el-tag>
      <el-tag :type="STAGE_TAG[item.lead.stage]" size="small" effect="light">
        {{ STAGE_LABEL[item.lead.stage] }}
      </el-tag>
      <el-tag :type="IDENTITY_TAG[item.lead.identity]" size="small" effect="light">
        {{ IDENTITY_LABEL[item.lead.identity] }}
      </el-tag>
      <span class="muted" style="margin-left: auto; font-size: 12px">
        {{ fromNow(item.lead.commentTime) }}
      </span>
    </div>

    <div class="brief-text">{{ item.lead.commentText }}</div>

    <div class="brief-need">
      <el-icon style="vertical-align: -2px; color: #4f6ef7"><MagicStick /></el-icon>
      <span style="margin-left: 4px">{{ item.lead.needSummary }}</span>
    </div>

    <div style="margin-top: 8px">
      <span v-for="s in topSignals" :key="s.word" class="signal-chip">{{ s.word }}</span>
      <span v-if="item.lead.signals.length > topSignals.length" class="muted" style="font-size: 11px">
        +{{ item.lead.signals.length - topSignals.length }}
      </span>
    </div>

    <div class="brief-foot">
      <span class="muted" style="font-size: 12px">
        来源词：{{ item.lead.sourceKeyword }}
        <span v-if="item.lead.competitors.length" style="margin-left: 8px; color: #e6a23c">
          提及竞品：{{ item.lead.competitors.join('、') }}
        </span>
      </span>
      <div style="display: flex; align-items: center; gap: 8px">
        <el-tag :type="STATUS_TAG[item.lead.status]" size="small" effect="plain">
          {{ STATUS_LABEL[item.lead.status] }}
        </el-tag>
        <el-button type="primary" link size="small">查看详情 →</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MagicStick } from '@element-plus/icons-vue'
import type { ScoredLead } from '@/stores/leads'
import {
  fromNow,
  IDENTITY_LABEL,
  IDENTITY_TAG,
  PLATFORM_LABEL,
  STAGE_LABEL,
  STAGE_TAG,
  STATUS_LABEL,
  STATUS_TAG,
} from '@/utils'

const props = defineProps<{ item: ScoredLead }>()
defineEmits<{ open: [id: string] }>()

const topSignals = computed(() => props.item.lead.signals.slice(0, 4))

const gradeTag = computed(() => {
  const g = props.item.score.grade
  if (g === 'S') return 'danger'
  if (g === 'A') return 'warning'
  if (g === 'B') return 'primary'
  return 'info'
})
</script>

<style scoped>
.score-unit {
  font-size: 12px;
  font-weight: 500;
  margin-left: 1px;
}
.brief-need {
  font-size: 12.5px;
  color: #414a63;
  background: #f2f5ff;
  border-radius: 6px;
  padding: 6px 9px;
  line-height: 1.5;
}
.brief-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--lr-border);
}
</style>
