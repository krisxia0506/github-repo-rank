-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: repositories (仓库基本信息)
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id BIGINT UNIQUE NOT NULL,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(511) NOT NULL UNIQUE,
  description TEXT,
  url TEXT NOT NULL,
  homepage TEXT,
  language VARCHAR(100),
  topics TEXT[],
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ
);

-- Create indexes for repositories
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_is_active ON repositories(is_active);

-- Table 2: repository_stats (仓库统计数据)
CREATE TABLE repository_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,

  -- 基础统计
  stars_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  watchers_count INTEGER DEFAULT 0,
  open_issues_count INTEGER DEFAULT 0,
  open_prs_count INTEGER DEFAULT 0,
  closed_issues_count INTEGER DEFAULT 0,
  closed_prs_count INTEGER DEFAULT 0,

  -- 代码统计
  commits_count INTEGER DEFAULT 0,
  branches_count INTEGER DEFAULT 0,
  releases_count INTEGER DEFAULT 0,
  contributors_count INTEGER DEFAULT 0,
  code_size_kb INTEGER DEFAULT 0,

  -- 活跃度统计
  last_commit_date TIMESTAMPTZ,
  commits_last_month INTEGER DEFAULT 0,
  commits_last_week INTEGER DEFAULT 0,

  -- 元数据
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (repository_id, snapshot_date)
);

-- Create indexes for repository_stats
CREATE INDEX idx_repository_stats_repository_id ON repository_stats(repository_id);
CREATE INDEX idx_repository_stats_snapshot_date ON repository_stats(snapshot_date);
CREATE INDEX idx_repository_stats_stars_count ON repository_stats(stars_count DESC);
CREATE INDEX idx_repository_stats_commits_count ON repository_stats(commits_count DESC);

-- Table 3: invite_codes (邀请码管理)
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER, -- NULL表示无限次使用
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL表示永不过期
  created_by VARCHAR(255),

  CONSTRAINT check_max_uses CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT check_current_uses CHECK (current_uses >= 0)
);

-- Create indexes for invite_codes
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_is_active ON invite_codes(is_active);
CREATE INDEX idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Table 4: user_submissions (用户提交记录)
CREATE TABLE user_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  invite_code_id UUID REFERENCES invite_codes(id) ON DELETE SET NULL,
  invite_code_used VARCHAR(50) NOT NULL,
  submitter_ip VARCHAR(45),
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending'
);

-- Create indexes for user_submissions
CREATE INDEX idx_user_submissions_repository_id ON user_submissions(repository_id);
CREATE INDEX idx_user_submissions_invite_code_id ON user_submissions(invite_code_id);
CREATE INDEX idx_user_submissions_status ON user_submissions(status);
CREATE INDEX idx_user_submissions_submitted_at ON user_submissions(submitted_at DESC);

-- Table 5: sync_logs (同步日志)
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Create indexes for sync_logs
CREATE INDEX idx_sync_logs_repository_id ON sync_logs(repository_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- View: current_rankings (当前排行榜)
CREATE VIEW current_rankings AS
SELECT
  r.id,
  r.full_name,
  r.owner,
  r.name,
  r.description,
  r.language,
  r.url,
  rs.stars_count,
  rs.forks_count,
  rs.commits_count,
  rs.branches_count,
  rs.open_issues_count,
  rs.open_prs_count,
  rs.contributors_count,
  rs.code_size_kb,
  rs.last_commit_date,
  rs.commits_last_month,
  RANK() OVER (ORDER BY rs.stars_count DESC) as stars_rank,
  RANK() OVER (ORDER BY rs.commits_count DESC) as commits_rank,
  RANK() OVER (ORDER BY rs.forks_count DESC) as forks_rank
FROM repositories r
JOIN repository_stats rs ON r.id = rs.repository_id
WHERE r.is_active = true
  AND rs.snapshot_date = CURRENT_DATE
ORDER BY rs.stars_count DESC;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for repositories
CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample invite code for testing
INSERT INTO invite_codes (code, description, is_active, max_uses, created_by)
VALUES ('WELCOME2025', 'Initial test invite code', true, NULL, 'system');

-- Enable Row Level Security (RLS)
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read access to all authenticated users
CREATE POLICY "Allow public read access to repositories"
  ON repositories FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to repository_stats"
  ON repository_stats FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to current_rankings view"
  ON repositories FOR SELECT
  USING (true);

-- Invite codes: only active codes can be read
CREATE POLICY "Allow read access to active invite codes"
  ON invite_codes FOR SELECT
  USING (is_active = true);

-- User submissions: users can only read their own submissions
CREATE POLICY "Allow read access to user submissions"
  ON user_submissions FOR SELECT
  USING (true);

-- Comments
COMMENT ON TABLE repositories IS '仓库基本信息表';
COMMENT ON TABLE repository_stats IS '仓库统计数据表 - 支持历史快照';
COMMENT ON TABLE invite_codes IS '邀请码管理表';
COMMENT ON TABLE user_submissions IS '用户提交记录表';
COMMENT ON TABLE sync_logs IS '同步日志表';
COMMENT ON VIEW current_rankings IS '当前排行榜视图 - 仅显示当天最新数据';
