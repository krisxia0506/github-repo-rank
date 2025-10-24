-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;    -- For scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_net;     -- For HTTP requests
CREATE EXTENSION IF NOT EXISTS vault;      -- For secure secret storage

-- Store secrets in Vault (run these manually with your actual values)
-- Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- Example: https://abcdefghijklmnop.supabase.co
/*
SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');
*/

-- Create a function to trigger the Edge Function using Vault secrets
CREATE OR REPLACE FUNCTION trigger_repository_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id BIGINT;
  project_url TEXT;
  publishable_key TEXT;
BEGIN
  -- Get secrets from Vault
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO publishable_key
  FROM vault.decrypted_secrets
  WHERE name = 'publishable_key';

  -- Validate secrets exist
  IF project_url IS NULL THEN
    RAISE EXCEPTION 'Vault secret "project_url" not found. Please run: SELECT vault.create_secret(''https://YOUR_PROJECT_REF.supabase.co'', ''project_url'');';
  END IF;

  IF publishable_key IS NULL THEN
    RAISE EXCEPTION 'Vault secret "publishable_key" not found. Please run: SELECT vault.create_secret(''YOUR_PUBLISHABLE_KEY'', ''publishable_key'');';
  END IF;

  -- Make HTTP POST request to Edge Function
  SELECT INTO request_id net.http_post(
    url := project_url || '/functions/v1/sync-repositories',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || publishable_key
    ),
    body := jsonb_build_object(
      'triggered_at', now()::text
    )
  );

  -- Log the request
  RAISE NOTICE 'Triggered repository sync, request_id: %', request_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to trigger repository sync: %', SQLERRM;
  RAISE;  -- Re-throw to see in cron logs
END;
$$;

-- Schedule the cron job to run every 5 minutes
SELECT cron.schedule(
  'repository-sync-every-5min',   -- Job name
  '*/5 * * * *',                  -- Cron expression (every 5 minutes)
  $$SELECT trigger_repository_sync()$$
);

-- Query to check scheduled jobs
-- SELECT * FROM cron.job;

-- Query to check job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To unschedule a job:
-- SELECT cron.unschedule('daily-repository-sync');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
