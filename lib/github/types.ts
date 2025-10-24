export interface GitHubRepository {
  id: number
  owner: string
  name: string
  full_name: string
  description: string | null
  url: string
  homepage: string | null
  language: string | null
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  stars_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  size: number
  default_branch: string
}

export interface GitHubStats {
  stars_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  open_prs_count: number
  closed_issues_count: number
  closed_prs_count: number
  commits_count: number
  branches_count: number
  releases_count: number
  contributors_count: number
  code_size_kb: number
  last_commit_date: string | null
  commits_last_month: number
  commits_last_week: number
}

export interface GitHubCommitActivity {
  total: number
  week: number
  days: number[]
}
