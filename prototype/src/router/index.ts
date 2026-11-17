import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '概览', desc: '今日线索播报与整体态势', menu: 'dashboard', icon: 'Odometer' },
      },
      {
        path: 'leads',
        name: 'leads',
        component: () => import('@/views/LeadsView.vue'),
        meta: { title: '线索池', desc: '按决策阶段与身份分级，只看值得跟的线索', menu: 'leads', icon: 'Aim' },
      },
      {
        path: 'keywords',
        name: 'keywords',
        component: () => import('@/views/KeywordPackView.vue'),
        meta: { title: '词包管理', desc: '四层信号体系：噪声词 / 意向词 / 身份词 / 阶段词', menu: 'keywords', icon: 'Collection' },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/views/TaskView.vue'),
        meta: { title: '采集任务', desc: '词包下发到各平台的定时监听任务', menu: 'tasks', icon: 'Timer' },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('@/views/AnalyticsView.vue'),
        meta: { title: '分析报表', desc: '平台质量对比、渠道 ROI、需求主题与竞品声量', menu: 'analytics', icon: 'TrendCharts' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '设置', desc: '评分权重、AI 模型与合规策略', menu: 'settings', icon: 'Setting' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  // 与 vite.config.ts 的 base 保持一致（/radar/），否则子路径部署后路由会全部 404
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/** 登录门禁：除 public 路由外必须登录 */
router.beforeEach((to) => {
  const auth = useAuthStore(pinia)
  if (!auth.user) auth.restore()

  if (!auth.isLoggedIn && !to.meta.public) {
    return { name: 'login', query: { redirect: to.fullPath === '/' ? undefined : to.fullPath } }
  }
  if (auth.isLoggedIn && to.name === 'login') {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  const title = (to.meta?.title as string) ?? ''
  document.title = title ? `${title} · 线索雷达` : '线索雷达'
})

export default router
