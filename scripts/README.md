# 数据库运维脚本

目标实例：本机 PostgreSQL 15（`127.0.0.1:5432`），Windows 服务 `postgresql-x64-15`。

| 项 | 值 |
|---|---|
| 主库 | `clueradar` |
| 测试库 | `clueradar_test` |
| 应用账号 | `clueradar`（无 SUPERUSER / CREATEDB / CREATEROLE） |
| 超级用户 | `postgres`（仅用于初始化，应用不使用） |
| 扩展 | 初始不启用；`pg_trgm` 待数据量上来再加 |

> **边界**：本仓库不创建、不修改 MediaCrawler 的数据库或工程文件。
> MediaCrawler 仍是独立的上游项目，ClueRadar 只读接入其 SQLite 输出
> （`../MediaCrawler/database/sqlite_tables.db`）。

## 1. 初始化

在仓库根目录打开 PowerShell：

```powershell
& "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -f scripts\init_db.sql
```

交互式执行会：

1. 提示输入 `postgres` 密码（仅用于本次连接）；
2. 提示设置 `clueradar` 应用账号密码（不落盘、不进命令行历史）；
3. 创建 `clueradar` / `clueradar_test`；
4. 把两个库的 `public` schema 所有者改为 `clueradar`；
5. 回收两个库的 `PUBLIC` CONNECT，只授权给 `clueradar`。

自动化执行（密码会出现在进程命令行，仅限本地开发）：

```powershell
& "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres `
    -v app_password="<强密码>" -f scripts\init_db.sql
```

## 2. 实例级收紧（跨库隔离）

PostgreSQL 默认把 `CONNECT` 授予 `PUBLIC`，新角色因此能连上实例上的所有库。
本脚本对除 `clueradar` / `clueradar_test` 之外的库回收 `PUBLIC` 的 `CONNECT`，
再显式授权给各库 owner：

```powershell
& "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -f scripts\harden_instance.sql
```

- 不修改表、数据或 schema；
- 数据库 owner 不受影响；
- 具有幂等性，可重复执行。

## 3. 验证

```powershell
$psql = "D:\yuehan\PostgreSQL\15\bin\psql.exe"

# 应成功
& $psql -U clueradar -d clueradar -c "select current_user, current_database();"
& $psql -U clueradar -d clueradar_test -c "select current_database();"

# 应失败：no CONNECT privilege
& $psql -U clueradar -d postgres -c "select 1;"
& $psql -U clueradar -d openease -c "select 1;"

# 角色属性：rolsuper / rolcreatedb / rolcreaterole 均应为 f
& $psql -U postgres -c "select rolname, rolsuper, rolcreatedb, rolcreaterole from pg_roles where rolname='clueradar';"
```

## 4. 连接串

写入 `backend/.env`（不提交）：

```dotenv
DATABASE_URL=postgresql+asyncpg://clueradar:<password>@127.0.0.1:5432/clueradar
TEST_DATABASE_URL=postgresql+asyncpg://clueradar:<password>@127.0.0.1:5432/clueradar_test
```

MediaCrawler 上游仍是 SQLite 文件，不新增连接串：

```dotenv
MEDIACRAWLER_DB=../MediaCrawler/database/sqlite_tables.db
```

密码只使用字母数字，避免 URL 编码问题。`backend/.env.example` 是占位模板，可提交。

## 5. 测试数据约定

- 测试数据**必须落 SQL**，不能只存在于前端 TypeScript mock 中；
- 规划文件：`scripts/seed_demo.sql`（业务库，Alembic 迁移后执行）；
- 要求可重复执行：固定主键 + `ON CONFLICT DO NOTHING`，连跑两次行数不变；
- 上游测试数据由 MediaCrawler 自己产生，本仓库不写、不改上游库。

本阶段只确定约定，不落地 SQL 文件与后端代码。

## 6. 说明

- `psql` 不在 PATH 中，使用绝对路径。
- `pg_hba.conf` 对所有本地连接要求 `scram-sha-256`，必须带密码。
- 应用账号只拥有 `clueradar` / `clueradar_test`，无法连接实例上的其他库。
- 生产环境需额外配置 `pg_dump` 定时备份与 WAL 归档，见 `docs/02-技术架构.md`。
- 备份文件包含业务数据，必须加密存放且不进仓库。
