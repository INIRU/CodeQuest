import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, ArrowLeft, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Skeleton, ErrorCard, Card } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGithubStore } from '@/stores/useGithubStore'
import { fetchMyRepos, fetchRepoTree, fetchFileContent } from '@/services/github'
import RepoCard from '@/components/github/RepoCard'
import FileTree from '@/components/github/FileTree'
import CodeViewer from '@/components/github/CodeViewer'
import QuizGenerateModal from '@/components/github/QuizGenerateModal'
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
  }

  function openQuizModal(code: string) {
    setQuizCode(code)
    setQuizModalOpen(true)
  }

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
          My Repos
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
            GitHub Token Required
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
            To browse your private repositories, add a GitHub Personal Access Token in Settings.
          </p>
          <Button variant="primary" onClick={() => navigate('/settings')}>
            Go to Settings
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
            Back
          </Button>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {selectedRepo ? selectedRepo.full_name : 'My Repos'}
        </h1>
        {!selectedRepo && (
          <Button variant="ghost" size="sm" onClick={doFetch} loading={loading}>
            <RefreshCw size={14} />
          </Button>
        )}
      </div>

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
              {treeLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} height={24} style={{ borderRadius: 4 }} />
                  ))}
                </div>
              )}
              {treeError && <ErrorCard message={treeError} />}
              {!treeLoading && !treeError && tree.length > 0 && (
                <FileTree items={tree} onSelectFile={handleSelectFile} />
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
                Select a file from the tree to view its contents
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
                Select a repository to browse its files
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Generate Modal */}
      {selectedRepo && selectedFilePath && (
        <QuizGenerateModal
          open={quizModalOpen}
          onOpenChange={setQuizModalOpen}
          code={quizCode}
          language={detectLanguageFromPath(selectedFilePath)}
          sourceRepo={selectedRepo.full_name}
          sourceFile={selectedFilePath}
        />
      )}
    </motion.div>
  )
}
