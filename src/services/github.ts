import type { GitHubRepo, GitHubTreeItem } from '@/types'
import { useGithubStore } from '@/stores/useGithubStore'

function authHeaders(pat?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`
  }
  return headers
}

function updateRateLimit(headers: Headers): void {
  const remaining = headers.get('X-RateLimit-Remaining')
  const reset = headers.get('X-RateLimit-Reset')
  if (remaining !== null && reset !== null) {
    useGithubStore
      .getState()
      .setRateLimit(Number(remaining), Number(reset))
  }
}

async function ghFetch<T>(path: string, pat?: string): Promise<T> {
  const { rateLimitRemaining } = useGithubStore.getState()
  if (rateLimitRemaining !== null && rateLimitRemaining <= 0) {
    throw new Error(
      'GitHub API rate limit exceeded. Please wait before making more requests.',
    )
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers: authHeaders(pat),
  })

  updateRateLimit(response.headers)

  if (response.status === 401) {
    throw new Error('GitHub authentication failed. Please check your PAT.')
  }
  if (response.status === 403) {
    throw new Error('GitHub API access forbidden. Rate limit may be exceeded.')
  }
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Fetch trending repositories from GitHub Search API.
 */
export async function fetchTrendingRepos(
  languages: string[],
  pat?: string,
): Promise<GitHubRepo[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  let query = `stars:>100+created:>${weekAgo}`
  if (languages.length > 0) {
    const langFilter = languages.map((l) => `language:${l}`).join('+')
    query += `+${langFilter}`
  }

  const data = await ghFetch<{ items: GitHubRepo[] }>(
    `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`,
    pat,
  )
  return data.items
}

/**
 * Fetch the authenticated user's repositories.
 */
export async function fetchMyRepos(pat: string): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>('/user/repos?sort=updated&per_page=30', pat)
}

/**
 * Fetch the full file tree of a repository.
 * Tries 'main' branch first, falls back to 'master'.
 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch?: string,
  pat?: string,
): Promise<GitHubTreeItem[]> {
  const tryBranch = async (b: string): Promise<GitHubTreeItem[]> => {
    const data = await ghFetch<{ tree: GitHubTreeItem[] }>(
      `/repos/${owner}/${repo}/git/trees/${b}?recursive=1`,
      pat,
    )
    return data.tree.filter((item) => item.type === 'blob')
  }

  if (branch) {
    return tryBranch(branch)
  }

  try {
    return await tryBranch('main')
  } catch {
    return tryBranch('master')
  }
}

/**
 * Fetch the content of a single file from a repository.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  pat?: string,
): Promise<string> {
  const data = await ghFetch<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/contents/${path}`,
    pat,
  )
  return atob(data.content.replace(/\n/g, ''))
}
