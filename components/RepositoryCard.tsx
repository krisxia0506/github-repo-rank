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
    : 'Unknown'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {showRank && rank && (
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                ${rank === 1 ? 'bg-yellow-100 text-yellow-800' : ''}
                ${rank === 2 ? 'bg-gray-100 text-gray-800' : ''}
                ${rank === 3 ? 'bg-orange-100 text-orange-800' : ''}
                ${rank > 3 ? 'bg-blue-50 text-blue-800' : ''}
              `}>
                #{rank}
              </div>
            )}
            <Link
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {repository.full_name}
            </Link>
          </div>
          {repository.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
              {repository.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
        {repository.language && (
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>{repository.language}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          <span>{repository.stars_count?.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
          </svg>
          <span>{repository.forks_count?.toLocaleString() || 0}</span>
        </div>
        {repository.commits_count !== null && repository.commits_count > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
            </svg>
            <span>{repository.commits_count?.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        Last commit: {lastCommitText}
      </div>
    </div>
  )
}
