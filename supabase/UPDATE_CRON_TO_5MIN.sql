-- 更新定时任务为每5分钟执行一次
-- 在 Supabase Dashboard SQL Editor 中执行此文件

-- 1. 先取消所有现有的同步任务
SELECT cron.unschedule('daily-repository-sync');
SELECT cron.unschedule('weekly-repository-full-sync');
SELECT cron.unschedule('repository-sync-every-5min');

-- 2. 创建新的每5分钟执行的任务
SELECT cron.schedule(
  'repository-sync-every-5min',   -- Job name
  '*/5 * * * *',                  -- Cron expression: every 5 minutes
  $$SELECT trigger_repository_sync()$$
);

-- 3. 验证任务已创建
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'repository-sync-every-5min';

-- 预期输出:
-- jobid | jobname                      | schedule    | command                              | active
-- ------+------------------------------+-------------+--------------------------------------+--------
-- 1     | repository-sync-every-5min   | */5 * * * * | SELECT trigger_repository_sync()     | t
