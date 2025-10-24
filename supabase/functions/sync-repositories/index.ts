import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Octokit } from 'npm:@octokit/rest@^22.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Repository {
  id: string
  owner: string
  name: string
  full_name: string
}

interface GitHubStats {
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

async function fetchRepositoryStats(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubStats> {
  // Fetch basic repo info
  const { data: repoData } = await octokit.repos.get({ owner, repo })

  // Fetch additional data in parallel
  const [
    branchesData,
    releasesData,
    contributorsData,
    commitsData,
    pullRequestsData,
    issuesData,
  ] = await Promise.all([
    // Branches count
    octokit.repos
      .listBranches({ owner, repo, per_page: 100 })
      .then((res) => res.data.length)
      .catch(() => 0),

    // Releases count
    octokit.repos
      .listReleases({ owner, repo, per_page: 100 })
      .then((res) => res.data.length)
      .catch(() => 0),

    // Contributors count
    octokit.repos
      .listContributors({ owner, repo, per_page: 100, anon: 'true' })
      .then((res) => res.data.length)
      .catch(() => 0),

    // Commit activity (last 52 weeks)
    octokit.repos
      .getCommitActivityStats({ owner, repo })
      .then((res) => res.data)
      .catch(() => []),

    // Pull requests (open + closed)
    Promise.all([
      octokit.pulls
        .list({ owner, repo, state: 'open', per_page: 1 })
        .then((res) => {
          const linkHeader = res.headers.link
          return parseInt(linkHeader?.match(/page=(\d+)>; rel="last"/)?.[1] || '0') || res.data.length
        }),
      octokit.pulls
        .list({ owner, repo, state: 'closed', per_page: 1 })
        .then((res) => {
          const linkHeader = res.headers.link
          return parseInt(linkHeader?.match(/page=(\d+)>; rel="last"/)?.[1] || '0') || res.data.length
        }),
    ]),

    // Issues (open + closed, excluding PRs)
    Promise.all([
      octokit.issues
        .listForRepo({ owner, repo, state: 'open', per_page: 1 })
        .then((res) => {
          const linkHeader = res.headers.link
          return parseInt(linkHeader?.match(/page=(\d+)>; rel="last"/)?.[1] || '0') || res.data.filter(issue => !issue.pull_request).length
        }),
      octokit.issues
        .listForRepo({ owner, repo, state: 'closed', per_page: 1 })
        .then((res) => {
          const linkHeader = res.headers.link
          return parseInt(linkHeader?.match(/page=(\d+)>; rel="last"/)?.[1] || '0') || res.data.filter(issue => !issue.pull_request).length
        }),
    ]),
  ])

  // Calculate commit statistics
  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

  let commitsLastWeek = 0
  let commitsLastMonth = 0
  let totalCommits = 0
  let lastCommitDate: string | null = null

  if (Array.isArray(commitsData) && commitsData.length > 0) {
    commitsData.forEach((week: any) => {
      const weekTimestamp = week.week * 1000
      const weekTotal = week.total || 0

      totalCommits += weekTotal

      if (weekTimestamp >= oneMonthAgo) {
        commitsLastMonth += weekTotal
      }
      if (weekTimestamp >= oneWeekAgo) {
        commitsLastWeek += weekTotal
      }
    })

    // Get last commit date
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1,
      })
      if (commits.length > 0) {
        lastCommitDate = commits[0].commit.committer?.date || null
      }
    } catch {
      lastCommitDate = repoData.pushed_at
    }
  }

  const [openPRs, closedPRs] = pullRequestsData
  const [openIssues, closedIssues] = issuesData

  return {
    stars_count: repoData.stargazers_count,
    forks_count: repoData.forks_count,
    watchers_count: repoData.watchers_count,
    open_issues_count: openIssues,
    open_prs_count: openPRs,
    closed_issues_count: closedIssues,
    closed_prs_count: closedPRs,
    commits_count: totalCommits,
    branches_count: branchesData,
    releases_count: releasesData,
    contributors_count: contributorsData,
    code_size_kb: repoData.size,
    last_commit_date: lastCommitDate,
    commits_last_month: commitsLastMonth,
    commits_last_week: commitsLastWeek,
  }
}

async function updateRepositoryStats(
  supabase: any,
  octokit: Octokit,
  repositoryId: string,
  owner: string,
  name: string
) {
  const startTime = Date.now()

  try {
    // Log sync start
    await supabase.from('sync_logs').insert({
      repository_id: repositoryId,
      sync_type: 'scheduled',
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })

    // Fetch latest stats from GitHub
    const githubStats = await fetchRepositoryStats(octokit, owner, name)

    // Check if stats already exist for today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingStats } = await supabase
      .from('repository_stats')
      .select('id')
      .eq('repository_id', repositoryId)
      .eq('snapshot_date', today)
      .single()

    const statsData = {
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
      await supabase
        .from('repository_stats')
        .update(statsData)
        .eq('id', existingStats.id)
    } else {
      // Insert new stats
      await supabase
        .from('repository_stats')
        .insert(statsData)
    }

    // Update last_synced_at
    await supabase
      .from('repositories')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', repositoryId)

    // Log sync completion
    const duration = Date.now() - startTime
    await supabase.from('sync_logs').insert({
      repository_id: repositoryId,
      sync_type: 'scheduled',
      status: 'success',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    })

    return { success: true, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log sync failure
    await supabase.from('sync_logs').insert({
      repository_id: repositoryId,
      sync_type: 'scheduled',
      status: 'failed',
      error_message: errorMessage,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
    })

    throw error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const githubToken = Deno.env.get('GITHUB_TOKEN')

    if (!supabaseUrl || !supabaseServiceKey || !githubToken) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create GitHub client
    const octokit = new Octokit({ auth: githubToken })

    // Get all active repositories
    const { data: repositories, error: fetchError } = await supabase
      .from('repositories')
      .select('id, owner, name, full_name')
      .eq('is_active', true)

    if (fetchError) {
      throw fetchError
    }

    if (!repositories || repositories.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No repositories to sync',
          synced: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const results = {
      total: repositories.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ repo: string; error: string }>,
    }

    // Sync repositories
    for (const repo of repositories as Repository[]) {
      try {
        await updateRepositoryStats(
          supabase,
          octokit,
          repo.id,
          repo.owner,
          repo.name
        )
        results.success++
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push({
          repo: repo.full_name,
          error: errorMessage,
        })
      }

      // Add a small delay to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error syncing repositories:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
