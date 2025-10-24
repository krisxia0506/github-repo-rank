# Supabase Vault 配置快速指南

本文档说明如何使用 Supabase Vault 安全地存储和管理定时任务所需的密钥。

## 什么是 Supabase Vault？

Supabase Vault 是一个加密的密钥存储系统，用于安全地存储敏感信息：
- 🔐 使用加密存储在数据库中
- 🛡️ 只有授权的数据库函数可以读取
- ✅ 符合安全最佳实践
- 🚫 不会暴露在日志或错误消息中

## 配置步骤

### 1. 启用 Vault 扩展

在 Supabase Dashboard SQL Editor 中执行：

```sql
CREATE EXTENSION IF NOT EXISTS vault;
```

### 2. 存储密钥

```sql
-- 存储项目 URL
-- 获取方式: Supabase Dashboard URL 中的域名
-- 格式: https://abcdefghijklmnop.supabase.co
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');

-- 存储 Anon Key
-- 获取方式: Supabase Dashboard → Settings → API → Project API keys → anon/public
SELECT vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');
```

**替换示例：**
```sql
-- 实际示例（不要直接复制，使用你自己的值）
SELECT vault.create_secret('https://abcdefghijklmnop.supabase.co', 'project_url');
SELECT vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'anon_key');
```

### 3. 验证密钥已存储

```sql
-- 查看所有密钥（不显示值）
SELECT id, name, description, created_at, updated_at
FROM vault.secrets;
```

**预期输出：**
```
 id | name         | description | created_at           | updated_at
----+--------------+-------------+----------------------+----------------------
  1 | project_url  | NULL        | 2024-10-24 10:00:00  | 2024-10-24 10:00:00
  2 | anon_key     | NULL        | 2024-10-24 10:01:00  | 2024-10-24 10:01:00
```

### 4. 测试读取密钥

```sql
-- 测试读取（仅用于验证配置）
SELECT
  (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') as project_url,
  (SELECT
     CASE
       WHEN decrypted_secret IS NOT NULL THEN 'Bearer ' || LEFT(decrypted_secret, 20) || '...'
       ELSE '[MISSING]'
     END
   FROM vault.decrypted_secrets
   WHERE name = 'anon_key') as anon_key_preview;
```

**预期输出：**
```
 project_url                                  | anon_key_preview
----------------------------------------------+-------------------
 https://abcdefghijklmnop.supabase.co        | Bearer eyJhbGciOiJIUzI1N...
```

## 在函数中使用 Vault 密钥

### 读取密钥

```sql
DECLARE
  project_url TEXT;
  anon_key TEXT;
BEGIN
  -- 从 Vault 读取密钥
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'anon_key';

  -- 验证密钥存在
  IF project_url IS NULL THEN
    RAISE EXCEPTION 'Vault secret "project_url" not found';
  END IF;

  -- 使用密钥
  PERFORM net.http_post(
    url := project_url || '/functions/v1/my-function',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key
    )
  );
END;
```

### 完整示例：调用 Edge Function

```sql
CREATE OR REPLACE FUNCTION call_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id BIGINT;
  project_url TEXT;
  anon_key TEXT;
BEGIN
  -- 读取 Vault 密钥
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'anon_key';

  -- 调用 Edge Function
  SELECT INTO request_id net.http_post(
    url := project_url || '/functions/v1/sync-repositories',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'triggered_at', now()::text
    )
  );

  RAISE NOTICE 'HTTP request sent, request_id: %', request_id;
END;
$$;
```

## 管理密钥

### 更新密钥

```sql
-- 方式 1: 使用 update_secret (如果支持)
-- SELECT vault.update_secret('new_value', 'secret_name');

-- 方式 2: 删除后重新创建
SELECT vault.delete_secret('project_url');
SELECT vault.create_secret('https://NEW_PROJECT_REF.supabase.co', 'project_url');
```

### 删除密钥

```sql
SELECT vault.delete_secret('project_url');
SELECT vault.delete_secret('anon_key');
```

### 查询密钥使用情况

```sql
-- 查看哪些函数使用了 Vault
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%vault.decrypted_secrets%'
  AND n.nspname = 'public';
```

## 安全最佳实践

### ✅ 推荐做法

1. **使用 Vault 存储所有敏感信息**
   ```sql
   -- API Keys
   SELECT vault.create_secret('sk_live_xxx', 'stripe_api_key');

   -- Webhook URLs
   SELECT vault.create_secret('https://hooks.slack.com/xxx', 'slack_webhook_url');

   -- Database credentials (if needed)
   SELECT vault.create_secret('password123', 'external_db_password');
   ```

2. **使用 SECURITY DEFINER 函数**
   ```sql
   CREATE OR REPLACE FUNCTION my_function()
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER  -- 以函数所有者权限运行
   AS $$ ... $$;
   ```

3. **限制函数权限**
   ```sql
   -- 只允许特定角色执行
   REVOKE ALL ON FUNCTION trigger_repository_sync() FROM PUBLIC;
   GRANT EXECUTE ON FUNCTION trigger_repository_sync() TO authenticated;
   ```

4. **添加密钥描述**
   ```sql
   -- 创建时添加描述（如果支持）
   -- 或在 vault.secrets 表中更新
   UPDATE vault.secrets
   SET description = 'Supabase project URL for Edge Functions'
   WHERE name = 'project_url';
   ```

### ❌ 避免的做法

1. **不要在代码中硬编码密钥**
   ```sql
   -- ❌ 错误
   url := 'https://abcdefghijklmnop.supabase.co';

   -- ✅ 正确
   SELECT decrypted_secret INTO url
   FROM vault.decrypted_secrets
   WHERE name = 'project_url';
   ```

2. **不要使用环境变量存储敏感信息（在 SQL 函数中）**
   ```sql
   -- ❌ 错误（可能暴露在日志中）
   url := current_setting('app.project_url');

   -- ✅ 正确
   SELECT decrypted_secret INTO url
   FROM vault.decrypted_secrets
   WHERE name = 'project_url';
   ```

3. **不要在日志中输出密钥**
   ```sql
   -- ❌ 错误
   RAISE NOTICE 'Using key: %', anon_key;

   -- ✅ 正确
   RAISE NOTICE 'Using key: [REDACTED]';
   ```

## 常见问题

### Q1: 如何获取 Project URL？

**A:** 查看 Supabase Dashboard 的 URL：
```
https://supabase.com/dashboard/project/abcdefghijklmnop
                                       ^^^^^^^^^^^^^^^^^^
                                       这是你的 PROJECT_REF
```

完整 URL: `https://abcdefghijklmnop.supabase.co`

### Q2: 如何获取 Anon Key？

**A:** 在 Supabase Dashboard:
1. 进入 Settings → API
2. 找到 "Project API keys"
3. 复制 "anon" / "public" key (以 `eyJ` 开头)

### Q3: Vault 密钥会过期吗？

**A:** 不会，Vault 密钥永久有效，除非手动删除或更新。

### Q4: 可以在客户端代码中读取 Vault 密钥吗？

**A:** 不能，Vault 密钥只能在 `SECURITY DEFINER` 的数据库函数中读取，不能从客户端直接访问。

### Q5: 如何备份 Vault 密钥？

**A:** 将密钥安全地存储在密码管理器中（如 1Password、Bitwarden）：
```sql
-- 导出密钥（仅在安全环境中执行）
SELECT name, decrypted_secret
FROM vault.decrypted_secrets
WHERE name IN ('project_url', 'anon_key');
```

## 迁移指南

### 从环境变量迁移到 Vault

**旧方式 (不推荐):**
```sql
ALTER DATABASE postgres SET app.project_url = 'https://xxx.supabase.co';
ALTER DATABASE postgres SET app.anon_key = 'eyJxxx';

-- 使用
url := current_setting('app.project_url');
```

**新方式 (推荐):**
```sql
SELECT vault.create_secret('https://xxx.supabase.co', 'project_url');
SELECT vault.create_secret('eyJxxx', 'anon_key');

-- 使用
SELECT decrypted_secret INTO url
FROM vault.decrypted_secrets
WHERE name = 'project_url';
```

**迁移步骤：**
1. 创建 Vault 密钥
2. 更新函数使用 Vault
3. 删除旧的环境变量
4. 测试功能

## 相关资源

- [Supabase Vault 官方文档](https://supabase.com/docs/guides/database/vault)
- [pg_net 文档](https://github.com/supabase/pg_net)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
