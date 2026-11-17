import { defineStore } from 'pinia'
import type { CrawlTask, Keyword, Platform, SignalKind } from '@/types'
import { nowLocal } from '@/utils'
import { DEMO_KEYWORDS, DEMO_TASKS } from '@/mock/keywords'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

let seq = 1000

export const useKeywordStore = defineStore('keywords', {
  state: () => ({
    keywords: clone(DEMO_KEYWORDS) as Keyword[],
    tasks: clone(DEMO_TASKS) as CrawlTask[],
  }),

  getters: {
    byKind: (state) => (kind: SignalKind) => state.keywords.filter((k) => k.kind === kind),

    kindStats(): Record<SignalKind, { words: number; hits: number; enabled: number }> {
      const kinds: SignalKind[] = ['noise', 'intent', 'identity', 'stage']
      const out = {} as Record<SignalKind, { words: number; hits: number; enabled: number }>
      kinds.forEach((k) => {
        const list = this.keywords.filter((x) => x.kind === k)
        out[k] = {
          words: list.length,
          hits: list.reduce((s, x) => s + x.hitCount, 0),
          enabled: list.filter((x) => x.enabled).length,
        }
      })
      return out
    },

    packOptions(): string[] {
      return [...new Set(this.keywords.map((k) => k.pack))]
    },

    taskStats(): { total: number; enabled: number; running: number; failed: number; crawled: number; newLeads: number } {
      return {
        total: this.tasks.length,
        enabled: this.tasks.filter((t) => t.enabled).length,
        running: this.tasks.filter((t) => t.status === 'running').length,
        failed: this.tasks.filter((t) => t.status === 'failed').length,
        crawled: this.tasks.reduce((s, t) => s + t.crawledCount, 0),
        newLeads: this.tasks.reduce((s, t) => s + t.newLeadCount, 0),
      }
    },
  },

  actions: {
    addKeyword(payload: { word: string; kind: SignalKind; pack: string; platforms: Platform[]; weight: number }) {
      seq += 1
      this.keywords.unshift({
        id: `KW-${seq}`,
        word: payload.word,
        kind: payload.kind,
        pack: payload.pack,
        platforms: payload.platforms,
        weight: payload.weight,
        hitCount: 0,
        enabled: true,
      })
    },

    updateKeyword(id: string, patch: Partial<Keyword>) {
      const item = this.keywords.find((k) => k.id === id)
      if (item) Object.assign(item, patch)
    },

    removeKeyword(id: string) {
      this.keywords = this.keywords.filter((k) => k.id !== id)
    },

    toggleTask(id: string, enabled: boolean) {
      const task = this.tasks.find((t) => t.id === id)
      if (task) task.enabled = enabled
    },

    runTask(id: string) {
      const task = this.tasks.find((t) => t.id === id)
      if (!task) return
      task.status = 'running'
      window.setTimeout(() => {
        const t = this.tasks.find((x) => x.id === id)
        if (!t) return
        t.status = 'idle'
        t.lastRunAt = nowLocal()
        t.crawledCount += Math.floor(40 + Math.random() * 120)
        t.newLeadCount += Math.floor(Math.random() * 4)
      }, 1500)
    },

    addTask(payload: { name: string; packs: string[]; platforms: Platform[]; schedule: string }) {
      seq += 1
      this.tasks.unshift({
        id: `TASK-${String(seq).slice(-2)}`,
        name: payload.name,
        packs: payload.packs,
        platforms: payload.platforms,
        schedule: payload.schedule,
        enabled: true,
        lastRunAt: '',
        crawledCount: 0,
        newLeadCount: 0,
        status: 'idle',
      })
    },

    removeTask(id: string) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
    },
  },
})
