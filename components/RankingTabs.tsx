'use client'

interface RankingTabsProps {
  activeTab: 'stars' | 'commits' | 'forks'
  onTabChange: (tab: 'stars' | 'commits' | 'forks') => void
}

export function RankingTabs({ activeTab, onTabChange }: RankingTabsProps) {
  const tabs = [
    { id: 'stars' as const, label: 'STARS', sublabel: '星标排名', icon: '★', color: '#FFD700' },
    { id: 'commits' as const, label: 'COMMITS', sublabel: '提交排名', icon: '◆', color: '#00ff41' },
    { id: 'forks' as const, label: 'FORKS', sublabel: '复刻排名', icon: '◈', color: '#00d9ff' },
  ]

  return (
    <div className="flex gap-4 mb-8 p-2 rounded-lg backdrop-blur-sm relative" style={{
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
            className="flex-1 group relative px-6 py-4 font-bold transition-all duration-300 overflow-hidden"
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

            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold"
                  style={{
                    textShadow: isActive ? `0 0 10px ${tab.color}` : 'none',
                    color: tab.color
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  className="text-lg tracking-wider font-mono"
                  style={{
                    textShadow: isActive ? `0 0 10px ${tab.color}` : 'none'
                  }}
                >
                  {tab.label}
                </span>
              </div>
              <span className="text-xs opacity-70 tracking-wide">{tab.sublabel}</span>
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
  )
}
