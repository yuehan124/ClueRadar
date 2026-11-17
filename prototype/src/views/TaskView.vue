<template>
  <div>
    <div class="grid grid-kpi">
      <StatCard label="采集任务" :value="ts.total" unit="个" color="#4f6ef7">
        <span class="muted">启用 {{ ts.enabled }} 个</span>
      </StatCard>
      <StatCard label="运行中" :value="ts.running" unit="个" color="#22a06b">
        <span class="muted">失败 {{ ts.failed }} 个</span>
      </StatCard>
      <StatCard label="累计抓取" :value="ts.crawled" unit="条" color="#8b5cf6">
        <span class="muted">内容 + 评论</span>
      </StatCard>
      <StatCard label="本期新增线索" :value="ts.newLeads" unit="条" color="#e0393e">
        <span class="muted">经四层信号过滤后</span>
      </StatCard>
    </div>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      style="margin-top: 14px"
      title="采集策略：所有任务共用限速与并发上限（可在「设置」调整），避免对目标平台造成压力而触发风控"
    />

    <div class="panel" style="margin-top: 14px">
      <div class="panel-title">
        任务列表
        <el-button type="primary" size="small" :icon="Plus" @click="dialogVisible = true">
          新建任务
        </el-button>
      </div>

      <el-table :data="kwStore.tasks" size="small">
        <el-table-column label="任务名称" min-width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 7px">
              <el-icon v-if="row.status === 'running'" class="is-loading" color="#22a06b"><Loading /></el-icon>
              <el-icon v-else-if="row.status === 'failed'" color="#f56c6c"><CircleClose /></el-icon>
              <el-icon v-else color="#909399"><Clock /></el-icon>
              <span style="font-weight: 500">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="词包" min-width="220">
          <template #default="{ row }">
            <el-tag v-for="p in row.packs" :key="p" size="small" effect="plain" style="margin: 0 4px 2px 0">
              {{ p }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="平台" width="120">
          <template #default="{ row }">
            <el-tag v-for="p in row.platforms" :key="p" size="small" effect="light" style="margin-right: 3px">
              {{ PLATFORM_LABEL[p as Platform] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="调度" prop="schedule" width="106" />

        <el-table-column label="上次运行" width="150">
          <template #default="{ row }">
            <span class="muted" style="font-size: 12px">
              {{ row.lastRunAt ? formatDateTime(row.lastRunAt) : '尚未运行' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="抓取量" prop="crawledCount" width="100" sortable>
          <template #default="{ row }">
            <span class="mono">{{ row.crawledCount }}</span>
          </template>
        </el-table-column>

        <el-table-column label="新增线索" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.newLeadCount" type="danger" size="small" effect="light">
              +{{ row.newLeadCount }}
            </el-tag>
            <span v-else class="muted mono">0</span>
          </template>
        </el-table-column>

        <el-table-column label="启用" width="76">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              size="small"
              @update:model-value="(v: boolean) => kwStore.toggleTask(row.id, v)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="row.status === 'running'"
              @click="run(row.id)"
            >
              立即运行
            </el-button>
            <el-button type="danger" link size="small" @click="kwStore.removeTask(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新建采集任务" width="560px">
      <el-form :model="form" label-width="96px">
        <el-form-item label="任务名称">
          <el-input v-model="form.name" placeholder="如：知乎 · 代运营需求监听" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="form.platforms" multiple placeholder="选择目标平台" style="width: 100%">
            <el-option v-for="(label, key) in PLATFORM_LABEL" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="词包">
          <el-select v-model="form.packs" multiple placeholder="选择信号词包" style="width: 100%">
            <el-option v-for="p in packOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="调度频率">
          <el-select v-model="form.schedule" style="width: 100%">
            <el-option label="每 2 小时" value="每 2 小时" />
            <el-option label="每 6 小时" value="每 6 小时" />
            <el-option label="每 12 小时" value="每 12 小时" />
            <el-option label="每天 09:00" value="每天 09:00" />
            <el-option label="每天 12:00" value="每天 12:00" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleClose, Clock, Loading, Plus } from '@element-plus/icons-vue'
import type { Platform } from '@/types'
import { useKeywordStore } from '@/stores/keywords'
import StatCard from '@/components/StatCard.vue'
import { formatDateTime, PLATFORM_LABEL } from '@/utils'

const kwStore = useKeywordStore()
const ts = computed(() => kwStore.taskStats)
const packOptions = computed(() => kwStore.packOptions)

const dialogVisible = ref(false)
const form = reactive({
  name: '',
  platforms: ['zhihu'] as Platform[],
  packs: ['求供应商'] as string[],
  schedule: '每 2 小时',
})

function run(id: string) {
  kwStore.runTask(id)
  ElMessage.info('任务已启动，正在采集…')
}

function submit() {
  if (!form.name.trim()) {
    ElMessage.warning('请填写任务名称')
    return
  }
  kwStore.addTask({
    name: form.name.trim(),
    platforms: [...form.platforms],
    packs: [...form.packs],
    schedule: form.schedule,
  })
  dialogVisible.value = false
  form.name = ''
  ElMessage.success('任务已创建')
}
</script>

<style scoped>
.grid-kpi {
  grid-template-columns: repeat(4, 1fr);
}
</style>
