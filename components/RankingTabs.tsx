'use client'

interface RankingTabsProps {
  activeTab: 'stars' | 'commits' | 'issues' | 'prs' | 'branches'
  onTabChange: (tab: 'stars' | 'commits' | 'issues' | 'prs' | 'branches') => void
}

export function RankingTabs({ activeTab, onTabChange }: RankingTabsProps) {
  const tabs = [
    { id: 'stars' as const, label: 'STARS', sublabel: '星标排名', icon: '★', color: '#FFD700' },
    { id: 'commits' as const, label: 'COMMITS', sublabel: '提交排名', icon: '◆', color: '#00ff41' },
    { id: 'issues' as const, label: 'ISSUES', sublabel: 'Issue排名', icon: '⚠', color: '#ffa500' },
    { id: 'prs' as const, label: 'PULL REQUESTS', sublabel: 'PR排名', icon: '⟳', color: '#a855f7' },
    { id: 'branches' as const, label: 'BRANCHES', sublabel: '分支排名', icon: '⑂', color: '#00d9ff' },
  ]

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 rounded-lg backdrop-blur-sm relative" style={{
        background: 'rgba(0, 217, 255, 0.03)',
        border: '1px solid rgba(0, 217, 255, 0.2)'
      }}>
        {/* Decorative corners */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: '#00ff41' }} />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: '#00ff41' }} />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: '#00ff41' }} />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: '#00ff41' }} />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="group relative px-3 py-2 font-bold transition-all duration-300 overflow-hidden"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${tab.color}15 0%, ${tab.color}05 100%)`
                  : 'transparent',
                border: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                boxShadow: isActive ? `0 0 20px ${tab.color}40, inset 0 0 20px ${tab.color}10` : 'none',
                color: isActive ? tab.color : '#8892b0'
              }}
            >
              {/* Hover effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${tab.color}10 0%, ${tab.color}05 100%)`
                }}
              />

              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-lg font-bold"
                    style={{
                      textShadow: isActive ? `0 0 10px ${tab.color}` : 'none',
                      color: tab.color
                    }}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className="text-xs md:text-sm tracking-wider font-mono"
                    style={{
                      textShadow: isActive ? `0 0 10px ${tab.color}` : 'none'
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs opacity-70 tracking-wide">{tab.sublabel}</span>
              </div>

              {/* Active indicator line */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 animate-pulse"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${tab.color}, transparent)`,
                    boxShadow: `0 0 10px ${tab.color}`
                  }}
                />
              )}

              {/* Scan line effect */}
              {isActive && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${tab.color}20 2px, ${tab.color}20 4px)`
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
