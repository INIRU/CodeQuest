import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GitHubRepo } from '@/types'

const TRENDING_STALE_MS = 6 * 60 * 60 * 1000 // 6 hours
const MY_REPOS_STALE_MS = 30 * 60 * 1000 // 30 minutes

interface GithubState {
  trendingRepos: GitHubRepo[]
  trendingFetchedAt: number | null
  myRepos: GitHubRepo[]
  myReposFetchedAt: number | null
  rateLimitRemaining: number | null
  rateLimitReset: number | null

  setTrendingRepos: (repos: GitHubRepo[]) => void
  setMyRepos: (repos: GitHubRepo[]) => void
  addMyRepo: (repo: GitHubRepo) => void
  removeMyRepo: (repoId: number) => void
  setRateLimit: (remaining: number, reset: number) => void
  isTrendingStale: () => boolean
  isMyReposStale: () => boolean
}

export const useGithubStore = create<GithubState>()(
  persist(
    (set, get) => ({
      trendingRepos: [],
      trendingFetchedAt: null,
      myRepos: [],
      myReposFetchedAt: null,
      rateLimitRemaining: null,
      rateLimitReset: null,

      setTrendingRepos: (repos) =>
        set({ trendingRepos: repos, trendingFetchedAt: Date.now() }),

      setMyRepos: (repos) =>
        set({ myRepos: repos, myReposFetchedAt: Date.now() }),

      addMyRepo: (repo) =>
        set((state) => {
          if (state.myRepos.some((r) => r.id === repo.id)) return state
          return { myRepos: [...state.myRepos, repo] }
        }),

      removeMyRepo: (repoId) =>
        set((state) => ({
          myRepos: state.myRepos.filter((r) => r.id !== repoId),
        })),

      setRateLimit: (remaining, reset) =>
        set({ rateLimitRemaining: remaining, rateLimitReset: reset }),

      isTrendingStale: () => {
        const { trendingFetchedAt } = get()
        if (!trendingFetchedAt) return true
        return Date.now() - trendingFetchedAt > TRENDING_STALE_MS
      },

      isMyReposStale: () => {
        const { myReposFetchedAt } = get()
        if (!myReposFetchedAt) return true
        return Date.now() - myReposFetchedAt > MY_REPOS_STALE_MS
      },
    }),
    {
      name: 'codetraining-github',
      version: 1,
    }
  )
)
