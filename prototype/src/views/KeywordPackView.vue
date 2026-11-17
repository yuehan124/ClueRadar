<template>
  <div>
    <!-- 四层信号体系 -->
    <div class="grid grid-kinds">
      <div
        v-for="k in kindViews"
        :key="k.kind"
        class="panel kind-card"
        :class="{ active: activeKind === k.kind }"
        @click="activeKind = activeKind === k.kind ? '' : k.kind"
      >
        <div class="kind-head">
          <el-tag :type="SIGNAL_TAG[k.kind]" size="small" effect="dark">{{ SIGNAL_LABEL[k.kind] }}</el-tag>
          <span class="muted" style="font-size: 12px">{{ k.words }} 词 · 命中 {{ k.hits }} 次</span>
        </div>
        <div class="kind-desc">{{ k.desc }}</div>
      </div>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 14px"
      title="四层信号体系：先用噪声词砍掉无效互动，再用意向词找需求，用身份词判断是不是真采购方，用阶段词判断该不该现在跟进"
    />

    <!-- 列表 -->
    <div class="panel" style="margin-top: 14px">
      <div class="panel-title">
        词库
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="keyword" placeholder="搜索词" size="small" style="width: 180px" clearable />
          <el-radio-group v-model="activeKind" size="small">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button v-for="k in kinds" :key="k" :value="k">
              {{ SIGNAL_LABEL[k] }}
            </el-radio-button>
          </el-radio-group>
          <el-button type="primary" size="small" :icon="Plus" @click="dialogVisible = true">
            新增信号词
          </el-button>
        </div>
      </div>

      <el-table :data="list" size="small" max-height="560">
        <el-table-column label="信号词" min-width="180">
          <template #default="{ row }">
            <span class="mono" style="font-weight: 600">{{ row.word }}</span>
          </template>
        </el-table-column>
        <el-table-column label="信号层级" width="106">
          <template #default="{ row }">
            <el-tag :type="SIGNAL_TAG[row.kind as SignalKind]" size="small" effect="light">
              {{ SIGNAL_LABEL[row.kind as SignalKind] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="词包" prop="pack" width="130" />
        <el-table-column label="适用平台" min-width="190">
          <template #default="{ row }">
            <el-tag
              v-for="p in row.platforms"
              :key="p"
              size="small"
              effect="plain"
              style="margin-right: 4px"
            >
              {{ PLATFORM_LABEL[p as Platform] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权重" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.weight" :stroke-width="7" :show-text="false" />
            <span class="muted mono" style="font-size: 11px">{{ row.weight }}</span>
          </template>
        </el-table-column>
        <el-table-column label="命中次数" prop="hitCount" width="100" sortable>
          <template #default="{ row }">
            <span class="mono">{{ row.hitCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              size="small"
              @update:model-value="(v: boolean) => kwStore.updateKeyword(row.id, { enabled: v })"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              size="small"
              @click="kwStore.removeKeyword(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增 -->
    <el-dialog v-model="dialogVisible" title="新增信号词" width="520px">
      <el-form :model="form" label-width="92px">
        <el-form-item label="信号词">
          <el-input v-model="form.word" placeholder="如：有能做这个的吗" />
        </el-form-item>
        <el-form-item label="信号层级">
          <el-radio-group v-model="form.kind">
            <el-radio-button v-for="k in kinds" :key="k" :value="k">{{ SIGNAL_LABEL[k] }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="词包">
          <el-select
            v-model="form.pack"
            filterable
            allow-create
            default-first-option
            placeholder="选择或新建词包"
            style="width: 100%"
          >
            <el-option v-for="p in packOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用平台">
          <el-select v-model="form.platforms" multiple placeholder="默认全部平台" style="width: 100%">
            <el-option v-for="(label, key) in PLATFORM_LABEL" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="权重">
          <el-slider v-model="form.weight" :min="10" :max="100" :step="5" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Platform, SignalKind } from '@/types'
import { useKeywordStore } from '@/stores/keywords'
import { PLATFORM_LABEL, SIGNAL_LABEL, SIGNAL_TAG } from '@/utils'

const kwStore = useKeywordStore()
const kinds: SignalKind[] = ['noise', 'intent', 'identity', 'stage']

const KIND_DESC: Record<SignalKind, string> = {
  noise: '第 1 层 · 先砍掉无效互动与同行广告，降低人工成本',
  intent: '第 2 层 · 抓取采购意向表达，判断有没有需求',
  identity: '第 3 层 · 识别企业主体与决策权，判断是不是真采购方',
  stage: '第 4 层 · 判断处于决策链哪个环节，决定跟进优先级',
}

const activeKind = ref<SignalKind | ''>('')
const keyword = ref('')
const dialogVisible = ref(false)

const form = reactive({
  word: '',
  kind: 'intent' as SignalKind,
  pack: '求供应商',
  platforms: [] as Platform[],
  weight: 80,
})

const kindViews = computed(() =>
  kinds.map((k) => ({
    kind: k,
    desc: KIND_DESC[k],
    ...kwStore.kindStats[k],
  })),
)

const packOptions = computed(() => kwStore.packOptions)

const list = computed(() =>
  kwStore.keywords.filter((k) => {
    if (activeKind.value && k.kind !== activeKind.value) return false
    if (keyword.value && !k.word.includes(keyword.value.trim())) return false
    return true
  }),
)

function submit() {
  if (!form.word.trim()) {
    ElMessage.warning('请填写信号词')
    return
  }
  kwStore.addKeyword({
    word: form.word.trim(),
    kind: form.kind,
    pack: form.pack,
    platforms: form.platforms.length ? [...form.platforms] : (Object.keys(PLATFORM_LABEL) as Platform[]),
    weight: form.weight,
  })
  dialogVisible.value = false
  form.word = ''
  ElMessage.success('信号词已添加，将在下次采集任务中生效')
}
</script>

<style scoped>
.grid-kinds {
  grid-template-columns: repeat(4, 1fr);
}
.kind-card {
  cursor: pointer;
  transition: all 0.15s;
}
.kind-card:hover {
  border-color: var(--el-color-primary-light-5);
}
.kind-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}
.kind-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}
.kind-desc {
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.6;
}
@media (max-width: 1200px) {
  .grid-kinds {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
