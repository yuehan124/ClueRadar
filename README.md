# ClueRadar · 线索雷达

面向 **TO B / 高客单** 业务的 AI 获客工具。从社交媒体公开互动中识别真实购买意向，
按决策阶段与身份分级，输出「值得跟的线索」与「合规互动作业单」。

> 产品代号 `ClueRadar`，界面展示名「线索雷达」。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3.5 + TypeScript + Vite 6 + Element Plus 2.9 + Pinia 2.3 + ECharts 5 |
| 后端 | Python 3.11 + FastAPI + Pydantic v2 + SQLAlchemy 2 + Alembic |
| 数据库 | PostgreSQL 15（本机实例，`127.0.0.1:5432`） |
| 采集 | MediaCrawler（独立上游项目，保持 SQLite 输出，只读接入，不在本仓库修改） |
| 部署 | nginx 子路径 `/radar` + uvicorn |

## 当前阶段

**交互原型（Demo 数据）** — 前端可完整演示，无后端、无真实采集、无真实 LLM 调用。

> **本阶段范围**：只升级开发约束文档（目录边界、上游只读、测试数据落 SQL），
> 不新增后端、前端或种子 SQL 代码。

| 能力 | 状态 |
|---|---|
| 前端 6 个业务页面 + 登录页 | ✅ 已实现（原型） |
| 四层信号体系与加权评分 | ✅ 已实现（前端规则版） |
| 线索详情、跟进时间线、作业单生成 | ✅ 已实现 |
| 子路径 `/radar` 部署 | ✅ 已实现 |
| FastAPI 后端与数据库 | 🚧 规划中（规范已定，未落代码） |
| 真实数据接入（MediaCrawler SQLite → 归一化 → ClueRadar） | 🚧 规划中（上游只读，不修改 MediaCrawler） |
| 测试数据落 SQL 的约定 | ✅ 已写入文档（种子文件待落地） |
| LLM 判定阶段 / 身份 | 🚧 规划中 |
| 真实账号体系与鉴权 | 🚧 规划中 |

## 目录结构

```
ClueRadar/
├── README.md                  # 本文件：项目简介与入口
├── AGENTS.md                  # AI agent / 开发者的工作契约
├── .gitignore
├── docs/                      # 工程规范文档（先读 docs/README.md）
│   ├── README.md              # 文档索引与维护规则
│   ├── 01-需求规格.md
│   ├── 02-技术架构.md
│   ├── 03-数据模型.md
│   ├── 04-接口契约.md
│   ├── 05-前端规范.md
│   ├── 06-测试与验收.md
│   ├── 07-决策记录.md
│   └── 08-合规与数据边界.md
├── backend/                   # FastAPI 服务（规划中，规范见 docs/02、03、04）
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── api/v1/            # 路由层
│   │   ├── services/          # 业务逻辑
│   │   ├── repositories/      # 数据访问
│   │   ├── models/            # SQLAlchemy ORM
│   │   ├── schemas/           # Pydantic
│   │   ├── crawler/           # MediaCrawler 适配层
│   │   ├── ai/                # 信号与 LLM 判定
│   │   └── core/              # 配置、鉴权、日志、异常
│   ├── tests/
│   ├── .env.example           # 环境变量模板（连接串、JWT、LLM）
│   └── pyproject.toml
├── frontend/                  # 正式前端（待实现，规范见 docs/05）
│   └── README.md
├── prototype/                 # 产品原型（交互评审用，不参与生产构建）
│   ├── src/
│   └── README.md              # 原型自身的页面与交互说明
└── scripts/                   # 数据库与运维脚本
    ├── init_db.sql            # 建库（clueradar / clueradar_test）
    ├── harden_instance.sql    # 实例级跨库隔离
    └── README.md              # 含测试数据落 SQL 的约定
```

> **目录边界**：`prototype/` 只放产品原型，正式前端代码一律写进 `frontend/`。
> 原型可以随时被替换或删除，生产构建与部署只认 `frontend/`。


## 快速开始

### 1. 产品原型（只看交互，不接后端）

```bash
cd prototype
npm install
npm run dev        # http://localhost:5273/radar/
npm run build      # 产物输出到 prototype/dist/
npm run preview    # http://localhost:4273/radar/
```

登录账号：`demo` / `demo123`（固定演示账号，非真实鉴权）。

> 这是产品原型，不是正式前端。正式代码请放 `frontend/`，不要把原型接上生产接口直接上线。

### 2. 数据库（本阶段只确定约定）

```powershell
# 首次：建库（clueradar / clueradar_test），会提示设置应用账号密码
& "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -f scripts\init_db.sql

# 首次（推荐）：实例级跨库隔离，回收其它库的 PUBLIC CONNECT
& "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -f scripts\harden_instance.sql
```

数据库使用本机 PostgreSQL 15（`127.0.0.1:5432`），业务库 `clueradar`，
应用专用账号 `clueradar`，不使用 `postgres` 超级用户连接应用。
MediaCrawler 仍是独立的上游项目，继续输出 SQLite，ClueRadar 只读接入，
**不在本仓库修改其工程或数据库**。初始化细节见 [scripts/README.md](scripts/README.md)。

测试数据约定：必须落 SQL（规划 `scripts/seed_demo.sql`），不得只交付前端 mock；
要求固定主键 + `ON CONFLICT DO NOTHING`，可重复执行。本阶段只写约定，不落地文件。

### 3. 后端（规划中，代码尚未创建）

```powershell
cd backend
uv sync
Copy-Item .env.example .env    # 填入本地 PostgreSQL 连接串
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
# OpenAPI 文档：http://127.0.0.1:8000/api/docs
```


### 4. 正式前端（待实现）

规范见 [docs/05-前端规范.md](docs/05-前端规范.md)，目录说明见 [frontend/README.md](frontend/README.md)。
部署到 `/radar` 子路径、nginx 配置、尾斜杠处理等细节见
**[prototype/README.md](prototype/README.md#部署到-radar-子路径)**（迁移到 `frontend/` 时沿用同一套配置）。


## 文档入口

| 想了解 | 看这里 |
|---|---|
| 产品做什么、不做什么 | [docs/01-需求规格.md](docs/01-需求规格.md) |
| 系统怎么分层、怎么部署 | [docs/02-技术架构.md](docs/02-技术架构.md) |
| 数据表与字段 | [docs/03-数据模型.md](docs/03-数据模型.md) |
| 前后端接口约定 | [docs/04-接口契约.md](docs/04-接口契约.md) |
| 前端编码约定 | [docs/05-前端规范.md](docs/05-前端规范.md) |
| 怎么算验收通过 | [docs/06-测试与验收.md](docs/06-测试与验收.md) |
| 为什么这么选型 | [docs/07-决策记录.md](docs/07-决策记录.md) |
| 合规红线与数据边界 | [docs/08-合规与数据边界.md](docs/08-合规与数据边界.md) |

## 合规声明

- 数据源为 [MediaCrawler](https://github.com/NanmiCoder/MediaCrawler)（**脱敏版**），
  原始用户标识在入库前已哈希 / 掩码，本项目**不还原、不存储**可识别身份的信息。
- MediaCrawler 采用 NON-COMMERCIAL LEARNING LICENSE 1.1，**禁止商业使用**。
  本项目仅用于学习研究，不提供批量触达、私信群发、联系方式抓取能力。
- 产品输出是「去哪、做什么、怎么说」的作业单，由人工在平台内以**公开互动**方式执行。

红线清单见 [docs/08-合规与数据边界.md](docs/08-合规与数据边界.md)。
