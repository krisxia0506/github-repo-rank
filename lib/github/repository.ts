import { octokit } from './client'
import type { GitHubRepository, GitHubStats } from './types'

/**
 * Fetch repository basic information from GitHub
 */
export async function fetchRepository(
  owner: string,
  repo: string
): Promise<GitHubRepository> {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  })

  return {
    id: data.id,
    owner: data.owner.login,
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    url: data.html_url,
    homepage: data.homepage,
    language: data.language,
    topics: data.topics || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
    pushed_at: data.pushed_at,
    stars_count: data.stargazers_count,
    forks_count: data.forks_count,
    watchers_count: data.watchers_count,
    open_issues_count: data.open_issues_count,
    size: data.size,
    default_branch: data.default_branch,
  }
}

/**
 * Fetch detailed statistics for a repository
 */
export async function fetchRepositoryStats(
  owner: string,
  repo: string
): Promise<GitHubStats> {
  // Fetch basic repo info
  const repoData = await fetchRepository(owner, repo)

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

    // Pull requests (open + closed) - using search API for accuracy
    Promise.all([
      octokit.search
        .issues({ q: `repo:${owner}/${repo} is:pr is:open`, per_page: 1 })
        .then((res) => res.data.total_count)
        .catch(() => 0),
      octokit.search
        .issues({ q: `repo:${owner}/${repo} is:pr is:closed`, per_page: 1 })
        .then((res) => res.data.total_count)
        .catch(() => 0),
    ]),

    // Issues (open + closed, excluding PRs) - using search API for accuracy
    Promise.all([
      octokit.search
        .issues({ q: `repo:${owner}/${repo} is:issue is:open`, per_page: 1 })
        .then((res) => res.data.total_count)
        .catch(() => 0),
      octokit.search
        .issues({ q: `repo:${owner}/${repo} is:issue is:closed`, per_page: 1 })
        .then((res) => res.data.total_count)
        .catch(() => 0),
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
    // Calculate total commits and recent activity
    commitsData.forEach((week) => {
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
    stars_count: repoData.stars_count,
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

/**
 * Parse GitHub repository URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const owner = match[1]
      let repo = match[2]

      // Remove .git suffix if present
      repo = repo.replace(/\.git$/, '')

      return { owner, repo }
    }
  }

  return null
}

/**
 * Validate if a GitHub repository exists and is accessible
 */
export async function validateRepository(owner: string, repo: string): Promise<boolean> {
  try {
    await octokit.repos.get({ owner, repo })
    return true
  } catch {
    return false
  }
}
