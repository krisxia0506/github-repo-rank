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
  console.log(`[${owner}/${repo}] 开始获取仓库统计数据...`)

  // Fetch basic repo info
  console.log(`[${owner}/${repo}] 获取基本信息...`)
  const { data: repoData } = await octokit.repos.get({ owner, repo })
  console.log(`[${owner}/${repo}] 基本信息: stars=${repoData.stargazers_count}, forks=${repoData.forks_count}, size=${repoData.size}KB`)

  // Fetch additional data in parallel
  console.log(`[${owner}/${repo}] 开始并行获取详细数据...`)
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
      .then((res) => {
        console.log(`[${owner}/${repo}] 分支数: ${res.data.length}`)
        return res.data.length
      })
      .catch((err: Error) => {
        console.error(`[${owner}/${repo}] 获取分支失败:`, err.message)
        return 0
      }),

    // Releases count
    octokit.repos
      .listReleases({ owner, repo, per_page: 100 })
      .then((res) => {
        console.log(`[${owner}/${repo}] 发布版本数: ${res.data.length}`)
        return res.data.length
      })
      .catch((err: Error) => {
        console.error(`[${owner}/${repo}] 获取发布版本失败:`, err.message)
        return 0
      }),

    // Contributors count
    octokit.repos
      .listContributors({ owner, repo, per_page: 100, anon: 'true' })
      .then((res) => {
        console.log(`[${owner}/${repo}] 贡献者数: ${res.data.length}`)
        return res.data.length
      })
      .catch((err: Error) => {
        console.error(`[${owner}/${repo}] 获取贡献者失败:`, err.message)
        return 0
      }),

    // Commit activity (last 52 weeks)
    octokit.repos
      .getCommitActivityStats({ owner, repo })
      .then((res) => {
        // GitHub returns 202 when stats are being computed, or empty object when not ready
        if (res.status === 202) {
          console.warn(`[${owner}/${repo}] 提交统计正在计算中 (202), 稍后重试`)
          return []
        }

        // Ensure we have an array
        const data = Array.isArray(res.data) ? res.data : []
        console.log(`[${owner}/${repo}] 提交活动数据获取成功, 周数: ${data.length}`)
        return data
      })
      .catch((err: Error) => {
        console.error(`[${owner}/${repo}] 获取提交活动失败:`, err.message)
        return []
      }),

    // Pull requests (open + closed) - using search API for accuracy
    Promise.all([
      octokit.search
        .issuesAndPullRequests({ q: `repo:${owner}/${repo} is:pr is:open`, per_page: 1 })
        .then((res) => {
          const count = res.data.total_count
          console.log(`[${owner}/${repo}] 开放的 PR 数: ${count}`)
          return count
        })
        .catch((err: Error) => {
          console.error(`[${owner}/${repo}] 获取开放 PR 数失败:`, err.message)
          return 0
        }),
      octokit.search
        .issuesAndPullRequests({ q: `repo:${owner}/${repo} is:pr is:closed`, per_page: 1 })
        .then((res) => {
          const count = res.data.total_count
          console.log(`[${owner}/${repo}] 关闭的 PR 数: ${count}`)
          return count
        })
        .catch((err: Error) => {
          console.error(`[${owner}/${repo}] 获取关闭 PR 数失败:`, err.message)
          return 0
        }),
    ]),

    // Issues (open + closed, excluding PRs) - using search API for accuracy
    Promise.all([
      octokit.search
        .issuesAndPullRequests({ q: `repo:${owner}/${repo} is:issue is:open`, per_page: 1 })
        .then((res) => {
          const count = res.data.total_count
          console.log(`[${owner}/${repo}] 开放的 Issue 数: ${count}`)
          return count
        })
        .catch((err: Error) => {
          console.error(`[${owner}/${repo}] 获取开放 Issue 数失败:`, err.message)
          return 0
        }),
      octokit.search
        .issuesAndPullRequests({ q: `repo:${owner}/${repo} is:issue is:closed`, per_page: 1 })
        .then((res) => {
          const count = res.data.total_count
          console.log(`[${owner}/${repo}] 关闭的 Issue 数: ${count}`)
          return count
        })
        .catch((err: Error) => {
          console.error(`[${owner}/${repo}] 获取关闭 Issue 数失败:`, err.message)
          return 0
        }),
    ]),
  ])

  // Calculate commit statistics
  console.log(`[${owner}/${repo}] 开始计算提交统计...`)
  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

  let commitsLastWeek = 0
  let commitsLastMonth = 0
  let totalCommits = 0
  let lastCommitDate: string | null = null

  if (Array.isArray(commitsData) && commitsData.length > 0) {
    console.log(`[${owner}/${repo}] 提交数据类型: Array, 长度: ${commitsData.length}`)
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
    console.log(`[${owner}/${repo}] 提交统计: 总数=${totalCommits}, 本月=${commitsLastMonth}, 本周=${commitsLastWeek}`)
  } else {
    console.warn(`[${owner}/${repo}] 警告: 提交活动统计数据不可用, 使用备用方案`)

    // Fallback: Use listCommits to get total count and recent commits
    try {
      console.log(`[${owner}/${repo}] 使用 listCommits API 获取提交统计...`)

      // Get total commits count from default branch
      const defaultBranch = repoData.default_branch || 'main'
      const { data: allCommits } = await octokit.repos.listCommits({
        owner,
        repo,
        sha: defaultBranch,
        per_page: 100, // Get last 100 commits
      })

      totalCommits = allCommits.length
      console.log(`[${owner}/${repo}] 从最近 100 次提交中获取: 总数=${totalCommits}`)

      // Calculate recent commits
      allCommits.forEach((commit: any) => {
        const commitDate = new Date(commit.commit.committer?.date || commit.commit.author?.date).getTime()
        if (commitDate >= oneMonthAgo) {
          commitsLastMonth++
        }
        if (commitDate >= oneWeekAgo) {
          commitsLastWeek++
        }
      })

      console.log(`[${owner}/${repo}] 备用方案统计: 本月=${commitsLastMonth}, 本周=${commitsLastWeek}`)
    } catch (err) {
      console.error(`[${owner}/${repo}] 备用方案也失败:`, err instanceof Error ? err.message : err)
    }
  }

  // Get last commit date
  try {
    console.log(`[${owner}/${repo}] 获取最后一次提交日期...`)
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 1,
    })
    if (commits.length > 0) {
      lastCommitDate = commits[0].commit.committer?.date || commits[0].commit.author?.date || null
      console.log(`[${owner}/${repo}] 最后提交日期: ${lastCommitDate}`)
    } else {
      console.log(`[${owner}/${repo}] 未找到提交记录`)
      lastCommitDate = repoData.pushed_at
    }
  } catch (err) {
    console.error(`[${owner}/${repo}] 获取最后提交日期失败, 使用 pushed_at: ${repoData.pushed_at}`, err instanceof Error ? err.message : err)
    lastCommitDate = repoData.pushed_at
  }

  const [openPRs, closedPRs] = pullRequestsData
  const [openIssues, closedIssues] = issuesData

  const stats = {
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

  console.log(`[${owner}/${repo}] 数据获取完成! 汇总:`, JSON.stringify(stats, null, 2))
  return stats
}

async function updateRepositoryStats(
  supabase: any,
  octokit: Octokit,
  repositoryId: string,
  owner: string,
  name: string
) {
  const startTime = Date.now()
  console.log(`\n========== [${owner}/${name}] 开始同步仓库 ==========`)

  // Store sync log ID to update later
  let syncLogId: string | null = null

  try {
    // Log sync start
    console.log(`[${owner}/${name}] 记录同步开始日志...`)
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sync_logs')
      .insert({
        repository_id: repositoryId,
        sync_type: 'scheduled',
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (syncLogError) {
      console.error(`[${owner}/${name}] 创建同步日志失败:`, syncLogError)
    } else {
      syncLogId = syncLog?.id
      console.log(`[${owner}/${name}] 同步日志已创建 (id: ${syncLogId})`)
    }

    // Fetch latest stats from GitHub
    console.log(`[${owner}/${name}] 从 GitHub 获取最新统计数据...`)
    const githubStats = await fetchRepositoryStats(octokit, owner, name)

    // Check if stats already exist for today
    const today = new Date().toISOString().split('T')[0]
    console.log(`[${owner}/${name}] 检查今天 (${today}) 是否已有统计记录...`)
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
      console.log(`[${owner}/${name}] 更新已有的统计记录 (id: ${existingStats.id})...`)
      await supabase
        .from('repository_stats')
        .update(statsData)
        .eq('id', existingStats.id)
    } else {
      // Insert new stats
      console.log(`[${owner}/${name}] 插入新的统计记录...`)
      await supabase
        .from('repository_stats')
        .insert(statsData)
    }

    // Update last_synced_at
    console.log(`[${owner}/${name}] 更新 last_synced_at 时间戳...`)
    await supabase
      .from('repositories')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', repositoryId)

    // Log sync completion
    const duration = Date.now() - startTime
    console.log(`[${owner}/${name}] 记录同步成功日志...`)

    if (syncLogId) {
      // Update the existing sync log
      await supabase
        .from('sync_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', syncLogId)
      console.log(`[${owner}/${name}] 同步日志已更新 (id: ${syncLogId})`)
    } else {
      // Fallback: insert new record if we couldn't create one at the start
      await supabase.from('sync_logs').insert({
        repository_id: repositoryId,
        sync_type: 'scheduled',
        status: 'success',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      })
      console.log(`[${owner}/${name}] 同步日志已创建 (备用方案)`)
    }

    console.log(`[${owner}/${name}] ✅ 同步成功! 耗时: ${duration}ms`)
    return { success: true, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[${owner}/${name}] ❌ 同步失败! 错误:`, errorMessage)
    console.error(`[${owner}/${name}] 错误详情:`, error)

    // Log sync failure
    console.log(`[${owner}/${name}] 记录同步失败日志...`)

    if (syncLogId) {
      // Update the existing sync log
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', syncLogId)
      console.log(`[${owner}/${name}] 同步日志已更新 (id: ${syncLogId})`)
    } else {
      // Fallback: insert new record if we couldn't create one at the start
      await supabase.from('sync_logs').insert({
        repository_id: repositoryId,
        sync_type: 'scheduled',
        status: 'failed',
        error_message: errorMessage,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      })
      console.log(`[${owner}/${name}] 同步日志已创建 (备用方案)`)
    }

    throw error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('\n🚀 ========== Edge Function 启动 ==========')
  console.log('请求方法:', req.method)
  console.log('请求时间:', new Date().toISOString())

  try {
    // Get environment variables
    console.log('检查环境变量...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const githubToken = Deno.env.get('GITHUB_TOKEN')

    if (!supabaseUrl || !supabaseServiceKey || !githubToken) {
      throw new Error('Missing required environment variables')
    }
    console.log('✅ 环境变量验证通过')

    // Create Supabase client with service role key
    console.log('创建 Supabase 客户端...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create GitHub client
    console.log('创建 GitHub 客户端...')
    const octokit = new Octokit({ auth: githubToken })

    // Get all active repositories
    console.log('查询活跃的仓库列表...')
    const { data: repositories, error: fetchError } = await supabase
      .from('repositories')
      .select('id, owner, name, full_name')
      .eq('is_active', true)

    if (fetchError) {
      console.error('❌ 查询仓库失败:', fetchError)
      throw fetchError
    }

    if (!repositories || repositories.length === 0) {
      console.log('⚠️  没有需要同步的仓库')
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

    console.log(`📦 找到 ${repositories.length} 个活跃仓库需要同步`)

    const results = {
      total: repositories.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ repo: string; error: string }>,
    }

    // Sync repositories
    for (const repo of repositories as Repository[]) {
      try {
        console.log(`\n进度: [${results.success + results.failed + 1}/${repositories.length}]`)
        await updateRepositoryStats(
          supabase,
          octokit,
          repo.id,
          repo.owner,
          repo.name
        )
        results.success++
        console.log(`当前进度: 成功 ${results.success}, 失败 ${results.failed}`)
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`仓库 ${repo.full_name} 同步失败:`, errorMessage)
        results.errors.push({
          repo: repo.full_name,
          error: errorMessage,
        })
      }

      // Add a small delay to avoid hitting rate limits
      if (results.success + results.failed < repositories.length) {
        console.log('等待 1 秒后继续下一个仓库...')
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
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
