# AGENTS.md

面向 AI agent 与人类开发者的工作契约。**动手前先读本文件，再读 `docs/README.md`。**

> **当前阶段**：只维护规范与约束文档，不落实现代码。未经明确确认，
> 不创建 `backend/`、`frontend/` 的业务代码，也不修改 `../MediaCrawler/`。

## 1. 项目定位

ClueRadar 是 TO B / 高客单场景的「意向雷达」：从公开互动中识别购买意向，
按决策阶段与身份分级，产出可解释的线索与合规互动作业单。

**它不是**联系人爬取工具、不是群发工具、不是去匿名化工具。边界见
`docs/08-合规与数据边界.md`，越界需求一律拒绝并说明原因。

## 2. 目录约定

| 路径 | 职责 | 改动规则 |
|---|---|---|
| `docs/` | 工程规范，单一事实来源 | 改行为必须同步改文档 |
| `backend/` | FastAPI 服务 | 路由薄、逻辑在 service、SQL 在 repository |
| `backend/app/api/v1/` | 路由层 | 只做参数校验与依赖注入，不写业务逻辑 |
| `backend/app/services/` | 业务逻辑 | 可被路由与任务复用 |
| `backend/app/repositories/` | 数据访问 | 唯一允许写 ORM 查询的地方 |
| `backend/app/models/` | SQLAlchemy 模型 | 与 `schemas/` 严格分离 |
| `backend/app/schemas/` | Pydantic 出入参 | 不复用 ORM 模型做响应 |
| `backend/app/crawler/` | MediaCrawler 适配 | 平台差异全部收敛在这里 |
| `backend/app/ai/` | 信号匹配与 LLM 判定 | 提示词版本化 |
| `backend/tests/` | 后端测试 | 与 app 同构的目录结构 |
| `frontend/` | 正式前端（Vite + Vue3），**唯一生产前端** | 只放正式代码，构建与部署只认这里 |
| `frontend/src/views/` | 页面级组件 | 一页一文件，路由懒加载 |
| `frontend/src/components/` | 可复用组件 | 跨页面复用才上移 |
| `frontend/src/stores/` | Pinia 状态 | 派生数据放 getter，别存冗余 state |
| `frontend/src/api/` | 后端调用封装 | 组件内不直接 `fetch` |
| `frontend/src/mock/` | 离线开发假数据 | 生产构建不得依赖 |
| `frontend/src/utils/` | 纯函数 | 无副作用、无组件依赖 |
| `prototype/` | 产品原型（Vite + Vue3） | **只作设计参考**，不接生产接口、不部署 |
| `scripts/` | 建库、隔离；测试数据 SQL（规划） | 不写上游库；种子必须可重复执行 |

新增目录前先确认 `docs/05-前端规范.md` 里是否已有约定。

## 3. 常用命令

```bash
# 正式前端骨架建成后
cd frontend

npm run dev        # http://localhost:5273/radar/
npm run build      # 构建，必须通过才能提交
npm run preview    # http://localhost:4273/radar/
```

```bash
# 仅用于交互评审：原型不是生产前端
cd prototype
npm run dev
```

```bash
cd backend

uv sync                                  # 安装依赖（Python 3.11）
uv run alembic upgrade head              # 数据库迁移
uv run uvicorn app.main:app --reload --port 8000
uv run pytest -q                         # 后端测试
uv run ruff check . && uv run ruff format --check .
```

## 4. 硬性约束

1. **不实现去匿名化。** `creator_hash`、`mask_nickname` 是既定边界，
   不写任何反查、撞库、抓取主页/头像/签名的代码。
2. **不做批量触达。** 不生成私信话术、不导出可群发的用户标识。
   作业单只描述公开互动动作。
3. **不改 MediaCrawler 脱敏层。** 上游 `tools/user_hash.py`、
   `database/models.py` 的脱敏策略视为只读。
4. **子路径不能硬编码。** 路由 base 用 `import.meta.env.BASE_URL`，
   资源路径用相对路径或 Vite 处理，禁止写死 `/radar/` 或 `/`。
5. **时间处理分清端。** 前端原型/离线数据写业务时间用 `nowLocal()`，禁止
   `new Date().toISOString()`（会产生 UTC 与本地时间 8 小时偏差，曾真实踩坑）；
   后端时间由服务端生成，数据库存 UTC，接口输出带偏移的 ISO 8601。
6. **文档与代码不一致视为缺陷。** 改了行为却没改文档，等于没改完。
7. **后端不返回可识别个人身份的数据。** 响应里只允许出现
   `creator_hash` 与掩码昵称，禁止出现原始用户 ID、主页链接、头像、手机号。
8. **密钥只从环境变量读。** 禁止把 API Key、数据库口令写进代码或提交到仓库。
9. **原型与正式前端分离。** 正式代码只写 `frontend/`；`prototype/` 只作交互参考，
   不得接生产 API、不得作为部署产物。
10. **不修改 MediaCrawler 工程。** 上游是独立项目，继续写 SQLite；
    ClueRadar 只读 `../MediaCrawler/database/sqlite_tables.db`。
    禁止改上游配置、模型、脱敏层，禁止在业务代码里写上游表。
11. **测试数据必须落 SQL。** 规划 `scripts/seed_demo.sql`，不得只交付前端 mock；
    落地时须可重复执行（固定主键 + `ON CONFLICT DO NOTHING`）。本阶段只写约定。

## 5. 代码规范要点

### 前端

- TypeScript 严格模式；新增类型放 `src/types/index.ts`。
- Vue 3 `<script setup lang="ts">`，SFC 顺序固定：`template → script → style`。
- 样式一律 `scoped`；跨组件复用的值提取到 `src/styles/main.css` 的 CSS 变量。
- 组件 props 必须带类型与默认值；事件用 `defineEmits` 显式声明。
- 业务文案集中在 `src/utils/index.ts` 的 label map，不在模板里散落硬编码。
- 命名：文件 PascalCase（组件）/ camelCase（ts）、store 用 `useXxxStore`。
- 组件不直接请求接口，统一走 `src/api/`，错误与 loading 在 store 或组合式函数里处理。

### 后端

- Python 3.11，全部公开函数带类型标注；`ruff` 负责 lint 与格式。
- 路由一律 `async def`；同步阻塞调用（如 LLM SDK 的同步客户端）必须放进
  `run_in_threadpool`，禁止阻塞事件循环。
- 分层职责：`api` 只做校验与依赖注入 → `service` 承载业务 → `repository` 唯一接触 ORM。
- Pydantic schema 与 SQLAlchemy model 分离；禁止把 ORM 对象直接作为响应返回。
- 配置用 `pydantic-settings`，全部走环境变量，`.env.example` 提供模板。
- 所有接口在 `/api/v1` 下；统一响应包与错误码见 `docs/04-接口契约.md`。
- 数据库是 PostgreSQL 15：时间用 `TIMESTAMPTZ`，结构化字段用 `JSONB`，
  主键用 `GENERATED ALWAYS AS IDENTITY`，禁止用字符串拼 SQL。
- 数据库变更必须通过 Alembic 迁移；迁移必须在空库上可正向执行、可反向回滚。
- 事务边界在 service 层：一个业务用例一个事务，禁止在事务内调用 LLM 或子进程。
- 连接走连接池（`asyncpg`），禁止在请求外长期持有 `AsyncSession`。

## 6. 验证要求

**不接受「看起来对」。** 改完必须给出可复现的验证证据：

1. `npm run build` 通过；
2. `uv run pytest -q` 通过（后端有改动时）；
3. 涉及页面/路由/登录态时，跑真实浏览器断言（Playwright），
   覆盖**正常路径 + 异常路径**；
4. 涉及 `/radar` 子路径时，必须同时验证**构建产物**（preview），
   不能只测 dev —— 历史上出现过 dev 正常、产物 404 的问题；
5. 报告里写清楚跑了多少项断言、失败几项；控制台错误要逐条确认来源。
6. 涉及测试数据时，必须验证 SQL 可重复执行（连跑两次，行数不变）；
   本阶段只写约定，不落地种子文件。

基线用例见 `docs/06-测试与验收.md`，新增功能要往里补。

## 7. 提交前检查清单

- [ ] `npm run build` 通过
- [ ] `uv run pytest -q` 通过（后端有改动时）
- [ ] 新增/修改的行为已同步到 `docs/`
- [ ] 没有引入可识别个人身份的数据字段
- [ ] 没有硬编码部署路径、端口、绝对文件路径
- [ ] 时间字段在前端用 `nowLocal()`，后端由服务端生成
- [ ] 演示数据仍能完整跑通（重置演示数据后无报错）
- [ ] 涉及种子 SQL 时，连跑两次行数不变
- [ ] 正式前端代码没有写进 `prototype/`
- [ ] 控制台无新增错误
- [ ] 新增环境变量已写入 `.env.example`

## 8. 文档维护

- 文档编号与状态标记规则见 `docs/README.md`。
- 改架构或引入新依赖 → 在 `docs/07-决策记录.md` 追加 ADR。
- 只在文档写着「规划中」的能力，不要当成已实现去引用。
