'use client'

import { useState, useMemo } from 'react'
import { RankingTabs } from './RankingTabs'
import { LanguageFilter } from './LanguageFilter'
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
}

interface RankingListProps {
  initialRepositories: Repository[]
}

export function RankingList({ initialRepositories }: RankingListProps) {
  const [activeTab, setActiveTab] = useState<'stars' | 'commits' | 'forks'>('stars')
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)

  // Extract unique languages
  const languages = useMemo(() => {
    const langs = new Set<string>()
    initialRepositories.forEach((repo) => {
      if (repo.language) {
        langs.add(repo.language)
      }
    })
    return Array.from(langs).sort()
  }, [initialRepositories])

  // Filter and sort repositories
  const filteredRepositories = useMemo(() => {
    let repos = initialRepositories

    // Filter by language
    if (selectedLanguage) {
      repos = repos.filter((repo) => repo.language === selectedLanguage)
    }

    // Sort by active tab
    return repos.sort((a, b) => {
      const aValue = activeTab === 'stars'
        ? a.stars_count
        : activeTab === 'commits'
        ? a.commits_count
        : a.forks_count
      const bValue = activeTab === 'stars'
        ? b.stars_count
        : activeTab === 'commits'
        ? b.commits_count
        : b.forks_count

      return (bValue || 0) - (aValue || 0)
    })
  }, [initialRepositories, selectedLanguage, activeTab])

  return (
    <div>
      <RankingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {languages.length > 0 && (
        <LanguageFilter
          languages={languages}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
      )}

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
            No repositories found
          </div>
        )}
      </div>
    </div>
  )
}
