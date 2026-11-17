<template>
  <div>
    <!-- 筛选 -->
    <div class="panel">
      <div class="filter-bar">
        <el-select
          v-model="filters.platform"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="平台"
          style="width: 190px"
          clearable
        >
          <el-option v-for="(label, key) in PLATFORM_LABEL" :key="key" :label="label" :value="key" />
        </el-select>

        <el-select v-model="filters.stage" multiple placeholder="决策阶段" style="width: 200px" clearable>
          <el-option v-for="(label, key) in STAGE_LABEL" :key="key" :label="label" :value="key" />
        </el-select>

        <el-select v-model="filters.identity" multiple placeholder="身份判断" style="width: 190px" clearable>
          <el-option v-for="(label, key) in IDENTITY_LABEL" :key="key" :label="label" :value="key" />
        </el-select>

        <el-select v-model="filters.status" multiple placeholder="跟进状态" style="width: 175px" clearable>
          <el-option v-for="(label, key) in STATUS_LABEL" :key="key" :label="label" :value="key" />
        </el-select>

        <div class="score-filter">
          <span class="muted" style="font-size: 12px">最低分 {{ filters.minScore }}</span>
          <el-slider v-model="filters.minScore" :min="0" :max="100" :step="5" style="width: 120px" />
        </div>

        <el-input
          v-model="filters.keyword"
          placeholder="搜索评论内容 / 需求 / 竞品"
          style="width: 230px"
          clearable
          :prefix-icon="Search"
        />

        <el-switch
          v-model="filters.onlyValid"
          active-text="有效"
          inactive-text="全部"
          inline-prompt
          style="--el-switch-on-color: #4f6ef7; margin-left: 4px"
        />

        <el-button :icon="RefreshLeft" @click="reset">重置</el-button>
      </div>

      <div class="result-line">
        <span>
          命中 <b>{{ filtered.length }}</b> 条线索
          <span class="muted">／ 全部 {{ allCount }} 条（含 {{ noiseCount }} 条已过滤噪声）</span>
        </span>
        <span class="muted" style="font-size: 12px">
          评分权重：意向 {{ weights.intent }} · 阶段 {{ weights.stage }} · 身份 {{ weights.identity }} ·
          具体度 {{ weights.specificity }} · 时效 {{ weights.freshness }} · 热度 {{ weights.engagement }}
          <el-link type="primary" :underline="false" style="margin-left: 6px" @click="$router.push('/settings')">
            去调整
          </el-link>
        </span>
      </div>
    </div>

    <!-- 表格 -->
    <div class="panel" style="margin-top: 14px">
      <el-table
        :data="rows"
        size="small"
        style="width: 100%"
        :default-sort="{ prop: '_score', order: 'descending' }"
        @row-click="(row: LeadRow) => open(row.id)"
        row-class-name="lead-row"
      >
        <el-table-column label="线索分" prop="_score" width="112" sortable>
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 6px">
              <span class="score-badge" :class="`score-${row._grade.toLowerCase()}`">{{ row._score }}</span>
              <el-tag :type="gradeTag(row._grade)" size="small" effect="dark" round>{{ row._grade }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="决策阶段" width="100">
          <template #default="{ row }">
            <el-tag :type="STAGE_TAG[row.stage as Stage]" size="small" effect="light">
              {{ STAGE_LABEL[row.stage as Stage] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="身份判断" width="128">
          <template #default="{ row }">
            <el-tooltip :content="row.identityNote || '无明确组织线索'" placement="top" :show-after="300">
              <el-tag :type="IDENTITY_TAG[row.identity as Identity]" size="small" effect="light">
                {{ IDENTITY_LABEL[row.identity as Identity] }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="需求摘要" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div style="font-size: 12.5px">{{ row.needSummary }}</div>
            <div class="muted" style="font-size: 11.5px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis">
              {{ row.commentText }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="命中信号" min-width="190">
          <template #default="{ row }">
            <span v-for="s in row._signals.slice(0, 3)" :key="s.word" class="signal-chip">{{ s.word }}</span>
            <span v-if="row._signals.length > 3" class="muted" style="font-size: 11px">
              +{{ row._signals.length - 3 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="平台" width="84">
          <template #default="{ row }">
            <span style="font-size: 12.5px">{{ PLATFORM_LABEL[row.platform as Platform] }}</span>
          </template>
        </el-table-column>

        <el-table-column label="来源词" prop="sourceKeyword" width="118" show-overflow-tooltip />

        <el-table-column label="时间" width="98">
          <template #default="{ row }">
            <span class="muted" style="font-size: 12px">{{ fromNow(row.commentTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="122">
          <template #default="{ row }">
            <el-select
              :model-value="row.status"
              size="small"
              @click.stop
              @update:model-value="(v: LeadStatus) => leadStore.setStatus(row.id, v)"
            >
              <el-option v-for="(label, key) in STATUS_LABEL" :key="key" :label="label" :value="key" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="负责人" width="96">
          <template #default="{ row }">
            <span v-if="row.owner" style="font-size: 12.5px">{{ row.owner }}</span>
            <span v-else class="muted" style="font-size: 12px">未分配</span>
          </template>
        </el-table-column>

        <el-table-column label="" width="70" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="open(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 14px">
        <el-pagination
          v-model:current-page="leadStore.currentPage"
          v-model:page-size="leadStore.pageSize"
          :total="filtered.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <LeadDetailDrawer v-model="drawerVisible" :lead-id="activeLeadId" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import type { Identity, Lead, LeadStatus, Platform, Stage } from '@/types'
import type { ScoredLead } from '@/stores/leads'
import { useLeadStore } from '@/stores/leads'
import LeadDetailDrawer from '@/components/LeadDetailDrawer.vue'
import {
  fromNow,
  IDENTITY_LABEL,
  IDENTITY_TAG,
  PLATFORM_LABEL,
  STAGE_LABEL,
  STAGE_TAG,
  STATUS_LABEL,
} from '@/utils'

type LeadRow = Lead & { _score: number; _grade: string; _signals: ScoredLead['lead']['signals'] }

const leadStore = useLeadStore()
const { filters, filtered, weights, scored, stats } = storeToRefs(leadStore)

const drawerVisible = ref(false)
const activeLeadId = ref<string | null>(null)

const allCount = computed(() => scored.value.length)
const noiseCount = computed(() => stats.value.noiseCount)

const rows = computed<LeadRow[]>(() =>
  (leadStore.paged as ScoredLead[]).map((s) => ({
    ...s.lead,
    _score: s.score.total,
    _grade: s.score.grade,
    _signals: s.lead.signals,
  })),
)

function gradeTag(g: string) {
  if (g === 'S') return 'danger'
  if (g === 'A') return 'warning'
  if (g === 'B') return 'primary'
  return 'info'
}

function open(id: string) {
  activeLeadId.value = id
  drawerVisible.value = true
}

function reset() {
  leadStore.resetFilters()
  ElMessage.success('筛选条件已重置')
}
</script>

<style scoped>
.score-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
}
.result-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--lr-border);
  font-size: 13px;
  flex-wrap: wrap;
  gap: 8px;
}
:deep(.lead-row) {
  cursor: pointer;
}
</style>
