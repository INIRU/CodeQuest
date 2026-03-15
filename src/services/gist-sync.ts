import { useSettingsStore } from '@/stores/useSettingsStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

const GIST_DESCRIPTION = 'CodeTraining Platform - Sync Data (auto-generated)'
const GIST_FILENAME = 'codetraining-sync.json'

interface SyncData {
  version: 1
  timestamp: string
  settings: {
    theme: string
    language: string
    languageFilter: string[]
    activePresetKey: string
    presets: Record<string, unknown>
    corsProxyUrl: string
  }
  history: {
    quizzes: unknown[]
  }
}

// Find existing sync gist
async function findSyncGist(pat: string): Promise<string | null> {
  const res = await fetch('https://api.github.com/gists?per_page=100', {
    headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const gists = (await res.json()) as Array<{
    id: string
    description: string
    files: Record<string, unknown>
  }>
  const found = gists.find(
    (g) => g.description === GIST_DESCRIPTION && g.files[GIST_FILENAME],
  )
  return found?.id ?? null
}

// Create new sync gist
async function createSyncGist(pat: string, data: SyncData): Promise<string> {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
    }),
  })
  if (res.status === 403) {
    throw new Error('Gist creation blocked (403). Your GitHub token needs the "gist" scope. Create a new token with gist permissions.')
  }
  if (!res.ok) throw new Error(`Failed to create gist: ${res.status}`)
  const gist = (await res.json()) as { id: string }
  return gist.id
}

// Update existing sync gist
async function updateSyncGist(
  pat: string,
  gistId: string,
  data: SyncData,
): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
    }),
  })
  if (!res.ok) throw new Error(`Failed to update gist: ${res.status}`)
}

// Read sync gist
async function readSyncGist(pat: string, gistId: string): Promise<SyncData> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`Failed to read gist: ${res.status}`)
  const gist = (await res.json()) as { files: Record<string, { content: string }> }
  const file = gist.files[GIST_FILENAME]
  if (!file) throw new Error('Sync file not found in gist')
  return JSON.parse(file.content)
}

// Gather current data from stores
function gatherSyncData(): SyncData {
  const settings = useSettingsStore.getState()
  const history = useHistoryStore.getState()
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    settings: {
      theme: settings.theme,
      language: settings.language,
      languageFilter: settings.languageFilter,
      activePresetKey: settings.activePresetKey,
      presets: settings.presets,
      corsProxyUrl: settings.corsProxyUrl,
    },
    history: {
      quizzes: history.quizzes,
    },
  }
}

// Apply synced data to stores
function applySyncData(data: SyncData): void {
  const settingsStore = useSettingsStore.getState()
  settingsStore.setTheme(data.settings.theme as 'dark' | 'light')
  settingsStore.setLanguage(data.settings.language as 'ko' | 'en')
  settingsStore.setLanguageFilter(data.settings.languageFilter)
  settingsStore.setActivePresetKey(data.settings.activePresetKey)
  settingsStore.setCorsProxyUrl(data.settings.corsProxyUrl)
  // Restore presets
  for (const [key, preset] of Object.entries(data.settings.presets)) {
    settingsStore.updatePreset(key, preset as Record<string, unknown>)
  }
  // Restore history - add only quizzes that don't already exist
  const historyStore = useHistoryStore.getState()
  const existingIds = new Set(historyStore.quizzes.map((q) => q.id))
  for (const quiz of data.history.quizzes) {
    const q = quiz as { id: string }
    if (!existingIds.has(q.id)) {
      historyStore.addQuiz(quiz as Parameters<typeof historyStore.addQuiz>[0])
    }
  }
}

// Main sync functions
export async function saveToGist(): Promise<{ gistId: string; isNew: boolean }> {
  const pat = useSettingsStore.getState().githubPat
  if (!pat) throw new Error('GitHub PAT is required for sync')

  const data = gatherSyncData()
  const syncGistId = useSettingsStore.getState().syncGistId

  if (syncGistId) {
    await updateSyncGist(pat, syncGistId, data)
    return { gistId: syncGistId, isNew: false }
  }

  // Try to find existing gist
  const existingId = await findSyncGist(pat)
  if (existingId) {
    await updateSyncGist(pat, existingId, data)
    useSettingsStore.getState().setSyncGistId(existingId)
    return { gistId: existingId, isNew: false }
  }

  // Create new gist
  const newId = await createSyncGist(pat, data)
  useSettingsStore.getState().setSyncGistId(newId)
  return { gistId: newId, isNew: true }
}

export async function loadFromGist(): Promise<{ timestamp: string }> {
  const pat = useSettingsStore.getState().githubPat
  if (!pat) throw new Error('GitHub PAT is required for sync')

  let gistId = useSettingsStore.getState().syncGistId

  if (!gistId) {
    const found = await findSyncGist(pat)
    if (!found) throw new Error('No sync data found. Save first.')
    gistId = found
    useSettingsStore.getState().setSyncGistId(gistId)
  }

  const data = await readSyncGist(pat, gistId)
  applySyncData(data)
  return { timestamp: data.timestamp }
}
