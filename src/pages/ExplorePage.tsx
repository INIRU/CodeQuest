import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { Button, Badge, Skeleton, ErrorCard } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTrendingRepos } from '@/hooks/useTrendingRepos'
import { fetchRepoTree, fetchFileContent } from '@/services/github'
import RepoCard from '@/components/github/RepoCard'
import FileTree from '@/components/github/FileTree'
import CodeViewer from '@/components/github/CodeViewer'
import QuizGenerateModal from '@/components/github/QuizGenerateModal'
import { useTranslation } from '@/i18n'
import type { GitHubRepo, GitHubTreeItem } from '@/types'

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'go', 'rust',
  'c', 'cpp', 'csharp', 'ruby', 'swift', 'kotlin', 'php',
]

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

export default function ExplorePage() {
  const languageFilter = useSettingsStore((s) => s.languageFilter)
  const setLanguageFilter = useSettingsStore((s) => s.setLanguageFilter)
  const githubPat = useSettingsStore((s) => s.githubPat)
  const { t } = useTranslation()

  const { repos, loading, error, refetch } = useTrendingRepos()

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

  function toggleLanguage(lang: string) {
    if (languageFilter.includes(lang)) {
      setLanguageFilter(languageFilter.filter((l) => l !== lang))
    } else {
      setLanguageFilter([...languageFilter, lang])
    }
  }

  function openQuizModal(code: string) {
    setQuizCode(code)
    setQuizModalOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: 32, height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {selectedRepo && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} />
            {t('common.back')}
          </Button>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {selectedRepo ? selectedRepo.full_name : t('explore.title')}
        </h1>
        {!selectedRepo && (
          <Button variant="ghost" size="sm" onClick={refetch} loading={loading}>
            <RefreshCw size={14} />
          </Button>
        )}
      </div>

      {/* Language filter badges */}
      {!selectedRepo && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {LANGUAGES.map((lang) => (
            <Badge
              key={lang}
              active={languageFilter.includes(lang)}
              onClick={() => toggleLanguage(lang)}
              style={{ textTransform: 'capitalize' }}
            >
              {lang}
            </Badge>
          ))}
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
              {/* Repo list */}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height={100} style={{ borderRadius: 16 }} />
                  ))}
                </div>
              )}
              {error && <ErrorCard message={error} onRetry={refetch} />}
              {!loading && !error && repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onClick={handleSelectRepo} />
              ))}
              {!loading && !error && repos.length === 0 && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  No repositories found. Try adjusting the language filter.
                </p>
              )}
            </>
          ) : (
            <>
              {/* File tree */}
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
                {t('explore.selectFile')}
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
