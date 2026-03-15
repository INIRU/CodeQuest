import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { saveToGist } from '@/services/gist-sync'

export function useAutoSync(intervalMs = 30_000) {
  const githubPat = useSettingsStore((s) => s.githubPat)
  const syncGistId = useSettingsStore((s) => s.syncGistId)
  const lastSyncRef = useRef<number>(0)

  useEffect(() => {
    // Only auto-sync if PAT and gist ID are set (user has synced at least once manually)
    if (!githubPat || !syncGistId) return

    const timer = setInterval(async () => {
      try {
        await saveToGist()
        lastSyncRef.current = Date.now()
      } catch {
        // Silently fail - don't interrupt user
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [githubPat, syncGistId, intervalMs])

  return { lastSync: lastSyncRef.current }
}
