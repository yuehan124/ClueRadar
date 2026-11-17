-- 实例级收紧：禁止 PUBLIC 连接非 ClueRadar 数据库
--
-- 背景：PostgreSQL 默认把 CONNECT 授予 PUBLIC，任何新角色都能连上所有库。
--       本脚本对除 clueradar / clueradar_test 之外的库回收 PUBLIC 的 CONNECT，
--       再把 CONNECT 显式授予各库的 owner。
--
-- 影响范围：
--   - 数据库 owner 不受影响（owner 权限不经 PUBLIC）；
--   - 未显式授权的角色将无法连接这些库；
--   - 不修改任何表、数据或 schema。
--
-- 用法（仓库根目录）：
--   & "D:\yuehan\PostgreSQL\15\bin\psql.exe" -U postgres -f scripts\harden_instance.sql

\set ON_ERROR_STOP on

DO $$
DECLARE
    db record;
BEGIN
    FOR db IN
        SELECT datname, pg_get_userbyid(datdba) AS owner
        FROM pg_database
        WHERE datistemplate = false
          AND datname NOT IN ('clueradar', 'clueradar_test')
    LOOP
        EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', db.datname);
        EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I', db.datname, db.owner);
        RAISE NOTICE '已收紧 %（owner=%）', db.datname, db.owner;
    END LOOP;
END
$$;

\echo ''
\echo '完成。验证：以 clueradar 连接其他库应被拒绝。'
