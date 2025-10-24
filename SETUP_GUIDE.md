# GitHub 仓库自动同步 - 完整配置指南

## 🎯 配置目标

实现 GitHub 仓库数据每 5 分钟自动同步到 Supabase 数据库。

## 📋 架构说明

```
pg_cron (每5分钟)
    ↓
trigger_repository_sync() (数据库函数)
    ↓
读取 Vault 密钥 (project_url + publishable_key)
    ↓
HTTP POST → Supabase Edge Function
    ↓
调用 GitHub API 获取数据
    ↓
更新数据库 (repositories + repository_stats)
    ↓
记录日志 (sync_logs)
```

## 🚀 部署步骤

### 步骤 1: 准备 Supabase CLI（5 分钟）

```bash
# 安装 Supabase CLI
brew install supabase/tap/supabase

# 登录 Supabase
supabase login

# 链接到你的项目（在 Supabase Dashboard 获取 PROJECT_REF）
supabase link --project-ref YOUR_PROJECT_REF
```

### 步骤 2: 配置 GitHub Token（2 分钟）

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：`public_repo`, `read:org`, `read:user`
4. 生成并复制 token

```bash
# 设置 GitHub Token 到 Edge Function
supabase secrets set GITHUB_TOKEN=ghp_your_token_here
```

### 步骤 3: 部署 Edge Function（1 分钟）

```bash
# 部署 Edge Function
supabase functions deploy sync-repositories

# 验证部署成功
supabase functions list
```

你应该看到：
```
sync-repositories
```

### 步骤 4: 配置 Vault 密钥（2 分钟）

在 **Supabase Dashboard → SQL Editor** 中执行：

```sql
-- 1. 配置项目 URL（替换为你的项目引用）
-- 格式: https://YOUR_PROJECT_REF.supabase.co（注意：没有尾部斜杠）
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');

-- 2. 配置 Publishable Key
-- 获取方式: Supabase Dashboard → Settings → API → Project API keys → anon/public key
SELECT vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');

-- 3. 验证密钥已配置
SELECT name, created_at FROM vault.secrets ORDER BY name;
```

你应该看到：
```
name            | created_at
----------------+------------------------
project_url     | 2024-10-24 13:00:00
publishable_key | 2024-10-24 13:00:00
```

### 步骤 5: 运行数据库 Migration（1 分钟）

```bash
# 方式 A: 使用 CLI
supabase db push
```

或

```
方式 B: 在 Supabase Dashboard SQL Editor 中
打开并执行文件: supabase/migrations/002_setup_cron_jobs.sql
```

### 步骤 6: 验证配置（2 分钟）

在 **SQL Editor** 中执行：

```sql
-- 1. 检查扩展是否启用
SELECT extname FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net', 'vault');
-- 应该返回 3 行

-- 2. 检查 Vault 密钥
SELECT name FROM vault.secrets ORDER BY name;
-- 应该返回: project_url, publishable_key

-- 3. 检查定时任务
SELECT jobname, schedule, active FROM cron.job;
-- 应该看到: repository-sync-every-5min | */5 * * * * | t

-- 4. 手动触发测试
SET client_min_messages TO NOTICE;
SELECT trigger_repository_sync();

-- 5. 查看 HTTP 请求结果
SELECT
  url,
  status_code,
  error_msg,
  created
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 1;
-- 期望: status_code = 200, error_msg = null

-- 6. 查看同步日志（等待几秒后执行）
SELECT
  repository_id,
  status,
  started_at,
  duration_ms
FROM sync_logs
ORDER BY started_at DESC
LIMIT 5;
-- 期望: 有新的同步记录
```

## ✅ 成功标志

所有配置成功后，你应该看到：

1. ✅ 扩展已启用：`pg_cron`, `pg_net`, `vault`
2. ✅ Vault 密钥已配置：`project_url`, `publishable_key`
3. ✅ 定时任务已调度：`repository-sync-every-5min`
4. ✅ 手动测试成功：HTTP 请求返回 `status_code = 200`
5. ✅ 同步日志有记录：`sync_logs` 表有新数据
6. ✅ 仓库数据已更新：`repositories.last_synced_at` 时间更新

## 📊 监控命令

### 查看定时任务执行情况

```sql
-- 查看最近 10 次执行
SELECT
  j.jobname,
  jrd.start_time,
  jrd.status,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 10;
```

### 查看同步统计

```sql
-- 今天的同步统计
SELECT
  status,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration_ms
FROM sync_logs
WHERE started_at >= CURRENT_DATE
GROUP BY status;
```

### 查看最近同步的仓库

```sql
SELECT
  r.full_name,
  r.last_synced_at,
  rs.stars_count,
  rs.forks_count
FROM repositories r
LEFT JOIN repository_stats rs ON rs.repository_id = r.id
WHERE rs.snapshot_date = CURRENT_DATE
ORDER BY r.last_synced_at DESC
LIMIT 10;
```

### 查看 Edge Function 日志

```bash
# 实时查看日志
supabase functions logs sync-repositories --follow

# 查看最近的日志
supabase functions logs sync-repositories
```

## ⚙️ 常用管理操作

### 修改同步频率

```sql
-- 取消现有任务
SELECT cron.unschedule('repository-sync-every-5min');

-- 创建新任务（例如：每 15 分钟）
SELECT cron.schedule(
  'repository-sync-every-15min',
  '*/15 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 暂停自动同步

```sql
SELECT cron.unschedule('repository-sync-every-5min');
```

### 恢复自动同步

```sql
SELECT cron.schedule(
  'repository-sync-every-5min',
  '*/5 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 手动触发同步

```sql
-- 在 SQL Editor 中
SELECT trigger_repository_sync();
```

或使用 curl：

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-repositories' \
  -H "Authorization: Bearer YOUR_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json"
```

### 更新 Vault 密钥

```sql
-- 删除旧密钥
SELECT vault.delete_secret('publishable_key');

-- 创建新密钥
SELECT vault.create_secret('NEW_PUBLISHABLE_KEY', 'publishable_key');
```

## 🔧 故障排查

### 问题 1: 定时任务未执行

**检查**:
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%sync%';
```

**解决**:
```sql
-- 重新创建定时任务
SELECT cron.schedule(
  'repository-sync-every-5min',
  '*/5 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 问题 2: HTTP 请求失败

**检查**:
```sql
SELECT url, status_code, error_msg
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 5;
```

**常见错误**:
- `status_code = 401`: Publishable Key 错误
- `status_code = 404`: Edge Function 未部署
- `error_msg` 有值: 网络或 URL 问题

### 问题 3: 同步日志为空

**检查**:
```sql
-- 查看 Edge Function 是否被调用
SELECT * FROM net.http_request_queue ORDER BY created DESC LIMIT 1;

-- 查看是否有仓库
SELECT COUNT(*) FROM repositories WHERE is_active = true;
```

### 问题 4: GitHub API 限流

**检查**:
```sql
SELECT * FROM sync_logs
WHERE error_message LIKE '%rate limit%'
ORDER BY started_at DESC;
```

**解决**: 降低同步频率或检查 GITHUB_TOKEN 配置

## 📈 性能优化建议

### 根据仓库数量调整频率

| 仓库数量 | 推荐频率 | Cron 表达式 |
|---------|---------|------------|
| 1-10 | 每5分钟 ✅ | `*/5 * * * *` |
| 10-50 | 每15分钟 | `*/15 * * * *` |
| 50-100 | 每30分钟 | `*/30 * * * *` |
| 100+ | 每小时 | `0 * * * *` |

### GitHub API 使用量

- 每个仓库约需 8-12 个 API 请求
- GitHub 限制：5000 次/小时（已认证）
- 示例：10 个仓库 × 12 次/小时 = 1200 次/小时 ✅

## 📚 文件说明

### 核心文件
- `supabase/functions/sync-repositories/index.ts` - Edge Function 代码
- `supabase/migrations/002_setup_cron_jobs.sql` - 数据库配置

### 文档文件
- `SETUP_GUIDE.md` (本文件) - 完整配置指南
- `SYNC_SETUP_SUMMARY.md` - 快速参考
- `TROUBLESHOOTING.md` - 故障排查
- `supabase/VAULT_SETUP.md` - Vault 详细说明
- `supabase/CRON_FREQUENCY_GUIDE.md` - 频率配置指南

## 🎉 完成！

配置完成后，你的 GitHub 仓库数据将每 5 分钟自动更新。

等待 5-10 分钟，然后检查：

```sql
-- 查看最新的同步记录
SELECT
  r.full_name,
  sl.status,
  sl.started_at,
  sl.duration_ms
FROM sync_logs sl
JOIN repositories r ON r.id = sl.repository_id
ORDER BY sl.started_at DESC
LIMIT 10;
```

如果一切正常，你应该看到持续的同步记录！🚀
