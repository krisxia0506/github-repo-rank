import Link from 'next/link'
import { getRepositoriesWithStats } from '@/lib/services/repository.service'
import { RankingList } from '@/components/RankingList'

export const revalidate = 3600 // Revalidate every hour

export default async function Home() {
  let repositories: any[] = []
  let error: string | null = null

  try {
    repositories = await getRepositoriesWithStats()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load repositories'
    console.error('Error fetching repositories:', e)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                GitHub Repository Rankings
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Discover and track the most popular GitHub repositories
              </p>
            </div>
            <Link
              href="/submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Submit Repository
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Failed to load repositories
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-2">
              Please make sure your Supabase database is set up correctly and the migrations have been run.
            </p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No repositories yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Be the first to add a repository to the ranking!
            </p>
            <Link
              href="/submit"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Submit Your First Repository
            </Link>
          </div>
        ) : (
          <RankingList initialRepositories={repositories} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Data updates hourly. Rankings are based on real-time GitHub statistics.
            </p>
            <p className="mt-2">
              Built with Next.js 16, Supabase, and GitHub API
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
