-- ==========================================
-- 验证自动同步配置
-- ==========================================
-- 在 Supabase Dashboard SQL Editor 中执行此脚本

-- 1. 检查扩展
SELECT '=== Extensions ===' as section;
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net', 'vault')
ORDER BY extname;
-- 期望: 3 行（pg_cron, pg_net, vault）

-- 2. 检查 Vault 密钥
SELECT '=== Vault Secrets ===' as section;
SELECT
  name,
  created_at,
  CASE
    WHEN name = 'project_url' THEN '✅ Configured'
    WHEN name = 'publishable_key' THEN '✅ Configured'
    ELSE 'Unknown'
  END as status
FROM vault.secrets
ORDER BY name;
-- 期望: 2 行（project_url, publishable_key）

-- 3. 检查密钥值（预览）
SELECT '=== Secret Values Preview ===' as section;
SELECT
  name,
  CASE
    WHEN name = 'project_url' THEN decrypted_secret
    WHEN name = 'publishable_key' THEN LEFT(decrypted_secret, 30) || '...'
  END as value_preview
FROM vault.decrypted_secrets
WHERE name IN ('project_url', 'publishable_key')
ORDER BY name;

-- 4. 检查定时任务
SELECT '=== Cron Jobs ===' as section;
SELECT
  jobname,
  schedule,
  active,
  CASE
    WHEN schedule = '*/5 * * * *' THEN '✅ Every 5 minutes'
    ELSE '⚠️ Custom schedule'
  END as frequency
FROM cron.job;
-- 期望: repository-sync-every-5min | */5 * * * * | t

-- 5. 检查最近的定时任务执行
SELECT '=== Recent Cron Executions ===' as section;
SELECT
  j.jobname,
  jrd.start_time,
  jrd.status,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 5;

-- 6. 测试手动触发（可选）
SELECT '=== Manual Test ===' as section;
SELECT 'Run: SELECT trigger_repository_sync(); to test manually' as instruction;

-- 7. 检查 HTTP 请求历史
SELECT '=== HTTP Requests (Last 5) ===' as section;
SELECT
  id,
  LEFT(url, 60) as url,
  status_code,
  CASE
    WHEN status_code = 200 THEN '✅ Success'
    WHEN status_code IS NULL THEN '⚠️ No status'
    ELSE '❌ Error: ' || status_code::text
  END as result,
  error_msg,
  created
FROM net.http_request_queue
ORDER BY created DESC
LIMIT 5;

-- 8. 检查同步日志
SELECT '=== Sync Logs (Last 10) ===' as section;
SELECT
  repository_id,
  sync_type,
  status,
  started_at,
  duration_ms,
  LEFT(COALESCE(error_message, 'No error'), 50) as error
FROM sync_logs
ORDER BY started_at DESC
LIMIT 10;

-- 9. 统计今天的同步情况
SELECT '=== Today Statistics ===' as section;
SELECT
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms
FROM sync_logs
WHERE started_at >= CURRENT_DATE;

-- 10. 整体健康检查
SELECT '=== Health Check ===' as section;
SELECT
  check_name,
  status,
  message
FROM (
  SELECT
    1 as ord,
    'Extensions' as check_name,
    CASE
      WHEN (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net', 'vault')) = 3
      THEN '✅ Pass' ELSE '❌ Fail'
    END as status,
    'All required extensions installed' as message

  UNION ALL
  SELECT
    2,
    'Vault Secrets',
    CASE
      WHEN (SELECT COUNT(*) FROM vault.secrets WHERE name IN ('project_url', 'publishable_key')) = 2
      THEN '✅ Pass' ELSE '❌ Fail'
    END,
    'Both secrets configured'

  UNION ALL
  SELECT
    3,
    'Cron Job',
    CASE
      WHEN EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'repository-sync-every-5min' AND active = true)
      THEN '✅ Pass' ELSE '❌ Fail'
    END,
    'Scheduled and active'

  UNION ALL
  SELECT
    4,
    'Recent Sync',
    CASE
      WHEN EXISTS(SELECT 1 FROM sync_logs WHERE started_at > NOW() - INTERVAL '10 minutes')
      THEN '✅ Pass' ELSE '⚠️ Warning'
    END,
    'Has synced in last 10 minutes'

  UNION ALL
  SELECT
    5,
    'HTTP Requests',
    CASE
      WHEN EXISTS(SELECT 1 FROM net.http_request_queue WHERE status_code = 200 ORDER BY created DESC LIMIT 1)
      THEN '✅ Pass' ELSE '⚠️ Warning'
    END,
    'Recent successful HTTP request'
) checks
ORDER BY ord;

-- ==========================================
-- 总结
-- ==========================================
SELECT '=== Summary ===' as section;
SELECT
  'Configuration Status' as item,
  CASE
    WHEN (
      (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net', 'vault')) = 3
      AND (SELECT COUNT(*) FROM vault.secrets WHERE name IN ('project_url', 'publishable_key')) = 2
      AND EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'repository-sync-every-5min' AND active = true)
    )
    THEN '✅ All Good - Auto sync is working!'
    ELSE '❌ Issues Found - Check above sections'
  END as status;
