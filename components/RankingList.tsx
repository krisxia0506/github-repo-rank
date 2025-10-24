'use client'

import { useState, useMemo } from 'react'
import { RankingTabs } from './RankingTabs'
import { RepositoryCard } from './RepositoryCard'

interface Repository {
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
  // 数据库字段
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

interface RankingListProps {
  initialRepositories: Repository[]
}

export function RankingList({ initialRepositories }: RankingListProps) {
  const [activeTab, setActiveTab] = useState<'stars' | 'commits' | 'issues' | 'prs' | 'branches'>('stars')

  // Sort repositories by active tab
  const filteredRepositories = useMemo(() => {
    return [...initialRepositories].sort((a, b) => {
      let aValue: number | null | undefined
      let bValue: number | null | undefined

      switch (activeTab) {
        case 'stars':
          aValue = a.stars_count
          bValue = b.stars_count
          break
        case 'commits':
          aValue = a.commits_count
          bValue = b.commits_count
          break
        case 'issues':
          aValue = a.open_issues_count
          bValue = b.open_issues_count
          break
        case 'prs':
          aValue = a.open_prs_count
          bValue = b.open_prs_count
          break
        case 'branches':
          aValue = a.branches_count
          bValue = b.branches_count
          break
        default:
          aValue = a.stars_count
          bValue = b.stars_count
      }

      return (bValue || 0) - (aValue || 0)
    })
  }, [initialRepositories, activeTab])

  return (
    <div>
      <RankingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="space-y-4">
        {filteredRepositories.length > 0 ? (
          filteredRepositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              rankType={activeTab}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            未找到仓库
          </div>
        )}
      </div>
    </div>
  )
}
