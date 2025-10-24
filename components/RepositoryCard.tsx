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
  }
  showRank?: boolean
  rankType?: 'stars' | 'commits' | 'forks'
}

export function RepositoryCard({ repository, showRank = true, rankType = 'stars' }: RepositoryCardProps) {
  const rank = rankType === 'stars'
    ? repository.stars_rank
    : rankType === 'commits'
    ? repository.commits_rank
    : repository.forks_rank

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {repository.language && (
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>语言</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff41' }} />
              <span className="font-mono font-bold text-base" style={{ color: '#00d9ff' }}>{repository.language}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Stars</span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#FFD700' }}>
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            <span className="font-mono font-bold text-base" style={{ color: '#f0f0f0' }}>{repository.stars_count?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Forks</span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#00d9ff' }}>
              <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
            </svg>
            <span className="font-mono font-bold text-base" style={{ color: '#f0f0f0' }}>{repository.forks_count?.toLocaleString() || 0}</span>
          </div>
        </div>

        {repository.commits_count !== null && repository.commits_count > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#a8b2d1' }}>Commits</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#00ff41' }}>
                <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
              </svg>
              <span className="font-mono font-bold text-base" style={{ color: '#f0f0f0' }}>{repository.commits_count?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

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
