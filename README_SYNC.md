# GitHub 仓库自动同步

## ✅ 配置状态：已完成

你的项目已成功配置 GitHub 仓库自动同步功能。

## 🎯 功能说明

- **同步频率**: 每 5 分钟自动执行
- **数据来源**: GitHub REST API
- **存储位置**: Supabase 数据库
- **执行方式**: pg_cron + Supabase Edge Function

## 📊 同步内容

每次同步会更新以下数据：
- ⭐ Stars 数量
- 🍴 Forks 数量
- 👀 Watchers 数量
- 🐛 Issues 数量（开放/关闭）
- 🔀 Pull Requests 数量（开放/关闭）
- 📝 Commits 统计
- 👥 Contributors 数量
- 🌿 Branches 数量
- 🏷️ Releases 数量
- 📅 最后提交时间

## 🚀 快速开始

### 验证配置

在 Supabase Dashboard SQL Editor 中执行：

```sql
-- 运行验证脚本
-- 打开文件: supabase/VERIFY_SETUP.sql
```

或手动测试：

```sql
-- 手动触发同步
SELECT trigger_repository_sync();

-- 查看同步结果
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 5;
```

### 查看同步状态

```sql
-- 查看最近的同步记录
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

### 查看定时任务执行情况

```sql
-- 查看定时任务历史
SELECT
  j.jobname,
  jrd.start_time,
  jrd.status
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 10;
```

## ⚙️ 管理操作

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

### 修改频率

```sql
-- 改为每 15 分钟
SELECT cron.unschedule('repository-sync-every-5min');
SELECT cron.schedule(
  'repository-sync-every-15min',
  '*/15 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

## 📁 项目文件结构

```
├── SETUP_GUIDE.md                    # 完整配置指南（从零开始）
├── README_SYNC.md                    # 本文件（快速参考）
├── SYNC_SETUP_SUMMARY.md             # 配置总结
├── TROUBLESHOOTING.md                # 故障排查
├── EDGE_FUNCTION_SETUP.md            # Edge Function 详细说明
└── supabase/
    ├── VERIFY_SETUP.sql              # 验证配置脚本
    ├── UPDATE_CRON_TO_5MIN.sql       # 更新频率脚本
    ├── VAULT_SETUP.md                # Vault 密钥管理
    ├── CRON_FREQUENCY_GUIDE.md       # 频率配置指南
    ├── migrations/
    │   └── 002_setup_cron_jobs.sql   # 数据库配置
    └── functions/
        └── sync-repositories/
            ├── index.ts              # Edge Function 代码
            └── README.md             # Edge Function 说明
```

## 📚 文档导航

### 新用户（首次配置）
👉 阅读 [SETUP_GUIDE.md](SETUP_GUIDE.md) - 完整的从零到一配置指南

### 已配置用户（日常使用）
- 📊 查看状态：执行 `supabase/VERIFY_SETUP.sql`
- ⚙️ 调整频率：参考 [supabase/CRON_FREQUENCY_GUIDE.md](supabase/CRON_FREQUENCY_GUIDE.md)
- 🔐 管理密钥：参考 [supabase/VAULT_SETUP.md](supabase/VAULT_SETUP.md)

### 遇到问题
🔧 参考 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 常见问题和解决方案

## 🔑 关键配置

### Vault 密钥
```sql
-- 查看已配置的密钥
SELECT name FROM vault.secrets;

-- 应该看到:
-- - project_url
-- - publishable_key
```

### 定时任务
```sql
-- 查看定时任务
SELECT jobname, schedule, active FROM cron.job;

-- 应该看到:
-- repository-sync-every-5min | */5 * * * * | t
```

### Edge Function
```bash
# 查看已部署的 Edge Functions
supabase functions list

# 应该看到:
# sync-repositories
```

## 📈 监控建议

### 每日检查

```sql
-- 今天的同步统计
SELECT
  status,
  COUNT(*) as count
FROM sync_logs
WHERE started_at >= CURRENT_DATE
GROUP BY status;
```

### 每周检查

```sql
-- 本周的同步成功率
SELECT
  DATE(started_at) as date,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
  ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*), 2) as success_rate
FROM sync_logs
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

## ⚠️ 注意事项

### GitHub API 限流
- **限制**: 5000 次/小时（已认证）
- **每个仓库**: 约 8-12 次请求
- **建议**: 如果仓库超过 50 个，考虑降低同步频率

### Edge Function 超时
- **限制**: 150 秒
- **建议**: 如果同步时间过长，考虑优化或分批处理

### 数据库存储
- 每次同步会在 `repository_stats` 表中创建新记录
- 建议定期清理旧数据（如保留最近 30 天）

## 🎉 一切就绪！

你的自动同步已经配置完成并正在运行。

如有任何问题，请参考：
- 📖 [完整配置指南](SETUP_GUIDE.md)
- 🔧 [故障排查](TROUBLESHOOTING.md)
- 📋 [配置总结](SYNC_SETUP_SUMMARY.md)
