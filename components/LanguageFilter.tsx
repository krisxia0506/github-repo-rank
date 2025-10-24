'use client'

interface LanguageFilterProps {
  languages: string[]
  selectedLanguage: string | null
  onLanguageChange: (language: string | null) => void
}

export function LanguageFilter({ languages, selectedLanguage, onLanguageChange }: LanguageFilterProps) {
  return (
    <div className="mb-8 p-4 rounded-lg backdrop-blur-sm relative" style={{
      background: 'rgba(0, 255, 65, 0.03)',
      border: '1px solid rgba(0, 255, 65, 0.2)'
    }}>
      {/* Corner decorations */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l" style={{ borderColor: '#00d9ff' }} />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r" style={{ borderColor: '#00d9ff' }} />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l" style={{ borderColor: '#00d9ff' }} />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r" style={{ borderColor: '#00d9ff' }} />

      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00ff41' }}>
          &lt;FILTER&gt;
        </span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #00ff41, transparent)' }} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onLanguageChange(null)}
          className="group relative px-4 py-2 text-sm font-mono font-bold tracking-wide transition-all duration-300 uppercase"
          style={{
            background: selectedLanguage === null
              ? 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)'
              : 'rgba(0, 217, 255, 0.05)',
            border: selectedLanguage === null ? '2px solid #00ff41' : '1px solid rgba(0, 217, 255, 0.3)',
            color: selectedLanguage === null ? '#00ff41' : '#b8c5e0',
            boxShadow: selectedLanguage === null ? '0 0 15px rgba(0, 255, 65, 0.3)' : 'none'
          }}
        >
          <span className="relative z-10 flex items-center gap-1">
            <span className="text-xs" style={{ color: '#00d9ff' }}>[</span>
            ALL
            <span className="text-xs" style={{ color: '#00d9ff' }}>]</span>
          </span>
          {selectedLanguage === null && (
            <div className="absolute inset-0 opacity-20" style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 255, 65, 0.3) 2px, rgba(0, 255, 65, 0.3) 4px)'
            }} />
          )}
        </button>

        {languages.map((language) => {
          const isSelected = selectedLanguage === language
          return (
            <button
              key={language}
              onClick={() => onLanguageChange(language)}
              className="group relative px-4 py-2 text-sm font-mono font-bold tracking-wide transition-all duration-300"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(0, 255, 65, 0.1) 100%)'
                  : 'rgba(0, 217, 255, 0.05)',
                border: isSelected ? '2px solid #00d9ff' : '1px solid rgba(0, 217, 255, 0.3)',
                color: isSelected ? '#00d9ff' : '#b8c5e0',
                boxShadow: isSelected ? '0 0 15px rgba(0, 217, 255, 0.3)' : 'none'
              }}
            >
              <span className="relative z-10 flex items-center gap-1">
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#00d9ff] animate-pulse" />}
                {language}
              </span>
              {isSelected && (
                <div className="absolute inset-0 opacity-20" style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 217, 255, 0.3) 2px, rgba(0, 217, 255, 0.3) 4px)'
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
