import Link from 'next/link'
import { SubmitForm } from '@/components/SubmitForm'

export const metadata = {
  title: 'Submit Repository - GitHub Repo Rankings',
  description: 'Submit your GitHub repository to the rankings',
}

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Submit Repository
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Add your GitHub repository to the rankings
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Back to Rankings
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SubmitForm />
      </div>
    </main>
  )
}
