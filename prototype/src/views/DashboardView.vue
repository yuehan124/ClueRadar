<template>
  <div>
    <!-- KPI -->
    <div class="grid grid-kpi">
      <StatCard label="今日新增线索" :value="stats.todayNew" unit="条" color="#4f6ef7">
        <span class="muted">较昨日 +2 条</span>
      </StatCard>
      <StatCard label="高价值线索（S/A 级）" :value="stats.highValue" unit="条" color="#e0393e">
        <span class="muted">建议当天跟进</span>
      </StatCard>
      <StatCard label="待跟进" :value="stats.pending" unit="条" color="#f0851f">
        <span class="muted">平均分 {{ stats.avgScore }}</span>
      </StatCard>
      <StatCard label="噪声过滤率" :value="noiseRate" unit="%" color="#22a06b">
        <span class="muted">已过滤 {{ stats.noiseCount }} 条无效互动</span>
      </StatCard>
    </div>

    <div class="grid grid-main" style="margin-top: 14px">
      <!-- 今日线索播报 -->
      <div class="panel">
        <div class="panel-title">
          今日线索播报
          <span class="muted">按线索分排序，优先展示未跟进的高价值线索</span>
        </div>
        <div class="grid grid-brief">
          <LeadBriefCard
            v-for="b in briefing"
            :key="b.lead.id"
            :item="b"
            @open="open"
          />
        </div>
        <el-empty v-if="!briefing.length" description="今日暂无高价值线索" :image-size="70" />
      </div>

      <!-- 右侧 -->
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div class="panel">
          <div class="panel-title">
            决策阶段分布
            <span class="muted">越靠后越值钱</span>
          </div>
          <EChart :option="funnelOption" height="188px" />
        </div>

        <div class="panel">
          <div class="panel-title">跟进状态</div>
          <div class="grid grid-status">
            <div v-for="s in statusBoard" :key="s.status" class="status-cell">
              <div class="muted" style="font-size: 12px">{{ STATUS_LABEL[s.status] }}</div>
              <div style="font-size: 20px; font-weight: 700">{{ s.count }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-title">
            竞品提及
            <span class="muted">截流机会点</span>
          </div>
          <div v-if="competitors.length">
            <div v-for="c in competitors" :key="c.name" class="comp-row">
              <el-tag type="warning" effect="light" size="small">{{ c.name }}</el-tag>
              <el-progress
                :percentage="Math.round((c.count / competitors[0].count) * 100)"
                :stroke-width="7"
                :show-text="false"
                style="flex: 1"
                color="#e6a23c"
              />
              <span class="muted mono" style="font-size: 12px">{{ c.count }} 次</span>
            </div>
          </div>
          <el-empty v-else description="暂无竞品提及" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- 需求主题 -->
    <div class="panel" style="margin-top: 14px">
      <div class="panel-title">
        需求主题分布
        <span class="muted">按来源关键词归集 · 用于反向指导内容选题</span>
      </div>
      <el-table :data="topics" size="small">
        <el-table-column label="需求主题" prop="topic" min-width="150" />
        <el-table-column label="线索数" width="100">
          <template #default="{ row }">
            <span class="mono">{{ row.count }}</span>
          </template>
        </el-table-column>
        <el-table-column label="高价值" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.highValue" type="danger" size="small" effect="light">
              {{ row.highValue }}
            </el-tag>
            <span v-else class="muted">0</span>
          </template>
        </el-table-column>
        <el-table-column label="平均分" width="90">
          <template #default="{ row }">
            <span class="mono">{{ row.avgScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="热度" min-width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.count / topics[0].count) * 100)"
              :stroke-width="8"
              :show-text="false"
              :color="row.highValue ? '#e0393e' : '#4f6ef7'"
            />
          </template>
        </el-table-column>
        <el-table-column label="建议" min-width="220">
          <template #default="{ row }">
            <span v-if="row.highValue >= 2" style="color: #e0393e; font-size: 12.5px">
              高意向集中，建议优先加派跟进人力
            </span>
            <span v-else-if="row.avgScore >= 60" style="font-size: 12.5px" class="muted">
              质量中等，可作内容选题储备
            </span>
            <span v-else class="muted" style="font-size: 12.5px">声量为主，暂不投入</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <LeadDetailDrawer v-model="drawerVisible" :lead-id="activeLeadId" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import StatCard from '@/components/StatCard.vue'
import EChart from '@/components/EChart.vue'
import LeadBriefCard from '@/components/LeadBriefCard.vue'
import LeadDetailDrawer from '@/components/LeadDetailDrawer.vue'
import { useLeadStore } from '@/stores/leads'
import { STATUS_LABEL } from '@/utils'

const leadStore = useLeadStore()
const { briefing, stats, statusBoard, needTopics, competitorStats, stageFunnel } = storeToRefs(leadStore)

const topics = computed(() => needTopics.value)
const competitors = computed(() => competitorStats.value)

const drawerVisible = ref(false)
const activeLeadId = ref<string | null>(null)

function open(id: string) {
  activeLeadId.value = id
  drawerVisible.value = true
}

const noiseRate = computed(() => {
  const total = stats.value.validCount + stats.value.noiseCount
  return total ? Math.round((stats.value.noiseCount / total) * 100) : 0
})

const funnelOption = computed(() => {
  const data = stageFunnel.value
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; value: number }) => {
        const hit = data.find((d) => d.label === p.name)
        return `${p.name}<br/>线索数：${p.value}<br/>平均分：${hit?.avgScore ?? 0}`
      },
    },
    series: [
      {
        type: 'funnel',
        left: '6%',
        right: '6%',
        top: 6,
        bottom: 6,
        minSize: '28%',
        sort: 'ascending',
        gap: 3,
        label: {
          formatter: (p: { name: string; value: number }) => `${p.name}  ${p.value}`,
          fontSize: 11,
          color: '#fff',
        },
        itemStyle: { borderWidth: 0 },
        data: data.map((d, i) => ({
          name: d.label,
          value: d.count,
          itemStyle: { color: ['#a7b4fb', '#8095f9', '#f0851f', '#e0393e'][i] },
        })),
      },
    ],
  }
})
</script>

<style scoped>
.grid-kpi {
  grid-template-columns: repeat(4, 1fr);
}
.grid-main {
  grid-template-columns: 1fr 348px;
  align-items: start;
}
.grid-brief {
  grid-template-columns: repeat(2, 1fr);
}
.grid-status {
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.status-cell {
  text-align: center;
  background: #f7f8fc;
  border-radius: 8px;
  padding: 8px 4px;
}
.comp-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 9px;
}
@media (max-width: 1400px) {
  .grid-main {
    grid-template-columns: 1fr;
  }
  .grid-brief {
    grid-template-columns: 1fr;
  }
}
</style>
