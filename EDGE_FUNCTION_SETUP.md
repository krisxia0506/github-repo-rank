# Supabase Edge Function + pg_cron 定时同步配置指南

这个指南将帮助你设置 Supabase Edge Function 和 pg_cron 来自动同步 GitHub 仓库数据。

## 架构说明

```
pg_cron (定时任务)
    ↓
trigger_repository_sync() (数据库函数)
    ↓
HTTP POST → Edge Function
    ↓
GitHub API → 更新 Supabase 数据库
```

## 快速开始

### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 2. 登录并链接项目

```bash
# 登录 Supabase
supabase login

# 链接到你的项目（在 Supabase Dashboard 获取 PROJECT_REF）
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. 配置 GitHub Token

创建 GitHub Personal Access Token:
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：`public_repo`, `read:org`, `read:user`
4. 生成并复制 token

设置到 Supabase:

```bash
supabase secrets set GITHUB_TOKEN=ghp_your_token_here
```

或在 Supabase Dashboard:
- 进入 Settings → Edge Functions → Secrets
- 添加: `GITHUB_TOKEN = ghp_your_token_here`

### 4. 部署 Edge Function

```bash
supabase functions deploy sync-repositories
```

### 5. 运行数据库 Migration

两种方式任选其一：

**方式 A: 使用 CLI**
```bash
supabase db push
```

**方式 B: 在 Supabase Dashboard**
1. 打开 SQL Editor
2. 打开 `supabase/migrations/002_setup_cron_jobs.sql`
3. 复制内容并执行

### 6. 配置 Vault 密钥（推荐方式）

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 1. 存储项目 URL（替换 YOUR_PROJECT_REF 为你的实际项目引用）
-- 项目 URL 格式: https://abcdefghijklmnop.supabase.co
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');

-- 2. 存储 Anon Key（在 Supabase Dashboard Settings → API 中找到）
SELECT vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');
```

**为什么使用 Vault？**
- ✅ 安全存储敏感信息
- ✅ 加密存储在数据库中
- ✅ 只有授权的数据库函数可以访问
- ✅ 符合安全最佳实践

**验证密钥是否存储成功：**

```sql
-- 查看存储的密钥（仅显示名称，不显示值）
SELECT name, description, created_at
FROM vault.secrets;

-- 应该看到:
-- name         | description | created_at
-- -------------+-------------+------------
-- project_url  | NULL        | 2024-...
-- anon_key     | NULL        | 2024-...
```

## 验证设置

### 1. 测试 Edge Function

```bash
# 获取你的 anon key (在 Supabase Dashboard Settings → API)
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-repositories' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

成功响应示例：
```json
{
  "success": true,
  "results": {
    "total": 5,
    "success": 5,
    "failed": 0,
    "errors": []
  }
}
```

### 2. 手动触发定时任务

在 SQL Editor 中：

```sql
SELECT trigger_repository_sync();
```

### 3. 检查定时任务状态

```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 应该看到类似这样的结果：
-- jobid | schedule  | command                              | jobname
-- ------+-----------+-------------------------------------+---------------------------
-- 1     | 0 3 * * * | SELECT trigger_repository_sync()    | daily-repository-sync
```

### 4. 查看执行历史

```sql
-- 查看最近的执行记录
SELECT
  job_run_details.jobid,
  job.jobname,
  job_run_details.start_time,
  job_run_details.end_time,
  job_run_details.status,
  job_run_details.return_message
FROM cron.job_run_details
JOIN cron.job ON job.jobid = job_run_details.jobid
ORDER BY start_time DESC
LIMIT 10;
```

### 5. 查看同步日志

```sql
-- 查看最近的同步日志
SELECT
  sync_logs.repository_id,
  repositories.full_name,
  sync_logs.sync_type,
  sync_logs.status,
  sync_logs.started_at,
  sync_logs.duration_ms,
  sync_logs.error_message
FROM sync_logs
JOIN repositories ON repositories.id = sync_logs.repository_id
ORDER BY sync_logs.started_at DESC
LIMIT 20;
```

## 定时任务管理

### 当前配置

**频率**: 每 5 分钟执行一次
**Cron 表达式**: `*/5 * * * *`
**任务名称**: `repository-sync-every-5min`

这个频率适合：
- ✅ 1-10 个仓库的项目
- ✅ 需要准实时数据更新
- ✅ 不会超过 GitHub API 限制

💡 **如果需要调整频率**，请参考 [supabase/CRON_FREQUENCY_GUIDE.md](supabase/CRON_FREQUENCY_GUIDE.md)

### 查看所有定时任务

```sql
SELECT * FROM cron.job;
```

### 快速修改频率

在 SQL Editor 中执行 [supabase/UPDATE_CRON_TO_5MIN.sql](supabase/UPDATE_CRON_TO_5MIN.sql)，或手动执行：

```sql
-- 1. 先取消现有任务
SELECT cron.unschedule('repository-sync-every-5min');

-- 2. 创建新的定时任务
-- 例如：改为每 15 分钟执行一次
SELECT cron.schedule(
  'repository-sync-every-15min',
  '*/15 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 常用 Cron 表达式

```sql
-- 每 5 分钟（当前配置）✅
'*/5 * * * *'

-- 每 15 分钟
'*/15 * * * *'

-- 每 30 分钟
'*/30 * * * *'

-- 每小时
'0 * * * *'

-- 每 6 小时
'0 */6 * * *'

-- 每天凌晨 3:00
'0 3 * * *'

-- 每周日凌晨 2:00
'0 2 * * 0'
```

### 暂停和恢复定时任务

```sql
-- 暂停（取消调度）
SELECT cron.unschedule('daily-repository-sync');

-- 恢复（重新调度）
SELECT cron.schedule(
  'daily-repository-sync',
  '0 3 * * *',
  $$SELECT trigger_repository_sync()$$
);
```

## 监控和调试

### 实时查看 Edge Function 日志

```bash
supabase functions logs sync-repositories --follow
```

### 查看最近的 Edge Function 日志

```bash
supabase functions logs sync-repositories
```

### 检查失败的同步

```sql
SELECT
  repositories.full_name,
  sync_logs.error_message,
  sync_logs.started_at
FROM sync_logs
JOIN repositories ON repositories.id = sync_logs.repository_id
WHERE sync_logs.status = 'failed'
ORDER BY sync_logs.started_at DESC;
```

### 检查 GitHub API 限流问题

```sql
SELECT * FROM sync_logs
WHERE error_message LIKE '%rate limit%'
ORDER BY started_at DESC;
```

## 故障排查

### 问题 1: Edge Function 未部署成功

**检查**:
```bash
supabase functions list
```

**解决**:
```bash
# 重新部署
supabase functions deploy sync-repositories
```

### 问题 2: 定时任务未执行

**检查**:
```sql
-- 1. 确认任务是否已调度
SELECT * FROM cron.job WHERE jobname = 'daily-repository-sync';

-- 2. 查看执行历史
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

**解决**:
```sql
-- 手动触发一次测试
SELECT trigger_repository_sync();
```

### 问题 3: GitHub Token 无效

**检查**:
```bash
supabase secrets list
```

**解决**:
```bash
# 重新设置 token
supabase secrets set GITHUB_TOKEN=ghp_your_new_token_here
```

### 问题 4: Vault 密钥未配置

**检查**:
```sql
-- 检查密钥是否存在
SELECT name FROM vault.secrets WHERE name IN ('project_url', 'anon_key');

-- 测试读取密钥（仅用于调试）
SELECT
  (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') as project_url,
  (SELECT CASE WHEN decrypted_secret IS NOT NULL THEN '[CONFIGURED]' ELSE '[MISSING]' END
   FROM vault.decrypted_secrets WHERE name = 'anon_key') as anon_key_status;
```

**解决**:
```sql
-- 如果密钥不存在，创建它们
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');

-- 如果需要更新密钥
-- 1. 先删除旧密钥
SELECT vault.delete_secret('project_url');
SELECT vault.delete_secret('anon_key');

-- 2. 重新创建
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');
```

## 本地开发和测试

### 1. 启动本地 Supabase

```bash
supabase start
```

### 2. 部署到本地

```bash
supabase functions serve sync-repositories --env-file .env.local
```

### 3. 创建本地环境变量

创建 `supabase/functions/.env` 文件：

```env
GITHUB_TOKEN=ghp_your_token_here
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

### 4. 测试本地 Edge Function

```bash
curl -X POST 'http://localhost:54321/functions/v1/sync-repositories' \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY"
```

## 成本优化建议

1. **调整同步频率**: 根据实际需求调整 cron 频率
   - 高活跃项目: 每 6 小时
   - 普通项目: 每天 1 次
   - 低活跃项目: 每周 1 次

2. **批量限制**: 如果仓库很多，可以修改 Edge Function 添加批量限制

3. **条件同步**: 只同步最近更新的仓库

```sql
-- 只同步 7 天内未同步的仓库
SELECT * FROM repositories
WHERE is_active = true
  AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '7 days');
```

## 下一步

- [ ] 设置告警通知（同步失败时发送邮件/Slack 通知）
- [ ] 添加仓库统计趋势分析
- [ ] 实现增量同步（只更新变化的数据）
- [ ] 添加 Web 界面手动触发同步

## 相关资源

- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)
- [pg_cron 文档](https://github.com/citusdata/pg_cron)
- [GitHub REST API 文档](https://docs.github.com/en/rest)
- [Cron 表达式生成器](https://crontab.guru/)
