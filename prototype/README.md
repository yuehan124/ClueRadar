# 线索雷达 · 产品原型

> **这是产品原型，不是正式前端。** 正式代码在 [`../frontend/`](../frontend/README.md)，
> 构建与部署只认那里。本目录只用于交互评审与设计参考，可以随时重做或删除。

基于 MediaCrawler 采集数据的 **AI 获客工具** 可交互原型。Vite + Vue3 + Element Plus + ECharts，全部使用 Demo 数据，无需后端即可运行。

## 快速开始

```bash
cd prototype
npm install
npm run dev        # http://localhost:5273/radar/
```

```bash
npm run build      # 产物输出到 dist/
npm run preview    # http://localhost:4273/radar/
```

## 部署到 /radar 子路径

应用固定部署在 `/radar/` 下，入口就是 **`http://<ip>:<port>/radar`**。

需要保持一致的有三处：

| 位置 | 值 |
|---|---|
| `vite.config.ts` → `base` | `/radar/` ← **唯一需要改的地方** |
| `src/router/index.ts` | `createWebHistory(import.meta.env.BASE_URL)`，自动读取上面的 `base` |
| 反向代理 / 静态服务器 | 把 `/radar/` 指向 `dist/` 目录 |

路由 base 特意写成 `import.meta.env.BASE_URL` 而不是硬编码字符串，避免改了 `base` 却忘了改路由。

### 根路径与尾斜杠

| 请求 | 结果 |
|---|---|
| `/` | 302 → `/radar/` |
| `/radar`（不带尾斜杠） | 302 → `/radar/` |
| `/radar/` | 200 |

dev / preview 服务器上，尾斜杠跳转由 `vite.config.ts` 里的 `baseTrailingSlash()` 插件补的——
因为 Vite 只认 `/radar/`，直接访问 `/radar` 会 404，而需求里写的正是 `http://ip:port/radar`。
nginx 等真实静态服务器会自己 301，不依赖这个插件。

### nginx 示例

路由用的是 history 模式，**必须**把找不到的路径回退到 `index.html`，
否则刷新 `/radar/leads` 会 404：

```nginx
location = /radar {
    return 301 /radar/;
}

location /radar/ {
    alias /var/www/leadradar/dist/;
    try_files $uri $uri/ /radar/index.html;
}
```

> 不想配 `try_files` 的话，可以把路由换成 hash 模式（`createWebHashHistory`），
> 代价是 URL 里多一个 `#`。

### 局域网访问

`vite.config.ts` 里 `server.host` 和 `preview.host` 都是 `true`，会监听 `0.0.0.0`，
启动日志会直接打印可用的局域网地址（例如 `http://192.168.x.x:5273/radar/`），可直接给同事演示。

## 登录

**必须登录才能访问任何业务页面。** 原型使用固定演示账号：

| 账号 | 密码 |
|---|---|
| `demo` | `demo123` |

登录页有「一键填入」按钮，免手输。

门禁行为：

- 未登录访问任意业务路由 → 跳转 `/login?redirect=<原路径>`，登录成功后自动回跳
- 已登录访问 `/login` → 自动跳回首页
- 勾选「记住登录状态」（默认勾选）时登录态写入 `localStorage`，刷新不丢；取消勾选则刷新即登出
- 右上角头像菜单可退出登录，退出后业务路由再次被拦截

实现要点：`src/stores/auth.ts` 账号校验 + `src/router/index.ts` 的 `beforeEach` 全局守卫。
守卫通过 `useAuthStore(pinia)` 显式传入 Pinia 实例（见 `src/stores/index.ts`），
避免在 `app.use(pinia)` 之前执行时取不到 active pinia。

## 页面一览

下表是路由段，实际访问地址 = `/radar` + 路由（如 `/radar/leads`）。

| 路由 | 页面 | 核心内容 |
|---|---|---|
| `/login` | 登录 | 账号密码登录，固定演示账号，带门禁与回跳 |
| `/` | 概览 | KPI、今日线索播报、决策阶段漏斗、跟进状态、竞品提及、需求主题分布 |
| `/leads` | 线索池 | 多条件筛选 + 线索分级表格 + 详情抽屉 |
| `/keywords` | 词包管理 | 四层信号体系（噪声/意向/身份/阶段）词库维护 |
| `/tasks` | 采集任务 | 词包下发到各平台的定时监听任务 |
| `/analytics` | 分析报表 | 平台质量对比、渠道 ROI、需求主题、竞品声量 |
| `/settings` | 设置 | 评分权重（实时预览）、AI 模型、采集策略、合规策略 |

## 值得演示的交互点

1. **直接访问 `http://localhost:5273/radar/leads`** —— 被拦截到登录页；用错误密码失败一次，再点「一键填入」登录，注意自动回跳到了 `/radar/leads`
2. **打开任意线索的详情抽屉** —— 原帖信息 → 命中词在原文中高亮 → 信号明细 → 评分构成 → 公开互动作业单 → 跟进时间线
3. **在抽屉里改状态 / 加跟进记录** —— 时间线实时更新
4. **去「设置」拖动评分权重滑块** —— 右侧「排序实时预览」的排名和升降箭头立即变化；再回到「线索池」看排序已重排
5. **在「线索池」调整筛选**（阶段 / 身份 / 最低分 / 关键词）—— 观察命中数量和排序
6. **在「词包管理」新增一个信号词** —— 四层信号的统计数字随之变化
7. **在「采集任务」点「立即运行」** —— 状态变 running，1.5 秒后回 idle 且抓取量增加
8. **右上角头像 → 退出登录** —— 回到登录页，再次访问业务页面被拦截
9. **顶部「重置演示数据」** —— 一键恢复初始状态

## 设计要点

### 为什么是「意向雷达」而不是「名单工厂」

本原型的数据源是 **脱敏版 MediaCrawler**（见项目根目录 `database/models.py:19-25`）：

- 不落库：用户 ID、主页链接、头像、签名、性别、IP 归属地
- 用户 ID → `creator_hash`（sha256 前 16 位）
- 昵称 → `mask_nickname` 中间脱敏（如「老***板」）

因此产品不产出可触达名单，而是产出 **「去哪条内容下、做什么、怎么说」的作业单**，由人工以平台公开互动方式执行。原型中：

- 详情抽屉的「公开互动作业单」是唯一的触达模块
- 「设置 → 合规策略」中「仅公开互动模式」为默认开启
- 数据列为 `creator_hash` 与脱敏昵称，与爬虫侧字段一一对应

### TO B 高客单的评分模型

评分 = Σ(权重ᵢ × 单项得分ᵢ) / Σ(权重ᵢ)，无效线索（噪声 / 同行）直接归零。

| 维度 | 默认权重 | 说明 |
|---|---|---|
| 意向词强度 | 30 | 「有推荐的」「报个价」「能开专票」 |
| 决策阶段 | 25 | 认知 30 / 考察 60 / 对比 85 / 决策 100 |
| 身份信号 | 20 | 企业主 100 / 经办人 85 / 影响者 60 / 个人 45 / 同行 0 |
| 需求具体度 | 10 | 是否给出预算、规模、时间等约束 |
| 时效性 | 10 | 越新越高，48 小时后衰减到最低 |
| 互动热度 | 5 | 点赞与子评论数 |

权重全部可在「设置」中调整，且**调整即时反映到全站排序**（`src/stores/leads.ts` 的 `scored` getter）。

### 四层信号体系

```
第 1 层 噪声词  → 先砍掉无效互动与同行广告
第 2 层 意向词  → 有没有需求
第 3 层 身份词  → 是不是真采购方（TO B 最高价值）
第 4 层 阶段词  → 该不该现在跟进
```

## 目录结构

```
prototype/
├── src/
│   ├── components/
│   │   ├── EChart.vue              # ECharts 封装
│   │   ├── LeadBriefCard.vue       # 线索播报卡片
│   │   ├── LeadDetailDrawer.vue    # 线索详情抽屉（核心）
│   │   └── StatCard.vue
│   ├── layouts/DefaultLayout.vue
│   ├── mock/
│   │   ├── leads.ts                # 24 条演示线索（含 4 条无效，用于演示过滤）
│   │   └── keywords.ts             # 信号词库 + 采集任务
│   ├── router/index.ts            # 路由 + 登录守卫
│   ├── stores/
│   │   ├── index.ts                # 显式导出 pinia 实例（供路由守卫使用）
│   │   ├── auth.ts                 # 登录态、账号校验
│   │   ├── leads.ts                # 线索 + 筛选 + 评分权重
│   │   ├── keywords.ts             # 词包 + 任务
│   │   └── system.ts               # 系统设置
│   ├── types/index.ts
│   ├── utils/
│   │   ├── index.ts                # 评分引擎、标签映射、时间格式化
│   │   └── actionSheet.ts          # 公开互动作业单生成
│   └── views/                      # 7 个页面（含 LoginView）
└── vite.config.ts
```

## 后续接后端的映射

| 前端 Store | 建议接口 | 数据表 |
|---|---|---|
| `stores/auth.ts` | `POST /api/auth/login`、`POST /api/auth/logout` | `sys_user`（替代写死的 demo/demo123） |
| `stores/leads.ts` | `GET /api/leads`、`PATCH /api/leads/{id}` | `lead`、`lead_signal`、`lead_activity` |
| `stores/keywords.ts` | `GET/POST /api/keywords`、`GET/POST /api/tasks` | `keyword_pack`、`crawl_job` |
| `stores/system.ts` | `GET/PUT /api/settings` | `system_config` |
| 概览 / 报表的 getters | `GET /api/stats/*` | 聚合查询 |

替换方式：把 `src/mock/*` 的静态数组换成 API 调用，Pinia store 的 getters 结构可以保持不变。

## 尚未实现

- 真实的账号体系与权限（当前是写死的 `demo/demo123`，无鉴权接口、无角色权限、无 token 校验；前端门禁只能防误入，不能防绕过）
- 真实 LLM 调用（当前阶段/身份判定为 Demo 预置值，非模型输出）
- WebSocket 实时推送新线索
- 移动端适配
