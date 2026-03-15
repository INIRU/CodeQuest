import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, ArrowLeft, Lock, CheckSquare, Square, Sparkles, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Skeleton, ErrorCard, Card } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGithubStore } from '@/stores/useGithubStore'
import { fetchMyRepos, fetchRepoTree, fetchFileContent, fetchMultipleFiles } from '@/services/github'
import RepoCard from '@/components/github/RepoCard'
import FileTree, { getCodeFilePaths } from '@/components/github/FileTree'
import CodeViewer from '@/components/github/CodeViewer'
import QuizGenerateModal from '@/components/github/QuizGenerateModal'
import type { MultiFileEntry } from '@/components/github/QuizGenerateModal'
import { RepoUrlInput } from '@/components/github/RepoUrlInput'
import { useTranslation } from '@/i18n'
import type { GitHubRepo, GitHubTreeItem } from '@/types'

function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const langMap: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    kt: 'kotlin', swift: 'swift', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp',
    cs: 'csharp', php: 'php',
  }
  return langMap[ext] ?? ext
}

export default function MyReposPage() {
  const navigate = useNavigate()
  const githubPat = useSettingsStore((s) => s.githubPat)
  const myRepos = useGithubStore((s) => s.myRepos)
  const isMyReposStale = useGithubStore((s) => s.isMyReposStale)
  const setMyRepos = useGithubStore((s) => s.setMyRepos)
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [tree, setTree] = useState<GitHubTreeItem[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeError, setTreeError] = useState<string | null>(null)

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [quizCode, setQuizCode] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)

  // Multi-select state
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [multiFiles, setMultiFiles] = useState<MultiFileEntry[]>([])
  const [multiFetchLoading, setMultiFetchLoading] = useState(false)

  // Get all code file paths for the current tree
  const allCodeFilePaths = useMemo(() => {
    if (tree.length === 0) return []
    return getCodeFilePaths(tree)
  }, [tree])

  const handleUrlLoad = useCallback(async (owner: string, repo: string) => {
    const fullName = `${owner}/${repo}`
    const fakeRepo: GitHubRepo = {
      id: Date.now(),
      full_name: fullName,
      name: repo,
      owner: { login: owner, avatar_url: '' },
      description: null,
      language: null,
      stargazers_count: 0,
      html_url: `https://github.com/${fullName}`,
      updated_at: new Date().toISOString(),
    }
    setSelectedRepo(fakeRepo)
    setSelectedFilePath(null)
    setFileContent(null)
    setMultiSelectMode(false)
    setSelectedFiles(new Set())
    setTreeLoading(true)
    setTreeError(null)
    setUrlLoading(true)
    try {
      const items = await fetchRepoTree(owner, repo, undefined, githubPat || undefined)
      setTree(items)
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Failed to fetch file tree')
    } finally {
      setTreeLoading(false)
      setUrlLoading(false)
    }
  }, [githubPat])

  const doFetch = useCallback(async () => {
    if (!githubPat) return
    setLoading(true)
    setError(null)
    try {
      const repos = await fetchMyRepos(githubPat)
      setMyRepos(repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }, [githubPat, setMyRepos])

  useEffect(() => {
    if (githubPat && isMyReposStale()) {
      doFetch()
    }
  }, [githubPat, isMyReposStale, doFetch])

  const handleSelectRepo = useCallback(async (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setSelectedFilePath(null)
    setFileContent(null)
    setMultiSelectMode(false)
    setSelectedFiles(new Set())
    setTreeLoading(true)
    setTreeError(null)
    try {
      const [owner, repoName] = repo.full_name.split('/')
      const items = await fetchRepoTree(owner, repoName, undefined, githubPat || undefined)
      setTree(items)
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Failed to fetch file tree')
    } finally {
      setTreeLoading(false)
    }
  }, [githubPat])

  const handleSelectFile = useCallback(async (path: string) => {
    if (!selectedRepo) return
    setSelectedFilePath(path)
    setFileLoading(true)
    setFileError(null)
    try {
      const [owner, repoName] = selectedRepo.full_name.split('/')
      const content = await fetchFileContent(owner, repoName, path, githubPat || undefined)
      setFileContent(content)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to fetch file')
    } finally {
      setFileLoading(false)
    }
  }, [selectedRepo, githubPat])

  function handleBack() {
    setSelectedRepo(null)
    setTree([])
    setSelectedFilePath(null)
    setFileContent(null)
    setMultiSelectMode(false)
    setSelectedFiles(new Set())
  }

  function openQuizModal(code: string) {
    setMultiFiles([])
    setQuizCode(code)
    setQuizModalOpen(true)
  }

  // Multi-select handlers
  function toggleMultiSelectMode() {
    setMultiSelectMode((prev) => !prev)
    setSelectedFiles(new Set())
  }

  const handleToggleFile = useCallback((path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleToggleFolder = useCallback((paths: string[], select: boolean) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      for (const path of paths) {
        if (select) {
          next.add(path)
        } else {
          next.delete(path)
        }
      }
      return next
    })
  }, [])

  function handleSelectAll() {
    if (selectedFiles.size === allCodeFilePaths.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(allCodeFilePaths))
    }
  }

  async function handleGenerateFromSelected() {
    if (!selectedRepo || selectedFiles.size === 0) return
    setMultiFetchLoading(true)
    try {
      const [owner, repoName] = selectedRepo.full_name.split('/')
      const paths = Array.from(selectedFiles)
      const results = await fetchMultipleFiles(owner, repoName, paths, githubPat || undefined)
      setMultiFiles(results)
      setQuizCode('')
      setQuizModalOpen(true)
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setMultiFetchLoading(false)
    }
  }

  const isAllSelected = allCodeFilePaths.length > 0 && selectedFiles.size === allCodeFilePaths.length

  // No PAT: show empty state
  if (!githubPat) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: 32 }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '0 0 24px 0' }}>
          {t('myRepos.title')}
        </h1>
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: 48,
            textAlign: 'center',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          <Lock size={40} color="var(--text-muted)" />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {t('myRepos.tokenRequired')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
            {t('myRepos.tokenRequiredDesc')}
          </p>
          <Button variant="primary" onClick={() => navigate('/settings')}>
            {t('myRepos.goToSettings')}
          </Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: 32, height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {selectedRepo && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} />
            {t('common.back')}
          </Button>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {selectedRepo ? selectedRepo.full_name : t('myRepos.title')}
        </h1>
        {!selectedRepo && (
          <Button variant="ghost" size="sm" onClick={doFetch} loading={loading}>
            <RefreshCw size={14} />
          </Button>
        )}
      </div>

      {/* GitHub URL direct input */}
      {!selectedRepo && (
        <div style={{ marginBottom: 20 }}>
          <RepoUrlInput onLoad={handleUrlLoad} loading={urlLoading} />
        </div>
      )}

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, gap: 20, overflow: 'hidden' }}>
        {/* Left sidebar */}
        <div
          style={{
            width: 288,
            minWidth: 288,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
          }}
        >
          {!selectedRepo ? (
            <>
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height={100} style={{ borderRadius: 16 }} />
                  ))}
                </div>
              )}
              {error && <ErrorCard message={error} onRetry={doFetch} />}
              {!loading && !error && myRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onClick={handleSelectRepo} />
              ))}
              {!loading && !error && myRepos.length === 0 && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  No repositories found.
                </p>
              )}
            </>
          ) : (
            <>
              {/* Multi-select toolbar */}
              {!treeLoading && !treeError && tree.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '8px 8px 4px 8px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Button
                      variant={multiSelectMode ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={toggleMultiSelectMode}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                    >
                      {multiSelectMode ? <CheckSquare size={13} /> : <Square size={13} />}
                      {t('explore.projectQuiz')}
                    </Button>
                  </div>
                  {multiSelectMode && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <button
                          onClick={handleSelectAll}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                            padding: '2px 0',
                          }}
                        >
                          {isAllSelected ? t('explore.deselectAll') : t('explore.selectAll')}
                        </button>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {t('explore.filesSelected', { count: selectedFiles.size })}
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerateFromSelected}
                        disabled={selectedFiles.size === 0 || multiFetchLoading}
                        loading={multiFetchLoading}
                        style={{ fontSize: 12, width: '100%' }}
                      >
                        {multiFetchLoading ? (
                          <>
                            <Loader size={13} />
                            {t('explore.fetchingFiles')}
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            {t('explore.generateFromSelected')}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {treeLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} height={24} style={{ borderRadius: 4 }} />
                  ))}
                </div>
              )}
              {treeError && <ErrorCard message={treeError} />}
              {!treeLoading && !treeError && tree.length > 0 && (
                <FileTree
                  items={tree}
                  onSelectFile={handleSelectFile}
                  multiSelect={multiSelectMode}
                  selectedFiles={selectedFiles}
                  onToggleFile={handleToggleFile}
                  onToggleFolder={handleToggleFolder}
                />
              )}
            </>
          )}
        </div>

        {/* Right main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedRepo && selectedFilePath && (
            <>
              {fileLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
                  <Skeleton height={400} style={{ borderRadius: 12 }} />
                </div>
              )}
              {fileError && <ErrorCard message={fileError} />}
              {!fileLoading && !fileError && fileContent !== null && (
                <CodeViewer
                  code={fileContent}
                  filePath={selectedFilePath}
                  onGenerateFromSelection={(code) => openQuizModal(code)}
                  onGenerateFromFile={(code) => openQuizModal(code)}
                />
              )}
            </>
          )}
          {selectedRepo && !selectedFilePath && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {multiSelectMode ? t('explore.noFilesSelected') : t('explore.selectFile')}
              </p>
            </div>
          )}
          {!selectedRepo && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {t('explore.selectFile')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Generate Modal - single file */}
      {selectedRepo && selectedFilePath && multiFiles.length === 0 && (
        <QuizGenerateModal
          open={quizModalOpen}
          onOpenChange={setQuizModalOpen}
          code={quizCode}
          language={detectLanguageFromPath(selectedFilePath)}
          sourceRepo={selectedRepo.full_name}
          sourceFile={selectedFilePath}
        />
      )}

      {/* Quiz Generate Modal - multi file */}
      {selectedRepo && multiFiles.length > 0 && (
        <QuizGenerateModal
          open={quizModalOpen}
          onOpenChange={(open) => {
            setQuizModalOpen(open)
            if (!open) setMultiFiles([])
          }}
          code=""
          language=""
          sourceRepo={selectedRepo.full_name}
          sourceFile=""
          files={multiFiles}
        />
      )}
    </motion.div>
  )
}
