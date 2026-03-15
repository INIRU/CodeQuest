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

  // Use pushed:> to find recently active repos (not created:>)
  let query = `stars:>50 pushed:>${weekAgo}`

  // Multiple languages use OR logic (a repo can only be one language)
  if (languages.length > 0) {
    const langFilter = languages.map((l) => `language:${l}`).join(' OR ')
    query += ` (${langFilter})`
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
  // Decode base64 → UTF-8 (atob alone breaks multi-byte chars like Korean)
  const binary = atob(data.content.replace(/\n/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

/** Max file size to fetch (100 KB) */
const MAX_FILE_SIZE = 100_000

/** Concurrent fetch limit */
const MAX_CONCURRENT = 5

/**
 * Fetch multiple files in parallel with concurrency limit.
 * Skips files larger than 100 KB.
 */
export async function fetchMultipleFiles(
  owner: string,
  repo: string,
  paths: string[],
  pat?: string,
  treeSizeMap?: Map<string, number>,
): Promise<Array<{ path: string; content: string }>> {
  // Filter out files that are too large based on the tree size info
  const filteredPaths = treeSizeMap
    ? paths.filter((p) => {
        const size = treeSizeMap.get(p)
        return size === undefined || size <= MAX_FILE_SIZE
      })
    : paths

  const results: Array<{ path: string; content: string }> = []
  // Process in batches of MAX_CONCURRENT
  for (let i = 0; i < filteredPaths.length; i += MAX_CONCURRENT) {
    const batch = filteredPaths.slice(i, i + MAX_CONCURRENT)
    const batchResults = await Promise.allSettled(
      batch.map(async (path) => {
        const content = await fetchFileContent(owner, repo, path, pat)
        return { path, content }
      }),
    )
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      }
    }
  }
  return results
}
