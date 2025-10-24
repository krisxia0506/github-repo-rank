# Cron 定时任务频率配置指南

本文档说明如何配置和调整 GitHub 仓库同步的频率。

## 当前配置

**频率**: 每 5 分钟执行一次
**Cron 表达式**: `*/5 * * * *`
**任务名称**: `repository-sync-every-5min`

## 快速更新

### 方式 1: 在 Supabase Dashboard 执行

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 执行以下 SQL：

```sql
-- 取消现有任务
SELECT cron.unschedule('repository-sync-every-5min');

-- 创建新的每5分钟任务
SELECT cron.schedule(
  'repository-sync-every-5min',
  '*/5 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 方式 2: 使用准备好的 SQL 文件

直接在 SQL Editor 中打开并执行：
- `supabase/UPDATE_CRON_TO_5MIN.sql`

## 常用频率配置

### 高频同步（适合活跃项目）

```sql
-- 每 1 分钟（最高频率，可能触发 GitHub API 限流）
SELECT cron.schedule(
  'repository-sync-every-1min',
  '* * * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每 5 分钟（推荐用于活跃项目）✅ 当前配置
SELECT cron.schedule(
  'repository-sync-every-5min',
  '*/5 * * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每 15 分钟
SELECT cron.schedule(
  'repository-sync-every-15min',
  '*/15 * * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每 30 分钟
SELECT cron.schedule(
  'repository-sync-every-30min',
  '*/30 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 常规同步（适合普通项目）

```sql
-- 每小时
SELECT cron.schedule(
  'repository-sync-hourly',
  '0 * * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每 2 小时
SELECT cron.schedule(
  'repository-sync-every-2h',
  '0 */2 * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每 6 小时
SELECT cron.schedule(
  'repository-sync-every-6h',
  '0 */6 * * *',
  $$SELECT trigger_repository_sync()$$
);
```

### 低频同步（适合低活跃项目）

```sql
-- 每天 1 次（凌晨 3:00）
SELECT cron.schedule(
  'repository-sync-daily',
  '0 3 * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每天 2 次（上午 9:00 和晚上 21:00）
SELECT cron.schedule(
  'repository-sync-twice-daily',
  '0 9,21 * * *',
  $$SELECT trigger_repository_sync()$$
);

-- 每周 1 次（周日凌晨 2:00）
SELECT cron.schedule(
  'repository-sync-weekly',
  '0 2 * * 0',
  $$SELECT trigger_repository_sync()$$
);
```

## Cron 表达式参考

```
┌─────────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌─────────── 日期 (1 - 31)
│ │ │ ┌───────── 月份 (1 - 12)
│ │ │ │ ┌─────── 星期 (0 - 6) (0 = 周日)
│ │ │ │ │
* * * * *
```

### 常用示例

| Cron 表达式 | 说明 | 执行频率 |
|------------|------|---------|
| `* * * * *` | 每分钟 | 1440次/天 |
| `*/5 * * * *` | 每5分钟 | 288次/天 |
| `*/15 * * * *` | 每15分钟 | 96次/天 |
| `*/30 * * * *` | 每30分钟 | 48次/天 |
| `0 * * * *` | 每小时 | 24次/天 |
| `0 */2 * * *` | 每2小时 | 12次/天 |
| `0 */6 * * *` | 每6小时 | 4次/天 |
| `0 3 * * *` | 每天凌晨3:00 | 1次/天 |
| `0 9,21 * * *` | 每天9:00和21:00 | 2次/天 |
| `0 2 * * 0` | 每周日凌晨2:00 | 1次/周 |
| `0 0 1 * *` | 每月1号凌晨 | 1次/月 |

### 特殊字符

- `*` : 任何值
- `,` : 值列表分隔符（如 `1,3,5`）
- `-` : 值范围（如 `1-5`）
- `/` : 步长值（如 `*/5` 表示每5单位）

## 管理命令

### 查看当前任务

```sql
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename
FROM cron.job;
```

### 查看执行历史

```sql
-- 最近10次执行
SELECT
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  jrd.return_message,
  EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)) as duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 10;
```

### 查看成功率

```sql
-- 统计最近100次执行的成功率
SELECT
  j.jobname,
  COUNT(*) as total_runs,
  SUM(CASE WHEN jrd.status = 'succeeded' THEN 1 ELSE 0 END) as successful_runs,
  ROUND(100.0 * SUM(CASE WHEN jrd.status = 'succeeded' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE '%sync%'
  AND jrd.start_time > NOW() - INTERVAL '1 day'
GROUP BY j.jobname;
```

### 暂停任务

```sql
-- 暂停（删除任务）
SELECT cron.unschedule('repository-sync-every-5min');
```

### 恢复任务

```sql
-- 恢复（重新创建任务）
SELECT cron.schedule(
  'repository-sync-every-5min',
  '*/5 * * * *',
  $$SELECT trigger_repository_sync()$$
);
```

## 性能考虑

### GitHub API 限流

**未认证请求**: 60 次/小时
**已认证请求**: 5000 次/小时

#### 每次同步的 API 调用次数估算

假设每个仓库需要约 **8-12 个 API 请求**：
- 仓库基本信息: 1 次
- 分支列表: 1 次
- 发布列表: 1 次
- 贡献者列表: 1 次
- 提交统计: 1 次
- PR 列表: 2 次（open + closed）
- Issues 列表: 2 次（open + closed）
- 最近提交: 1 次

#### 不同频率下的 API 消耗

| 频率 | 执行次数/小时 | 10个仓库 | 50个仓库 | 100个仓库 |
|-----|-------------|---------|---------|----------|
| 每1分钟 | 60 | 6000 | 30000 | 60000 ⚠️ |
| 每5分钟 | 12 | 1200 | 6000 ⚠️ | 12000 ⚠️ |
| 每15分钟 | 4 | 400 ✅ | 2000 ✅ | 4000 ✅ |
| 每30分钟 | 2 | 200 ✅ | 1000 ✅ | 2000 ✅ |
| 每小时 | 1 | 100 ✅ | 500 ✅ | 1000 ✅ |

⚠️ = 可能超过 GitHub API 限制（5000/小时）

### 推荐配置

**根据仓库数量选择频率：**

| 仓库数量 | 推荐频率 | Cron 表达式 |
|---------|---------|------------|
| 1-10 | 每5分钟 ✅ | `*/5 * * * *` |
| 10-50 | 每15分钟 | `*/15 * * * *` |
| 50-100 | 每30分钟 | `*/30 * * * *` |
| 100-200 | 每小时 | `0 * * * *` |
| 200+ | 每2-6小时 | `0 */2 * * *` |

### 优化建议

1. **添加并发限制**（在 Edge Function 中）
   ```typescript
   // 限制同时处理的仓库数量
   const BATCH_SIZE = 5;
   for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
     const batch = repositories.slice(i, i + BATCH_SIZE);
     await Promise.all(batch.map(repo => updateStats(repo)));
   }
   ```

2. **增加延迟**（在 Edge Function 中已实现）
   ```typescript
   // 每个仓库之间延迟 1 秒
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

3. **条件同步**（只同步最近更新的）
   ```sql
   -- 只同步12小时内未更新的仓库
   SELECT * FROM repositories
   WHERE is_active = true
     AND (last_synced_at IS NULL
          OR last_synced_at < NOW() - INTERVAL '12 hours');
   ```

## 监控和告警

### 设置告警阈值

```sql
-- 检查是否有失败的同步（最近1小时）
SELECT COUNT(*) as failed_count
FROM sync_logs
WHERE status = 'failed'
  AND started_at > NOW() - INTERVAL '1 hour';

-- 如果 failed_count > 5，需要检查问题
```

### 检查执行延迟

```sql
-- 检查最近一次执行时间
SELECT
  j.jobname,
  MAX(jrd.start_time) as last_run,
  NOW() - MAX(jrd.start_time) as time_since_last_run
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname = 'repository-sync-every-5min'
GROUP BY j.jobname;

-- 如果 time_since_last_run > 10分钟，可能任务未正常执行
```

## 测试新频率

在更改频率前，建议先测试：

```sql
-- 1. 手动触发一次测试
SELECT trigger_repository_sync();

-- 2. 检查执行时间
SELECT
  repository_id,
  duration_ms,
  status
FROM sync_logs
ORDER BY started_at DESC
LIMIT 1;

-- 3. 估算：执行时间 × 频率 < GitHub API 限制
-- 例如：如果执行需要 30 秒，每 5 分钟一次是安全的
```

## 相关资源

- [Cron 表达式生成器](https://crontab.guru/)
- [GitHub API 速率限制](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)
- [pg_cron 文档](https://github.com/citusdata/pg_cron)
