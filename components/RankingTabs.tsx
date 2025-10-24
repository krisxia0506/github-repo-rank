'use client'

interface RankingTabsProps {
  activeTab: 'stars' | 'commits' | 'forks'
  onTabChange: (tab: 'stars' | 'commits' | 'forks') => void
}

export function RankingTabs({ activeTab, onTabChange }: RankingTabsProps) {
  const tabs = [
    { id: 'stars' as const, label: 'Star 数', icon: '⭐' },
    { id: 'commits' as const, label: '提交数', icon: '💻' },
    { id: 'forks' as const, label: 'Fork 数', icon: '🔱' },
  ]

  return (
    <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-6 py-3 font-medium text-sm transition-colors relative
            ${activeTab === tab.id
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </span>
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
      ))}
    </div>
  )
}
