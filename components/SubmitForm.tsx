'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SubmitForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    repoUrl: '',
    inviteCode: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/repositories/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit repository')
      }

      setSuccess(true)
      setFormData({ repoUrl: '', inviteCode: '' })

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* Repository URL Input */}
      <div>
        <label
          htmlFor="repoUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          GitHub 仓库 URL *
        </label>
        <input
          type="text"
          id="repoUrl"
          required
          value={formData.repoUrl}
          onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
          placeholder="https://github.com/owner/repo 或 owner/repo"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          输入完整的 GitHub URL 或仅输入 owner/repo 格式
        </p>
      </div>

      {/* Invite Code Input */}
      <div>
        <label
          htmlFor="inviteCode"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          邀请码 *
        </label>
        <input
          type="text"
          id="inviteCode"
          required
          value={formData.inviteCode}
          onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
          placeholder="输入您的邀请码"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          您需要一个有效的邀请码来提交仓库
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            仓库提交成功！正在跳转...
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || success}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? '提交中...' : success ? '成功！' : '提交仓库'}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
          接下来会发生什么？
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>我们将验证您的邀请码</li>
          <li>从 GitHub 获取仓库数据</li>
          <li>将其添加到带有实时统计数据的排行榜</li>
          <li>该仓库将立即出现在首页</li>
        </ul>
      </div>
    </form>
  )
}
