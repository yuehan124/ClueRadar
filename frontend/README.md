# ClueRadar 正式前端

> **状态：待实现。** 本目录是正式前端的唯一位置，当前只有这份说明。
> 产品原型在 [`../prototype/`](../prototype/README.md)，只作交互评审与设计参考，
> **不参与生产构建与部署**。

## 边界

| 目录 | 定位 | 构建 / 部署 |
|---|---|---|
| `frontend/` | 正式前端，接真实 API | ✅ 只认这里 |
| `prototype/` | 产品原型，Demo 数据 | ❌ 不部署 |

正式代码不得写进 `prototype/`；原型也不得接生产 API。两者目录结构保持一致，
迁移时按页面逐步替换数据源，避免一次性重写引入回归。

## 技术栈

与原型一致，保证组件与样式可直接迁移：

| 项 | 版本 | 说明 |
|---|---|---|
| Vue | 3.5 | 组合式 API + `<script setup>` |
| TypeScript | 5.x | 严格模式 |
| Vite | 6 | 开发与构建 |
| Element Plus | 2.9 | 中后台组件 |
| Pinia | 2.3 | 状态管理 |
| Vue Router | 4.5 | history 模式 |
| ECharts | 5.5 | 图表 |

后端契约见 [`../docs/04-接口契约.md`](../docs/04-接口契约.md)，编码规范见
[`../docs/05-前端规范.md`](../docs/05-前端规范.md)。

## 路径约定

| 项 | 值 |
|---|---|
| 部署入口 | `http://<ip>:<port>/radar` |
| Vite `base` | `/radar/` |
| 路由 base | `import.meta.env.BASE_URL`（禁止硬编码） |
| 外部 API 前缀 | `/radar/api/v1` |
| 后端内部前缀 | `/api/v1`（nginx 去掉 `/radar`） |
| 登录 | `POST /radar/api/v1/auth/login`，Bearer Token |

## 计划目录

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts          # base: '/radar/' + /radar/api 代理
└── src/
    ├── api/                # http 客户端、auth、leads、keywords、system
    ├── components/         # 复用组件（从原型迁移）
    ├── layouts/            # DefaultLayout
    ├── mock/               # 仅离线开发；生产构建不得依赖
    ├── router/             # 路由 + 登录守卫
    ├── stores/             # auth / leads / keywords / system
    ├── styles/             # 全局样式与 CSS 变量
    ├── types/              # 领域类型（与 API schema 对齐）
    ├── utils/              # 纯函数
    └── views/              # Login / Dashboard / Leads / LeadDetail / Keywords / Tasks / Settings
```

## 迁移顺序

1. 搭 Vite + Vue3 + TS + Element Plus + Pinia + Router 骨架，`base` 设为 `/radar/`；
2. 先接 `auth`：真实登录、Token 持久化、401 跳转、退出；
3. 接 `leads` 列表与详情：筛选、分页、状态流转、时间线；
4. 接 `keywords` / `tasks` / `settings` / `dashboard`；
5. 移除对 `src/mock/` 的运行时依赖，补 Vitest 与 Playwright。

## 验证要求

- `npm run build` 必须通过；
- dev（5273）与 preview（4273）都要验证 `/radar/` 子路径；
- 登录守卫覆盖正常路径与未登录跳转；
- 控制台零错误；
- 生产构建不得包含 mock 数据分支。
