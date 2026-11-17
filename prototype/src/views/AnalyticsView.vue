<template>
  <div>
    <div class="grid grid-2">
      <div class="panel">
        <div class="panel-title">
          平台线索质量对比
          <span class="muted">平均分越高，说明该平台越适合这个行业</span>
        </div>
        <EChart :option="platformOption" height="300px" />
      </div>

      <div class="panel">
        <div class="panel-title">
          决策阶段质量
          <span class="muted">柱高为线索数，折线为平均分</span>
        </div>
        <EChart :option="stageOption" height="300px" />
      </div>
    </div>

    <div class="panel" style="margin-top: 14px">
      <div class="panel-title">
        渠道 ROI（按来源关键词）
        <span class="muted">决定下一轮词包该往哪里加预算</span>
      </div>
      <el-table :data="keywordRoi" size="small">
        <el-table-column label="来源关键词" prop="keyword" min-width="160" />
        <el-table-column label="线索数" prop="leads" width="100" sortable>
          <template #default="{ row }"><span class="mono">{{ row.leads }}</span></template>
        </el-table-column>
        <el-table-column label="高价值(S/A)" width="130" sortable prop="highValue">
          <template #default="{ row }">
            <el-tag v-if="row.highValue" type="danger" size="small" effect="light">{{ row.highValue }}</el-tag>
            <span v-else class="muted mono">0</span>
          </template>
        </el-table-column>
        <el-table-column label="高价值占比" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.highValue / row.leads) * 100)"
              :stroke-width="8"
              :color="row.highValue / row.leads >= 0.4 ? '#e0393e' : '#4f6ef7'"
            />
          </template>
        </el-table-column>
        <el-table-column label="平均分" prop="avgScore" width="100" sortable>
          <template #default="{ row }"><span class="mono">{{ row.avgScore }}</span></template>
        </el-table-column>
        <el-table-column label="已成交" prop="won" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.won" type="success" size="small" effect="light">{{ row.won }}</el-tag>
            <span v-else class="muted mono">0</span>
          </template>
        </el-table-column>
        <el-table-column label="投放建议" min-width="220">
          <template #default="{ row }">
            <span v-if="row.highValue >= 2" style="color: #e0393e; font-size: 12.5px">
              加大词包覆盖，优先跟进人力
            </span>
            <span v-else-if="row.avgScore >= 60" style="font-size: 12.5px">维持监听，观察转化</span>
            <span v-else class="muted" style="font-size: 12.5px">声量词，可降频</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="grid grid-2" style="margin-top: 14px">
      <div class="panel">
        <div class="panel-title">
          需求主题 · 高价值占比
          <span class="muted">红色为高价值线索</span>
        </div>
        <EChart :option="topicOption" height="330px" />
      </div>

      <div class="panel">
        <div class="panel-title">
          竞品声量
          <span class="muted">竞品被提及处即截流机会点</span>
        </div>
        <EChart :option="competitorOption" height="330px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import EChart from '@/components/EChart.vue'
import { useLeadStore } from '@/stores/leads'

const leadStore = useLeadStore()
const { platformStats, stageFunnel, keywordRoi, needTopics, competitorStats } = storeToRefs(leadStore)

const platformOption = computed(() => ({
  grid: { left: 46, right: 20, top: 34, bottom: 30 },
  tooltip: { trigger: 'axis' },
  legend: { data: ['有效线索数', '平均线索分'], top: 0, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
  xAxis: {
    type: 'category',
    data: platformStats.value.map((p) => p.label),
    axisLabel: { fontSize: 11 },
  },
  yAxis: [
    { type: 'value', name: '线索数', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 } },
    { type: 'value', name: '平均分', max: 100, nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 } },
  ],
  series: [
    {
      name: '有效线索数',
      type: 'bar',
      barWidth: 22,
      data: platformStats.value.map((p) => p.leads),
      itemStyle: { color: '#c7d0fd', borderRadius: [4, 4, 0, 0] },
    },
    {
      name: '平均线索分',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 7,
      data: platformStats.value.map((p) => p.avgScore),
      itemStyle: { color: '#4f6ef7' },
      lineStyle: { width: 2.5 },
    },
  ],
}))

const stageOption = computed(() => ({
  grid: { left: 46, right: 20, top: 34, bottom: 30 },
  tooltip: { trigger: 'axis' },
  legend: { data: ['线索数', '平均分'], top: 0, itemWidth: 12, itemHeight: 8, textStyle: { fontSize: 11 } },
  xAxis: { type: 'category', data: stageFunnel.value.map((s) => s.label), axisLabel: { fontSize: 11 } },
  yAxis: [
    { type: 'value', name: '线索数', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 } },
    { type: 'value', name: '平均分', max: 100, nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 } },
  ],
  series: [
    {
      name: '线索数',
      type: 'bar',
      barWidth: 26,
      data: stageFunnel.value.map((s, i) => ({
        value: s.count,
        itemStyle: { color: ['#c7d0fd', '#a7b4fb', '#f0851f', '#e0393e'][i], borderRadius: [4, 4, 0, 0] },
      })),
    },
    {
      name: '平均分',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 7,
      data: stageFunnel.value.map((s) => s.avgScore),
      itemStyle: { color: '#4f6ef7' },
      lineStyle: { width: 2.5 },
    },
  ],
}))

const topicOption = computed(() => {
  const data = [...needTopics.value].sort((a, b) => a.count - b.count)
  return {
    grid: { left: 96, right: 40, top: 16, bottom: 20 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { show: false },
    xAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'category',
      data: data.map((t) => t.topic),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        name: '高价值',
        type: 'bar',
        stack: 'total',
        barWidth: 15,
        data: data.map((t) => t.highValue),
        itemStyle: { color: '#e0393e', borderRadius: [3, 0, 0, 3] },
      },
      {
        name: '其他',
        type: 'bar',
        stack: 'total',
        barWidth: 15,
        data: data.map((t) => t.count - t.highValue),
        itemStyle: { color: '#c7d0fd', borderRadius: [0, 3, 3, 0] },
      },
    ],
  }
})

const competitorOption = computed(() => {
  const data = [...competitorStats.value].sort((a, b) => a.count - b.count)
  if (!data.length) {
    return {
      title: { text: '暂无竞品提及', left: 'center', top: 'middle', textStyle: { fontSize: 13, color: '#909399' } },
    }
  }
  return {
    grid: { left: 96, right: 40, top: 16, bottom: 20 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    yAxis: { type: 'category', data: data.map((c) => c.name), axisLabel: { fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 16,
        data: data.map((c) => c.count),
        itemStyle: { color: '#e6a23c', borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', fontSize: 11 },
      },
    ],
  }
})
</script>

<style scoped>
.grid-2 {
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 1200px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
