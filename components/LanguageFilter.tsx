'use client'

interface LanguageFilterProps {
  languages: string[]
  selectedLanguage: string | null
  onLanguageChange: (language: string | null) => void
}

export function LanguageFilter({ languages, selectedLanguage, onLanguageChange }: LanguageFilterProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        按语言筛选
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onLanguageChange(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${selectedLanguage === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          全部
        </button>
        {languages.map((language) => (
          <button
            key={language}
            onClick={() => onLanguageChange(language)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedLanguage === language
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {language}
          </button>
        ))}
      </div>
    </div>
  )
}
