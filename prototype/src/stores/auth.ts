import { defineStore } from 'pinia'
import { nowLocal } from '@/utils'

const STORAGE_KEY = 'leadradar.auth'

/** 原型阶段固定的演示账号 */
export const DEMO_ACCOUNT = {
  username: 'demo',
  password: 'demo123',
  display: '演示账号',
  role: '销售负责人',
}

export interface AuthUser {
  username: string
  display: string
  role: string
  loginAt: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    loading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
  },

  actions: {
    /** 从 localStorage 恢复登录态（刷新页面后保持登录） */
    restore() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        this.user = raw ? (JSON.parse(raw) as AuthUser) : null
      } catch {
        this.user = null
      }
    },

    async login(username: string, password: string, remember = true) {
      this.loading = true
      // 模拟一次网络请求，让 loading 态可见
      await new Promise((resolve) => setTimeout(resolve, 600))
      this.loading = false

      if (username.trim() !== DEMO_ACCOUNT.username || password !== DEMO_ACCOUNT.password) {
        throw new Error('账号或密码错误，请使用演示账号登录')
      }

      this.user = {
        username: DEMO_ACCOUNT.username,
        display: DEMO_ACCOUNT.display,
        role: DEMO_ACCOUNT.role,
        loginAt: nowLocal(),
      }

      // 勾选「记住登录状态」才落盘，否则刷新页面即登出
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
