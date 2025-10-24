import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface RepositoryCardProps {
  repository: {
    id: string
    full_name: string
    owner: string
    name: string
    description: string | null
    language: string | null
    url: string
    stars_count: number | null
    forks_count: number | null
    commits_count: number | null
    contributors_count: number | null
    last_commit_date: string | null
    stars_rank: number | null
    commits_rank: number | null
    forks_rank: number | null
    // 数据库字段 - 基于 current_rankings 视图
    watchers_count?: number | null
    open_issues_count?: number | null
    open_prs_count?: number | null
    branches_count?: number | null
    releases_count?: number | null
    commits_last_week?: number | null
    // 新增排名字段
    issues_rank?: number | null
    prs_rank?: number | null
    branches_rank?: number | null
  }
  showRank?: boolean
  rankType?: 'stars' | 'commits' | 'issues' | 'prs' | 'branches'
}

export function RepositoryCard({ repository, showRank = true, rankType = 'stars' }: RepositoryCardProps) {
  const rank = rankType === 'stars'
    ? repository.stars_rank
    : rankType === 'commits'
    ? repository.commits_rank
    : rankType === 'issues'
    ? repository.issues_rank
    : rankType === 'prs'
    ? repository.prs_rank
    : rankType === 'branches'
    ? repository.branches_rank
    : repository.stars_rank

  const lastCommitText = repository.last_commit_date
    ? formatDistanceToNow(new Date(repository.last_commit_date), {
        addSuffix: true,
        locale: zhCN,
      })
    : '未知'

  // Rank styling
  const getRankStyle = () => {
    if (!showRank || !rank) return {}

    if (rank === 1) {
      return {
        borderColor: '#FFD700',
        boxShadow: '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 25px rgba(255, 215, 0, 0.1)',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 217, 255, 0.05) 100%)'
      }
    } else if (rank === 2) {
      return {
        borderColor: '#C0C0C0',
        boxShadow: '0 0 20px rgba(192, 192, 192, 0.4), inset 0 0 20px rgba(192, 192, 192, 0.1)',
        background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 217, 255, 0.05) 100%)'
      }
    } else if (rank === 3) {
      return {
        borderColor: '#CD7F32',
        boxShadow: '0 0 20px rgba(205, 127, 50, 0.4), inset 0 0 20px rgba(205, 127, 50, 0.1)',
        background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.1) 0%, rgba(0, 217, 255, 0.05) 100%)'
      }
    }

    return {
      borderColor: '#00d9ff',
      boxShadow: '0 0 15px rgba(0, 217, 255, 0.2), inset 0 0 15px rgba(0, 217, 255, 0.05)',
      background: 'rgba(0, 217, 255, 0.03)'
    }
  }

  const getRankBadgeStyle = () => {
    if (!rank) return {}

    if (rank === 1) {
      return { color: '#FFD700', borderColor: '#FFD700', background: 'rgba(255, 215, 0, 0.2)' }
    } else if (rank === 2) {
      return { color: '#C0C0C0', borderColor: '#C0C0C0', background: 'rgba(192, 192, 192, 0.2)' }
    } else if (rank === 3) {
      return { color: '#CD7F32', borderColor: '#CD7F32', background: 'rgba(205, 127, 50, 0.2)' }
    }

    return { color: '#00d9ff', borderColor: '#00d9ff', background: 'rgba(0, 217, 255, 0.2)' }
  }

  return (
    <div
      className="relative rounded-lg border p-6 transition-all duration-300 group cursor-pointer backdrop-blur-sm scan-line"
      style={getRankStyle()}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 opacity-50" style={{ borderColor: '#00ff41' }} />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 opacity-50" style={{ borderColor: '#00ff41' }} />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 opacity-50" style={{ borderColor: '#00ff41' }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 opacity-50" style={{ borderColor: '#00ff41' }} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {showRank && rank && (
              <div
                className="flex items-center justify-center px-3 py-1 rounded font-bold text-sm border-2 uppercase tracking-wider"
                style={getRankBadgeStyle()}
              >
                {rank === 1 ? '🏆 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
              </div>
            )}
            <Link
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold group-hover:tracking-wide transition-all duration-300"
              style={{
                color: '#00ff41',
                textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
              }}
            >
              {repository.full_name}
            </Link>
          </div>
          {repository.description && (
            <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: '#b8c5e0' }}>
              <span style={{ color: '#00d9ff' }}>&gt;</span> {repository.description}
            </p>
          )}
        </div>
      </div>

      {/* 统计信息 - 紧凑单行布局 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4 text-sm">
        {repository.language && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff41' }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>语言:</span>
            <span className="font-mono font-bold" style={{ color: '#00d9ff' }}>{repository.language}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#FFD700' }}>
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.stars_count?.toLocaleString() || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#00d9ff' }}>
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
          </svg>
          <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Forks:</span>
          <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.forks_count?.toLocaleString() || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#00ff41' }}>
            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
          </svg>
          <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Commits:</span>
          <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.commits_count?.toLocaleString() || 0}</span>
        </div>

        {repository.contributors_count !== null && repository.contributors_count > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#ff6b6b' }}>
              <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Z"/>
            </svg>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>贡献者:</span>
            <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.contributors_count.toLocaleString()}</span>
          </div>
        )}

        {typeof repository.open_issues_count !== 'undefined' && repository.open_issues_count !== null && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#ffa500' }}>
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
            </svg>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Issues:</span>
            <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.open_issues_count.toLocaleString()}</span>
          </div>
        )}

        {typeof repository.open_prs_count !== 'undefined' && repository.open_prs_count !== null && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#a855f7' }}>
              <path d="M3.5 3.75a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5Z"/>
              <path d="M2.5 3.75c0-.966.784-1.75 1.75-1.75h7.5c.966 0 1.75.784 1.75 1.75v8.5a1.75 1.75 0 0 1-1.75 1.75h-7.5a1.75 1.75 0 0 1-1.75-1.75v-8.5Z"/>
            </svg>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>PRs:</span>
            <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.open_prs_count.toLocaleString()}</span>
          </div>
        )}

        {typeof repository.releases_count !== 'undefined' && repository.releases_count !== null && repository.releases_count > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#22c55e' }}>
              <path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>
            </svg>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Releases:</span>
            <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.releases_count.toLocaleString()}</span>
          </div>
        )}

        {typeof repository.branches_count !== 'undefined' && repository.branches_count !== null && repository.branches_count > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#00d9ff' }}>
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/>
            </svg>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Branches:</span>
            <span className="font-mono font-bold" style={{ color: '#f0f0f0' }}>{repository.branches_count.toLocaleString()}</span>
          </div>
        )}

        {typeof repository.commits_last_week !== 'undefined' && repository.commits_last_week !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>本周提交:</span>
            <span className="font-mono font-bold" style={{ color: '#00ff41' }}>{repository.commits_last_week.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Last Activity */}
      <div className="flex items-center gap-2 text-sm pt-3 border-t" style={{
        borderColor: 'rgba(0, 255, 65, 0.2)',
        color: '#a8b2d1'
      }}>
        <span>最后活跃:</span>
        <span className="font-mono font-bold" style={{ color: '#00d9ff' }}>{lastCommitText}</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-bold" style={{ color: '#00ff41' }}>Active</span>
        </div>
      </div>
    </div>
  )
}
