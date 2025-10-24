import { Octokit } from '@octokit/rest'

// GitHub API client with authentication
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Rate limit helper
export async function checkRateLimit() {
  const { data } = await octokit.rateLimit.get()
  return {
    limit: data.rate.limit,
    remaining: data.rate.remaining,
    reset: new Date(data.rate.reset * 1000),
  }
}
