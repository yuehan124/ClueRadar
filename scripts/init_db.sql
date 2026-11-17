-- ClueRadar 数据库初始化脚本
-- 目标实例：本机 PostgreSQL 15（127.0.0.1:5432）
-- 执行者：postgres 超级用户（仅用于建库建号，应用本身不使用该账号）
--
-- 用法（在仓库根目录）：
--   交互式（推荐）：
--     & "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -f scripts\init_db.sql
--   自动化：
--     & "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -v app_password="<强密码>" -f scripts\init_db.sql
--
-- 交互式执行时密码不会落盘或进入命令行历史；-v 方式会把密码留在进程命令行，仅限本地开发。

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- 1. 应用专用账号：只允许登录，不授予 SUPERUSER / CREATEDB / CREATEROLE
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'clueradar') THEN
        CREATE ROLE clueradar LOGIN;
        RAISE NOTICE '已创建角色 clueradar';
    ELSE
        RAISE NOTICE '角色 clueradar 已存在，跳过创建';
    END IF;
END
$$;

-- 支持两种用法：
--   1) 交互式：直接 -f 执行，脚本会提示输入应用密码
--   2) 自动化：追加 -v app_password=xxx，跳过提示
\if :{?app_password}
\else
    \prompt '请设置 clueradar 应用账号密码（至少 8 位）: ' app_password
\endif

ALTER ROLE clueradar WITH LOGIN PASSWORD :'app_password';

ALTER ROLE clueradar NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

-- ---------------------------------------------------------------------------
-- 2. 主库与测试库
-- ---------------------------------------------------------------------------
SELECT 'CREATE DATABASE clueradar OWNER clueradar ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'clueradar')\gexec

SELECT 'CREATE DATABASE clueradar_test OWNER clueradar ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'clueradar_test')\gexec

-- ---------------------------------------------------------------------------
-- 3. 收紧 schema 权限（PostgreSQL 15 起 public schema 默认不再对所有人开放 CREATE）
-- ---------------------------------------------------------------------------
\connect clueradar
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO clueradar;
ALTER SCHEMA public OWNER TO clueradar;

\connect clueradar_test
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO clueradar;
ALTER SCHEMA public OWNER TO clueradar;

-- ---------------------------------------------------------------------------
-- 4. 收紧本库的 PUBLIC 连接权限（owner 不受影响）
-- ---------------------------------------------------------------------------
REVOKE CONNECT ON DATABASE clueradar FROM PUBLIC;
REVOKE CONNECT ON DATABASE clueradar_test FROM PUBLIC;
REVOKE TEMPORARY ON DATABASE clueradar FROM PUBLIC;
REVOKE TEMPORARY ON DATABASE clueradar_test FROM PUBLIC;
GRANT CONNECT ON DATABASE clueradar TO clueradar;
GRANT CONNECT ON DATABASE clueradar_test TO clueradar;

-- 注意：PostgreSQL 没有 DENY，无法只针对 clueradar 回收其它库的连接权限。
-- 若还要禁止 clueradar 连接实例上的其它数据库（如 openease），
-- 执行 scripts/harden_instance.sql（回收其它库的 PUBLIC CONNECT）。

\echo ''
\echo '初始化完成：'
\echo '  主库   clueradar'
\echo '  测试库 clueradar_test'
\echo '  应用账号 clueradar（无超级用户权限）'
\echo ''
\echo '连接串示例（请替换密码）：'
\echo '  postgresql+asyncpg://clueradar:<password>@127.0.0.1:5432/clueradar'
