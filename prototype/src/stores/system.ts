import { defineStore } from 'pinia'
import type { SystemSettings } from '@/types'

export const useSystemStore = defineStore('system', {
  state: () => ({
    settings: {
      llmProvider: 'deepseek',
      llmModel: 'deepseek-chat',
      llmApiKey: 'sk-****************8f2a',
      llmTemperature: 0.2,
      dailyBudget: 50,
      usedBudget: 12.6,
      maxSleepSec: 2,
      maxConcurrency: 1,
      crawlerMaxNotes: 15,
      enableProxy: false,
      publicInteractionOnly: true,
    } as SystemSettings,
    dirty: false,
  }),

  getters: {
    budgetUsedPct: (state) =>
      state.settings.dailyBudget > 0
        ? Math.min(100, Math.round((state.settings.usedBudget / state.settings.dailyBudget) * 100))
        : 0,
  },

  actions: {
    update(patch: Partial<SystemSettings>) {
      Object.assign(this.settings, patch)
      this.dirty = true
    },
    save() {
      this.dirty = false
    },
  },
})
