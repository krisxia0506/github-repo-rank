# 同步问题排查指南

## 问题现象

- ✅ `cron.job_run_details` 有记录，状态 `succeeded`
- ❌ `sync_logs` 没有记录
- ❌ Edge Function 没有执行日志

## 原因分析

这说明：
1. ✅ pg_cron 定时任务正常触发
2. ✅ `trigger_repository_sync()` 函数执行完成
3. ❌ HTTP 请求没有成功发送到 Edge Function
4. ❌ Edge Function 没有被调用

## 排查步骤

### 步骤 1: 快速诊断

在 Supabase Dashboard SQL Editor 中执行：

```sql
-- 执行快速诊断脚本
```

打开并执行文件：`supabase/QUICK_DEBUG.sql`

这会检查：
- ✅ 扩展是否启用（pg_net, vault）
- ✅ Vault 密钥是否配置
- ✅ HTTP 请求历史
- ✅ Cron 任务状态

### 步骤 2: 检查 pg_net HTTP 请求日志

```sql
-- 查看最近的 HTTP 请求
SELECT
  id,
  url,
  status_code,
  content,
  error_msg,
  created
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 10;
```

**可能的结果：**

#### 情况 A: 表中没有记录
**原因**: HTTP 请求根本没有发出

**可能原因**:
1. pg_net 扩展未启用
2. Vault 密钥读取失败
3. 函数中出现异常被捕获

**解决方案**: 继续步骤 3

#### 情况 B: 有记录但有 `error_msg`
**原因**: HTTP 请求发送失败

**常见错误**:
- `Could not resolve host`: URL 错误
- `Connection refused`: 网络问题
- `Timeout`: 请求超时

**解决方案**: 检查 URL 和网络配置（步骤 4）

#### 情况 C: 有记录，`status_code` = 401
**原因**: 认证失败

**解决方案**: 检查 `anon_key` 是否正确（步骤 5）

#### 情况 D: 有记录，`status_code` = 404
**原因**: Edge Function 未部署或 URL 错误

**解决方案**: 检查 Edge Function 部署状态（步骤 6）

### 步骤 3: 验证 Vault 密钥配置

```sql
-- 3.1 检查密钥是否存在
SELECT name, created_at
FROM vault.secrets
WHERE name IN ('project_url', 'anon_key');
```

**期望结果**: 应该返回 2 行

如果没有记录：
```sql
-- 创建密钥（替换为你的实际值）
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_ANON_KEY', 'anon_key');
```

```sql
-- 3.2 验证密钥值
SELECT
  name,
  CASE
    WHEN name = 'project_url' THEN decrypted_secret
    WHEN name = 'anon_key' THEN LEFT(decrypted_secret, 30) || '...'
  END as value_preview
FROM vault.decrypted_secrets
WHERE name IN ('project_url', 'anon_key');
```

**检查**:
- `project_url` 格式应该是: `https://abcdefghijklmnop.supabase.co`（没有尾部斜杠）
- `anon_key` 应该以 `eyJ` 开头

### 步骤 4: 手动测试 HTTP 请求

```sql
-- 启用详细日志
SET client_min_messages TO NOTICE;

-- 手动发送 HTTP 请求
DO $$
DECLARE
  request_id BIGINT;
  project_url TEXT;
  anon_key TEXT;
BEGIN
  -- 读取密钥
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'anon_key';

  -- 输出信息
  RAISE NOTICE 'project_url: %', project_url;
  RAISE NOTICE 'anon_key: %', LEFT(anon_key, 20) || '...';
  RAISE NOTICE 'Full URL: %', project_url || '/functions/v1/sync-repositories';

  -- 发送请求
  SELECT INTO request_id net.http_post(
    url := project_url || '/functions/v1/sync-repositories',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'triggered_at', now()::text,
      'test', true
    )
  );

  RAISE NOTICE 'Request sent, ID: %', request_id;
END $$;
```

然后立即查看结果：
```sql
SELECT
  id,
  url,
  status_code,
  content::text as response,
  error_msg,
  created
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 1;
```

### 步骤 5: 使用 curl 测试 Edge Function

在终端执行（替换为你的实际值）:

```bash
# 方式 1: 直接使用你的值
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-repositories' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**期望响应**:
```json
{
  "success": true,
  "results": {
    "total": 0,
    "success": 0,
    "failed": 0,
    "errors": []
  }
}
```

**如果返回 404**:
- Edge Function 未部署
- URL 错误

**如果返回 401**:
- `anon_key` 错误

**如果返回 500**:
- Edge Function 内部错误
- 检查 Edge Function 日志: `supabase functions logs sync-repositories`

### 步骤 6: 检查 Edge Function 部署状态

```bash
# 查看已部署的 Edge Functions
supabase functions list

# 应该看到:
# sync-repositories

# 如果没有，重新部署
supabase functions deploy sync-repositories

# 查看部署日志
supabase functions logs sync-repositories
```

### 步骤 7: 检查 pg_net 扩展

```sql
-- 检查扩展是否启用
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

如果没有记录：
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

检查 pg_net 权限：
```sql
-- 授予权限（如果需要）
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres;
```

### 步骤 8: 重新创建函数

如果以上都正常，可能是函数有问题，重新创建：

```sql
-- 删除旧函数
DROP FUNCTION IF EXISTS trigger_repository_sync();

-- 重新创建（复制 002_setup_cron_jobs.sql 中的函数定义）
CREATE OR REPLACE FUNCTION trigger_repository_sync()
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

  -- 验证密钥
  IF project_url IS NULL THEN
    RAISE EXCEPTION 'Vault secret "project_url" not found';
  END IF;

  IF anon_key IS NULL THEN
    RAISE EXCEPTION 'Vault secret "anon_key" not found';
  END IF;

  -- 输出日志（用于调试）
  RAISE NOTICE 'Calling Edge Function at: %', project_url || '/functions/v1/sync-repositories';

  -- 发送 HTTP 请求
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

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to trigger repository sync: %', SQLERRM;
  -- 重新抛出异常以便在 cron 日志中看到
  RAISE;
END;
$$;
```

### 步骤 9: 测试完整流程

```sql
-- 1. 手动调用函数
SELECT trigger_repository_sync();

-- 2. 检查 HTTP 请求
SELECT * FROM net.http_request_queue ORDER BY created DESC LIMIT 1;

-- 3. 等待几秒后检查 sync_logs
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;

-- 4. 检查 Edge Function 日志（在终端执行）
-- supabase functions logs sync-repositories --follow
```

## 常见问题和解决方案

### 问题 1: pg_net 请求一直是 pending 状态

**原因**: pg_net worker 没有运行

**解决方案**:
```sql
-- 检查 pg_net 后台任务
SELECT net.http_collect_responses();

-- 或重启数据库（在 Supabase Dashboard）
```

### 问题 2: 401 Unauthorized

**原因**: anon_key 错误或过期

**解决方案**:
1. 在 Supabase Dashboard → Settings → API 获取正确的 anon key
2. 更新 Vault 密钥：
```sql
SELECT vault.delete_secret('anon_key');
SELECT vault.create_secret('NEW_ANON_KEY', 'anon_key');
```

### 问题 3: 404 Not Found

**原因**: Edge Function 未部署或 URL 错误

**解决方案**:
```bash
# 重新部署 Edge Function
supabase functions deploy sync-repositories

# 验证部署
supabase functions list
```

### 问题 4: Edge Function 超时

**原因**: 仓库太多，处理时间超过 Edge Function 限制（150秒）

**解决方案**:
- 减少同步频率
- 优化 Edge Function（批量处理）
- 限制每次同步的仓库数量

### 问题 5: GitHub API 限流

**原因**: 超过 GitHub API 速率限制

**解决方案**:
- 检查是否配置了 GITHUB_TOKEN
- 增加仓库之间的延迟
- 降低同步频率

## 验证修复

完成修复后，执行以下验证：

```sql
-- 1. 清空旧的 HTTP 请求记录（可选）
TRUNCATE net.http_request_queue;

-- 2. 手动触发同步
SELECT trigger_repository_sync();

-- 3. 等待 5 秒

-- 4. 检查 HTTP 请求
SELECT
  id,
  url,
  status_code,
  LEFT(content::text, 200) as response_preview,
  error_msg
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 1;

-- 5. 检查同步日志
SELECT
  repository_id,
  sync_type,
  status,
  duration_ms,
  error_message,
  started_at
FROM sync_logs
ORDER BY started_at DESC
LIMIT 5;

-- 6. 检查仓库统计是否更新
SELECT
  full_name,
  last_synced_at
FROM repositories
ORDER BY last_synced_at DESC
LIMIT 5;
```

## 获取帮助

如果问题仍未解决，收集以下信息：

```sql
-- 诊断报告
SELECT '=== DIAGNOSTICS REPORT ===' as section;

-- 扩展状态
SELECT 'Extensions' as category, extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net', 'vault');

-- Vault 密钥状态
SELECT 'Vault Secrets' as category, name, created_at
FROM vault.secrets
WHERE name IN ('project_url', 'anon_key');

-- 最近的 HTTP 请求
SELECT 'Recent HTTP Requests' as category,
       url, status_code, error_msg, created
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 3;

-- Cron 状态
SELECT 'Cron Jobs' as category, jobname, schedule, active
FROM cron.job;

-- 函数状态
SELECT 'Functions' as category, proname, prosecdef
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'trigger_repository_sync' AND n.nspname = 'public';
```

将输出结果提供，以便进一步诊断。

## 相关文件

- 完整诊断脚本: [supabase/DEBUG_SYNC_ISSUE.sql](supabase/DEBUG_SYNC_ISSUE.sql)
- 快速诊断: [supabase/QUICK_DEBUG.sql](supabase/QUICK_DEBUG.sql)
- 配置文档: [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md)
