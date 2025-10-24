# GitHub 仓库自动同步配置总结

## ✅ 已完成配置

### 架构方案
使用 **Supabase Edge Function + pg_cron + Vault** 实现自动同步

```
pg_cron (每5分钟)
    ↓
trigger_repository_sync() (数据库函数)
    ↓
从 Vault 读取密钥
    ↓
HTTP POST → Edge Function (sync-repositories)
    ↓
调用 GitHub API
    ↓
更新 Supabase 数据库 (repositories + repository_stats)
    ↓
记录同步日志 (sync_logs)
```

### 同步频率
- **当前配置**: 每 5 分钟执行一次
- **Cron 表达式**: `*/5 * * * *`
- **适用场景**: 1-10 个仓库，需要准实时数据

## 📁 已创建的文件

### 核心文件
1. **Edge Function**: `supabase/functions/sync-repositories/index.ts`
   - 从 GitHub API 获取仓库统计数据
   - 更新 Supabase 数据库
   - 记录同步日志

2. **数据库 Migration**: `supabase/migrations/002_setup_cron_jobs.sql`
   - 启用 pg_cron、pg_net、vault 扩展
   - 创建 `trigger_repository_sync()` 函数
   - 配置每 5 分钟的定时任务

3. **快速更新脚本**: `supabase/UPDATE_CRON_TO_5MIN.sql`
   - 用于快速更新/重置定时任务到 5 分钟频率

### 文档文件
4. **主配置指南**: `EDGE_FUNCTION_SETUP.md`
   - 完整的部署步骤
   - 使用 Vault 配置密钥
   - 验证和测试方法
   - 故障排查指南

5. **Vault 配置指南**: `supabase/VAULT_SETUP.md`
   - Vault 详细使用说明
   - 安全最佳实践
   - 密钥管理方法
   - 常见问题解答

6. **频率配置指南**: `supabase/CRON_FREQUENCY_GUIDE.md`
   - 各种频率配置示例
   - 性能考虑和 API 限流分析
   - 根据仓库数量的推荐配置
   - 监控和告警设置

7. **Edge Function README**: `supabase/functions/sync-repositories/README.md`
   - Edge Function 功能说明
   - 部署和监控方法

## 🚀 部署步骤（快速版）

### 1. 准备工作
```bash
# 安装 Supabase CLI
brew install supabase/tap/supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. 配置密钥
```bash
# 设置 GitHub Token
supabase secrets set GITHUB_TOKEN=ghp_your_token_here
```

在 Supabase Dashboard SQL Editor 中：
```sql
-- 配置 Vault 密钥
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SUPABASE_ANON_KEY', 'anon_key');
```

### 3. 部署
```bash
# 部署 Edge Function
supabase functions deploy sync-repositories

# 运行数据库 Migration
supabase db push
```

### 4. 验证
```sql
-- 手动触发测试
SELECT trigger_repository_sync();

-- 查看定时任务
SELECT * FROM cron.job;

-- 查看同步日志
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;
```

## 📊 监控命令

### 查看定时任务状态
```sql
-- 查看所有定时任务
SELECT jobid, jobname, schedule, active
FROM cron.job;

-- 查看执行历史（最近10次）
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

### 查看同步日志
```sql
-- 最近的同步记录
SELECT
  r.full_name,
  sl.sync_type,
  sl.status,
  sl.started_at,
  sl.duration_ms,
  sl.error_message
FROM sync_logs sl
JOIN repositories r ON r.id = sl.repository_id
ORDER BY sl.started_at DESC
LIMIT 20;

-- 统计成功率
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sync_logs
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### 查看 Edge Function 日志
```bash
# 实时查看
supabase functions logs sync-repositories --follow

# 查看最近的日志
supabase functions logs sync-repositories
```

## ⚙️ 常用管理操作

### 修改同步频率
```sql
-- 取消现有任务
SELECT cron.unschedule('repository-sync-every-5min');

-- 创建新任务（例如：改为每15分钟）
SELECT cron.schedule(
  'repository-sync-every-15min',
  '*/15 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 暂停同步
```sql
SELECT cron.unschedule('repository-sync-every-5min');
```

### 恢复同步
```sql
SELECT cron.schedule(
  'repository-sync-every-5min',
  '*/5 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 手动触发同步
```sql
-- 触发所有仓库同步
SELECT trigger_repository_sync();

-- 或直接调用 Edge Function
-- 使用 curl 或 Postman 发送 POST 请求到:
-- https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-repositories
```

### 更新密钥
```sql
-- 更新 Vault 密钥
SELECT vault.delete_secret('project_url');
SELECT vault.create_secret('https://NEW_PROJECT_REF.supabase.co', 'project_url');

-- 更新 GitHub Token
-- 使用 Supabase CLI:
-- supabase secrets set GITHUB_TOKEN=ghp_new_token_here
```

## 🔍 故障排查

### 问题 1: 定时任务未执行
```sql
-- 检查任务是否存在
SELECT * FROM cron.job WHERE jobname LIKE '%sync%';

-- 查看最近的执行记录
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 5;

-- 解决：手动触发测试
SELECT trigger_repository_sync();
```

### 问题 2: Edge Function 调用失败
```sql
-- 检查 Vault 密钥
SELECT name FROM vault.secrets
WHERE name IN ('project_url', 'anon_key');

-- 验证密钥值
SELECT
  (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') as project_url,
  (SELECT CASE WHEN decrypted_secret IS NOT NULL THEN '[CONFIGURED]' ELSE '[MISSING]' END
   FROM vault.decrypted_secrets WHERE name = 'anon_key') as anon_key_status;
```

### 问题 3: GitHub API 限流
```sql
-- 查看是否有限流错误
SELECT * FROM sync_logs
WHERE error_message LIKE '%rate limit%'
ORDER BY started_at DESC;

-- 解决：降低同步频率（改为15分钟或30分钟）
```

### 问题 4: 同步失败
```sql
-- 查看失败的同步
SELECT
  r.full_name,
  sl.error_message,
  sl.started_at
FROM sync_logs sl
JOIN repositories r ON r.id = sl.repository_id
WHERE sl.status = 'failed'
ORDER BY sl.started_at DESC
LIMIT 10;
```

## 📈 性能建议

### 根据仓库数量调整频率

| 仓库数量 | 推荐频率 | Cron 表达式 |
|---------|---------|------------|
| 1-10 | 每5分钟 ✅ | `*/5 * * * *` |
| 10-50 | 每15分钟 | `*/15 * * * *` |
| 50-100 | 每30分钟 | `*/30 * * * *` |
| 100-200 | 每小时 | `0 * * * *` |
| 200+ | 每2-6小时 | `0 */2 * * *` |

### GitHub API 限流说明
- **未认证**: 60 次/小时
- **已认证**: 5000 次/小时
- **每个仓库约需**: 8-12 个 API 请求

## 🎯 优化建议

1. **条件同步**: 只同步最近更新的仓库
   ```sql
   -- 修改 Edge Function 或数据库查询
   -- 只获取12小时内未同步的仓库
   WHERE last_synced_at < NOW() - INTERVAL '12 hours'
   ```

2. **批量处理**: 在 Edge Function 中添加批量限制
   ```typescript
   const BATCH_SIZE = 5;
   // 每次只处理 5 个仓库
   ```

3. **错误重试**: 为失败的同步添加重试机制

4. **告警通知**: 设置失败告警（通过 Slack/Email）

## 📚 相关文档

详细信息请参考：

- 📖 [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md) - 完整配置指南
- 🔐 [supabase/VAULT_SETUP.md](supabase/VAULT_SETUP.md) - Vault 安全配置
- ⏰ [supabase/CRON_FREQUENCY_GUIDE.md](supabase/CRON_FREQUENCY_GUIDE.md) - 频率配置详解
- 🔧 [supabase/functions/sync-repositories/README.md](supabase/functions/sync-repositories/README.md) - Edge Function 说明

## 🔗 有用链接

- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Cron 表达式生成器](https://crontab.guru/)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)
- [pg_cron 文档](https://github.com/citusdata/pg_cron)

---

✅ **配置完成！** 你的 GitHub 仓库数据现在会每 5 分钟自动更新。
