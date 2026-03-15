import { useState, useEffect, useCallback } from 'react'
import type { GitHubRepo } from '@/types'
import { useGithubStore } from '@/stores/useGithubStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { fetchTrendingRepos } from '@/services/github'

interface UseTrendingReposResult {
  repos: GitHubRepo[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTrendingRepos(): UseTrendingReposResult {
  const trendingRepos = useGithubStore((s) => s.trendingRepos)
  const isTrendingStale = useGithubStore((s) => s.isTrendingStale)
  const setTrendingRepos = useGithubStore((s) => s.setTrendingRepos)
  const languageFilter = useSettingsStore((s) => s.languageFilter)
  const githubPat = useSettingsStore((s) => s.githubPat)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doFetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const repos = await fetchTrendingRepos(
        languageFilter,
        githubPat || undefined,
      )
      setTrendingRepos(repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending repos')
    } finally {
      setLoading(false)
    }
  }, [languageFilter, githubPat, setTrendingRepos])

  useEffect(() => {
    if (isTrendingStale()) {
      doFetch()
    }
  }, [doFetch, isTrendingStale])

  // Re-fetch when language filter changes
  useEffect(() => {
    doFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageFilter.join(',')])

  return {
    repos: trendingRepos,
    loading,
    error,
    refetch: doFetch,
  }
}
