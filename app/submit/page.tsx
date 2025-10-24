import Link from 'next/link'
import { SubmitForm } from '@/components/SubmitForm'

export const metadata = {
  title: '提交仓库 - 七牛云第四届黑客松',
  description: '提交您的黑客松项目到排行榜',
}

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* 七牛云 Logo */}
              <img
                src="https://dn-mars-assets.qbox.me/qiniulog/img-slogan-blue-en.png"
                alt="七牛云"
                className="h-12 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  提交黑客松项目
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  将您的项目添加到七牛云第四届黑客松排行榜
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              返回排行榜
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
