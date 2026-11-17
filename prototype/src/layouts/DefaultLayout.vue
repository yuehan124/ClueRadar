<template>
  <el-container class="app-shell">
    <el-aside width="222px" class="app-sidebar">
      <div class="brand">
        <div class="brand-logo">雷</div>
        <div>
          <div class="brand-name">线索雷达</div>
          <div class="brand-sub">LeadRadar · AI 获客</div>
        </div>
      </div>

      <el-menu class="sidebar-menu" :default-active="activeMenu" router>
        <el-menu-item v-for="m in menus" :key="m.menu" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
          <el-badge
            v-if="m.menu === 'leads' && leadStore.stats.pending"
            :value="leadStore.stats.pending"
            class="menu-badge"
          />
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div>原型演示 · Demo 数据</div>
        <div style="margin-top: 4px">数据源：MediaCrawler（脱敏版）</div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div>
          <h1 class="page-title">{{ pageTitle }}</h1>
          <div class="page-desc">{{ pageDesc }}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px">
          <el-tag type="warning" effect="plain" size="small">
            <el-icon style="vertical-align: -2px"><Warning /></el-icon>
            合规模式：仅公开互动
          </el-tag>
          <el-button size="small" :icon="Refresh" @click="reset">重置演示数据</el-button>

          <el-dropdown trigger="click" @command="onUserCommand">
            <span class="user-chip">
              <el-avatar :size="28" style="background: linear-gradient(135deg, #4f6ef7, #8b5cf6)">
                {{ auth.user?.display?.[0] ?? '演' }}
              </el-avatar>
              <span class="user-name">{{ auth.user?.display ?? '未登录' }}</span>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>账号：{{ auth.user?.username }}</el-dropdown-item>
                <el-dropdown-item disabled>角色：{{ auth.user?.role }}</el-dropdown-item>
                <el-dropdown-item disabled>登录时间：{{ auth.user?.loginAt }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Refresh, SwitchButton, Warning } from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores/leads'
import { useKeywordStore } from '@/stores/keywords'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const leadStore = useLeadStore()
const keywordStore = useKeywordStore()
const auth = useAuthStore()

const menus = [
  { path: '/', menu: 'dashboard', title: '概览', icon: 'Odometer' },
  { path: '/leads', menu: 'leads', title: '线索池', icon: 'Aim' },
  { path: '/keywords', menu: 'keywords', title: '词包管理', icon: 'Collection' },
  { path: '/tasks', menu: 'tasks', title: '采集任务', icon: 'Timer' },
  { path: '/analytics', menu: 'analytics', title: '分析报表', icon: 'TrendCharts' },
  { path: '/settings', menu: 'settings', title: '设置', icon: 'Setting' },
]

const activeMenu = computed(() => (route.meta?.menu as string) ?? 'dashboard')
const pageTitle = computed(() => (route.meta?.title as string) ?? '')
const pageDesc = computed(() => (route.meta?.desc as string) ?? '')

function reset() {
  leadStore.resetDemoData()
  keywordStore.$reset()
  ElMessage.success('演示数据已重置')
}

async function onUserCommand(command: string) {
  if (command !== 'logout') return
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  auth.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}
</script>

<style scoped>
.menu-badge {
  margin-left: auto;
}
.menu-badge :deep(.el-badge__content) {
  background: #f56c6c;
  border: none;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 3px 9px 3px 3px;
  border-radius: 20px;
  cursor: pointer;
  outline: none;
  transition: background 0.15s;
}

.user-chip:hover {
  background: #f2f4fb;
}

.user-name {
  font-size: 13px;
  color: #414a63;
}

.user-arrow {
  font-size: 12px;
  color: #909399;
}
</style>
