// @ts-nocheck - Supabase type inference issues
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { fetchRepository, fetchRepositoryStats } from '@/lib/github/repository'

type Repository = Database['public']['Tables']['repositories']['Row']
type RepositoryStat = Database['public']['Tables']['repository_stats']['Row']
type RepositoryInsert = Database['public']['Tables']['repositories']['Insert']
type RepositoryStatInsert = Database['public']['Tables']['repository_stats']['Insert']

/**
 * Get all active repositories with their latest stats
 */
export async function getRepositoriesWithStats() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('current_rankings')
    .select('*')
    .order('stars_count', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single repository by full_name
 */
export async function getRepositoryByFullName(fullName: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('repositories')
    .select(`
      *,
      repository_stats (*)
    `)
    .eq('full_name', fullName)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data
}

/**
 * Get repository statistics history
 */
export async function getRepositoryStatsHistory(
  repositoryId: string,
  days: number = 30
) {
  const supabase = await createServerClient()

  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)

  const { data, error } = await supabase
    .from('repository_stats')
    .select('*')
    .eq('repository_id', repositoryId)
    .gte('snapshot_date', dateFrom.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Create a new repository and fetch its initial stats
 */
export async function createRepository(
  owner: string,
  repo: string
): Promise<{ repository: Repository; isNew: boolean }> {
  const supabase = createServiceRoleClient()

  // Fetch repository data from GitHub
  const githubRepo = await fetchRepository(owner, repo)
  const githubStats = await fetchRepositoryStats(owner, repo)

  // Check if repository already exists
  const { data: existing } = await supabase
    .from('repositories')
    .select('*')
    .eq('github_id', githubRepo.id)
    .single()

  if (existing) {
    return { repository: existing, isNew: false }
  }

  // Insert repository
  const repositoryData: RepositoryInsert = {
    github_id: githubRepo.id,
    owner: githubRepo.owner,
    name: githubRepo.name,
    full_name: githubRepo.full_name,
    description: githubRepo.description,
    url: githubRepo.url,
    homepage: githubRepo.homepage,
    language: githubRepo.language,
    topics: githubRepo.topics,
    created_at: githubRepo.created_at,
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }

  const { data: repository, error: repoError } = await supabase
    .from('repositories')
    .insert(repositoryData)
    .select()
    .single()

  if (repoError) throw repoError

  // Insert initial stats
  const statsData: RepositoryStatInsert = {
    repository_id: repository.id,
    stars_count: githubStats.stars_count,
    forks_count: githubStats.forks_count,
    watchers_count: githubStats.watchers_count,
    open_issues_count: githubStats.open_issues_count,
    open_prs_count: githubStats.open_prs_count,
    closed_issues_count: githubStats.closed_issues_count,
    closed_prs_count: githubStats.closed_prs_count,
    commits_count: githubStats.commits_count,
    branches_count: githubStats.branches_count,
    releases_count: githubStats.releases_count,
    contributors_count: githubStats.contributors_count,
    code_size_kb: githubStats.code_size_kb,
    last_commit_date: githubStats.last_commit_date,
    commits_last_month: githubStats.commits_last_month,
    commits_last_week: githubStats.commits_last_week,
    snapshot_date: new Date().toISOString().split('T')[0],
  }

  const { error: statsError } = await supabase
    .from('repository_stats')
    .insert(statsData)

  if (statsError) throw statsError

  return { repository, isNew: true }
}

/**
 * Update repository statistics
 */
export async function updateRepositoryStats(repositoryId: string) {
  const supabase = createServiceRoleClient()

  // Get repository info
  const { data: repository, error: repoError } = await supabase
    .from('repositories')
    .select('owner, name, full_name')
    .eq('id', repositoryId)
    .single()

  if (repoError) throw repoError

  // Fetch latest stats from GitHub
  const githubStats = await fetchRepositoryStats(repository.owner, repository.name)

  // Check if stats already exist for today
  const today = new Date().toISOString().split('T')[0]
  const { data: existingStats } = await supabase
    .from('repository_stats')
    .select('id')
    .eq('repository_id', repositoryId)
    .eq('snapshot_date', today)
    .single()

  const statsData: Partial<RepositoryStatInsert> = {
    repository_id: repositoryId,
    stars_count: githubStats.stars_count,
    forks_count: githubStats.forks_count,
    watchers_count: githubStats.watchers_count,
    open_issues_count: githubStats.open_issues_count,
    open_prs_count: githubStats.open_prs_count,
    closed_issues_count: githubStats.closed_issues_count,
    closed_prs_count: githubStats.closed_prs_count,
    commits_count: githubStats.commits_count,
    branches_count: githubStats.branches_count,
    releases_count: githubStats.releases_count,
    contributors_count: githubStats.contributors_count,
    code_size_kb: githubStats.code_size_kb,
    last_commit_date: githubStats.last_commit_date,
    commits_last_month: githubStats.commits_last_month,
    commits_last_week: githubStats.commits_last_week,
    snapshot_date: today,
  }

  if (existingStats) {
    // Update existing stats
    const { error } = await supabase
      .from('repository_stats')
      .update(statsData)
      .eq('id', existingStats.id)

    if (error) throw error
  } else {
    // Insert new stats
    const { error } = await supabase
      .from('repository_stats')
      .insert(statsData as RepositoryStatInsert)

    if (error) throw error
  }

  // Update last_synced_at
  await supabase
    .from('repositories')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', repositoryId)

  return githubStats
}

/**
 * Search repositories by name or owner
 */
export async function searchRepositories(query: string, limit: number = 20) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .or(`full_name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get top repositories by different metrics
 */
export async function getTopRepositories(
  metric: 'stars' | 'commits' | 'forks' = 'stars',
  limit: number = 100
) {
  const supabase = await createServerClient()

  const orderColumn = metric === 'stars'
    ? 'stars_count'
    : metric === 'commits'
    ? 'commits_count'
    : 'forks_count'

  const { data, error } = await supabase
    .from('current_rankings')
    .select('*')
    .order(orderColumn, { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get repositories filtered by language
 */
export async function getRepositoriesByLanguage(language: string, limit: number = 100) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('current_rankings')
    .select('*')
    .eq('language', language)
    .order('stars_count', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get the last sync time from the most recent successful sync
 */
export async function getLastSyncTime() {
  const supabase = await createServerClient()

  // First try to get from sync_logs
  const { data: syncLog } = await supabase
    .from('sync_logs')
    .select('completed_at')
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (syncLog?.completed_at) {
    return syncLog.completed_at
  }

  // If no sync logs, get the most recent last_synced_at from repositories
  const { data: repo } = await supabase
    .from('repositories')
    .select('last_synced_at')
    .not('last_synced_at', 'is', null)
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return repo?.last_synced_at || null
}
