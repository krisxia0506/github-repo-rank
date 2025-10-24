# Sync Repositories Edge Function

这个 Supabase Edge Function 用于定期同步 GitHub 仓库的统计数据。

## 功能

- 获取所有活跃的仓库（`is_active = true`）
- 从 GitHub API 获取最新的统计数据
- 更新 Supabase 数据库中的仓库统计信息
- 记录同步日志到 `sync_logs` 表

## 环境变量

需要在 Supabase 项目中配置以下环境变量（Edge Function Secrets）：

- `SUPABASE_URL` - 自动提供
- `SUPABASE_SERVICE_ROLE_KEY` - 自动提供
- `GITHUB_TOKEN` - 需要手动配置你的 GitHub Personal Access Token

## 部署

### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase
```

### 2. 登录 Supabase

```bash
supabase login
```

### 3. 链接到你的项目

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. 设置 GitHub Token

```bash
# 在 Supabase Dashboard 中设置
# Settings -> Edge Functions -> Secrets
# 添加: GITHUB_TOKEN = ghp_your_token_here
```

或使用 CLI：

```bash
supabase secrets set GITHUB_TOKEN=ghp_your_token_here
```

### 5. 部署 Edge Function

```bash
supabase functions deploy sync-repositories
```

### 6. 运行数据库 Migration 配置 pg_cron

```bash
# 在 Supabase Dashboard SQL Editor 中执行
# 或使用 CLI
supabase db push
```

### 7. 配置 Edge Function URL

在 Supabase Dashboard SQL Editor 中执行：

```sql
-- 设置 Edge Function URL（替换为你的项目引用）
ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-repositories';

-- 设置 Supabase Anon Key（可选，用于认证）
ALTER DATABASE postgres SET app.supabase_anon_key = 'your_anon_key_here';
```

## 手动触发

你可以通过以下方式手动触发同步：

### 1. 调用 Edge Function

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-repositories' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. 调用数据库函数

在 SQL Editor 中：

```sql
SELECT trigger_repository_sync();
```

## 监控

### 查看定时任务状态

```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 查看任务执行历史
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- 查看同步日志
SELECT * FROM sync_logs
ORDER BY started_at DESC
LIMIT 20;
```

### 查看 Edge Function 日志

```bash
# 实时查看日志
supabase functions logs sync-repositories --follow

# 查看最近的日志
supabase functions logs sync-repositories
```

## 定时任务配置

默认配置了两个定时任务：

1. **每日同步**: 每天凌晨 3:00 UTC 执行
   ```sql
   '0 3 * * *'
   ```

2. **每周完整同步**: 每周日凌晨 2:00 UTC 执行
   ```sql
   '0 2 * * 0'
   ```

### 修改定时任务

```sql
-- 取消现有任务
SELECT cron.unschedule('daily-repository-sync');

-- 创建新的定时任务（例如：每 6 小时执行一次）
SELECT cron.schedule(
  'hourly-repository-sync',
  '0 */6 * * *',
  $$SELECT trigger_repository_sync()$$
);
```

## 故障排查

### 1. Edge Function 未触发

检查定时任务是否正确配置：

```sql
SELECT * FROM cron.job WHERE jobname = 'daily-repository-sync';
```

### 2. Edge Function 调用失败

查看 `cron.job_run_details` 表中的错误信息：

```sql
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### 3. GitHub API 限流

Edge Function 已实现每个仓库之间延迟 1 秒，避免触发 GitHub API 限流。

检查同步日志：

```sql
SELECT * FROM sync_logs
WHERE status = 'failed'
  AND error_message LIKE '%rate limit%'
ORDER BY started_at DESC;
```

### 4. 检查环境变量

```bash
supabase secrets list
```

## 本地测试

```bash
# 启动本地 Supabase
supabase start

# 部署到本地
supabase functions serve sync-repositories

# 在另一个终端测试
curl -X POST 'http://localhost:54321/functions/v1/sync-repositories' \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY"
```

## Cron 表达式参考

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6) (0 = 周日)
│ │ │ │ │
* * * * *
```

常用示例：
- `0 * * * *` - 每小时
- `*/30 * * * *` - 每 30 分钟
- `0 */6 * * *` - 每 6 小时
- `0 3 * * *` - 每天凌晨 3:00
- `0 2 * * 0` - 每周日凌晨 2:00
- `0 0 1 * *` - 每月 1 号凌晨

## 注意事项

1. **GitHub API 限流**: 未认证请求限制为 60/小时，已认证请求为 5000/小时
2. **Edge Function 超时**: Supabase Edge Functions 默认超时时间为 150 秒
3. **数据库连接**: 使用 Service Role Key 确保有足够的权限
4. **时区**: Cron 任务使用 UTC 时区
