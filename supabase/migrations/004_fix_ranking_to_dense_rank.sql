-- Migration: Fix ranking system to use DENSE_RANK instead of RANK
-- This ensures rankings are 1,1,2,2 instead of 1,1,3,3 for tied values
-- Add rankings for issues, prs, and branches to ensure consistency

-- Drop the existing view
DROP VIEW IF EXISTS current_rankings;

-- Recreate the view with DENSE_RANK for all ranking fields
CREATE VIEW current_rankings AS
SELECT
  r.id,
  r.github_id,
  r.owner,
  r.name,
  r.full_name,
  r.description,
  r.url,
  r.homepage,
  r.language,
  r.topics,
  r.created_at as repository_created_at,
  r.is_active,
  r.last_synced_at,
  rs.stars_count,
  rs.forks_count,
  rs.watchers_count,
  rs.commits_count,
  rs.releases_count,
  rs.branches_count,
  rs.open_issues_count,
  rs.open_prs_count,
  rs.contributors_count,
  rs.code_size_kb,
  rs.last_commit_date,
  rs.commits_last_month,
  rs.commits_last_week,
  DENSE_RANK() OVER (ORDER BY rs.stars_count DESC) as stars_rank,
  DENSE_RANK() OVER (ORDER BY rs.commits_count DESC) as commits_rank,
  DENSE_RANK() OVER (ORDER BY rs.forks_count DESC) as forks_rank,
  DENSE_RANK() OVER (ORDER BY rs.open_issues_count DESC) as issues_rank,
  DENSE_RANK() OVER (ORDER BY rs.open_prs_count DESC) as prs_rank,
  DENSE_RANK() OVER (ORDER BY rs.branches_count DESC) as branches_rank
FROM repositories r
JOIN repository_stats rs ON r.id = rs.repository_id
WHERE r.is_active = true
  AND rs.snapshot_date = CURRENT_DATE
ORDER BY rs.stars_count DESC;
