import { createPinia } from 'pinia'

/**
 * 显式导出 pinia 实例。
 * 路由守卫在 app.use(pinia) 之前就可能执行，必须显式传入实例，
 * 否则 useXxxStore() 会因为找不到 active pinia 而报错。
 */
export const pinia = createPinia()
