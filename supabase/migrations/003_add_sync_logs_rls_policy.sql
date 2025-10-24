-- Add RLS policy for sync_logs table to allow public read access
CREATE POLICY "Allow public read access to sync_logs"
  ON sync_logs FOR SELECT
  USING (true);
