# CodeTraining Platform — Part 3: Pages & Deployment

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Explore, My Repos, Quiz, Dashboard, History pages, and GitHub Actions deployment.

**Architecture:** Client-side React app with Monaco Editor, Framer Motion animations, GitHub API integration, AI quiz generation/grading.

**Tech Stack:** Vite, React, TypeScript, Monaco Editor, Framer Motion, Radix UI Tabs, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-16-code-training-platform-design.md`

---

## Chunk 4: GitHub Explore & My Repos

### Task 10: Explore page — trending repos

**Files:**
- Create: `src/pages/ExplorePage.tsx`
- Create: `src/components/github/RepoCard.tsx`
- Create: `src/components/github/FileTree.tsx`
- Create: `src/components/github/CodeViewer.tsx`
- Create: `src/components/github/QuizGenerateModal.tsx`
- Create: `src/hooks/useTrendingRepos.ts`

- [ ] **Step 1: Create useTrendingRepos hook**

Create `src/hooks/useTrendingRepos.ts`:
```typescript
import { useEffect, useState } from 'react'
import { useGithubStore } from '@/stores/useGithubStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { fetchTrendingRepos } from '@/services/github'

export function useTrendingRepos() {
  const { trendingRepos, setTrending, isTrendingStale } = useGithubStore()
  const { languageFilter, githubPat } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const repos = await fetchTrendingRepos(languageFilter, githubPat || undefined)
      setTrending(repos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch trending repos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isTrendingStale()) fetch()
  }, [languageFilter.join(',')])

  return { repos: trendingRepos, loading, error, refetch: fetch }
}
```

- [ ] **Step 2: Create RepoCard**

Create `src/components/github/RepoCard.tsx`:
```tsx
import { Star, GitFork } from 'lucide-react'
import { Card } from '@/components/ui'
import type { GitHubRepo } from '@/types'

interface Props {
  repo: GitHubRepo
  onClick: () => void
}

export function RepoCard({ repo, onClick }: Props) {
  return (
    <Card hover className="p-4" onClick={onClick}>
      <div className="flex items-center gap-3 mb-2">
        <img src={repo.owner.avatar_url} alt="" className="w-8 h-8 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{repo.full_name}</p>
        </div>
      </div>
      {repo.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-sub)' }}>{repo.description}</p>
      )}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1"><Star size={12} />{repo.stargazers_count.toLocaleString()}</span>
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Create FileTree**

Create `src/components/github/FileTree.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'
import type { GitHubTreeItem } from '@/types'

interface TreeNode {
  name: string
  path: string
  type: 'blob' | 'tree'
  children: TreeNode[]
}

function buildTree(items: GitHubTreeItem[]): TreeNode[] {
  const root: TreeNode[] = []
  for (const item of items) {
    const parts = item.path.split('/')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isFile = i === parts.length - 1 && item.type === 'blob'
      let node = current.find((n) => n.name === name)
      if (!node) {
        node = { name, path: parts.slice(0, i + 1).join('/'), type: isFile ? 'blob' : 'tree', children: [] }
        current.push(node)
      }
      current = node.children
    }
  }
  return root
}

function TreeItem({ node, onSelect, depth = 0 }: { node: TreeNode; onSelect: (path: string) => void; depth?: number }) {
  const [open, setOpen] = useState(false)
  const isFolder = node.type === 'tree' || node.children.length > 0

  return (
    <div>
      <button
        onClick={() => isFolder ? setOpen(!open) : onSelect(node.path)}
        className="flex items-center gap-1.5 w-full text-left py-1 px-2 text-sm rounded hover:bg-[var(--glass)] transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px`, color: 'var(--text)' }}
      >
        {isFolder ? (
          open ? <><ChevronDown size={14} /><FolderOpen size={14} style={{ color: 'var(--warning)' }} /></> : <><ChevronRight size={14} /><Folder size={14} style={{ color: 'var(--warning)' }} /></>
        ) : (
          <><span className="w-3.5" /><File size={14} style={{ color: 'var(--text-muted)' }} /></>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children
        .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'tree' ? -1 : 1))
        .map((child) => <TreeItem key={child.path} node={child} onSelect={onSelect} depth={depth + 1} />)}
    </div>
  )
}

interface Props {
  items: GitHubTreeItem[]
  onSelectFile: (path: string) => void
}

export function FileTree({ items, onSelectFile }: Props) {
  const tree = useMemo(() => buildTree(items), [items])
  return (
    <div className="overflow-auto max-h-[70vh]">
      {tree
        .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'tree' ? -1 : 1))
        .map((node) => <TreeItem key={node.path} node={node} onSelect={onSelectFile} />)}
    </div>
  )
}
```

- [ ] **Step 4: Create CodeViewer with selection**

Create `src/components/github/CodeViewer.tsx`:
```tsx
import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Button } from '@/components/ui'
import { Wand2, FileCode } from 'lucide-react'

interface Props {
  code: string
  language: string
  onGenerateQuiz: (selectedCode: string) => void
}

export function CodeViewer({ code, language, onGenerateQuiz }: Props) {
  const theme = useSettingsStore((s) => s.theme)
  const editorRef = useRef<any>(null)
  const [selection, setSelection] = useState<string | null>(null)

  const handleMount = (editor: any) => {
    editorRef.current = editor
    editor.onDidChangeCursorSelection(() => {
      const sel = editor.getModel()?.getValueInRange(editor.getSelection())
      setSelection(sel && sel.trim() ? sel : null)
    })
  }

  const lines = code.split('\n').length
  const tooLong = lines > 1000

  return (
    <div className="flex flex-col h-full">
      {tooLong && (
        <div className="px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
          Large file ({lines} lines). Only first 500 lines shown. Select a portion for quiz generation.
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={tooLong ? code.split('\n').slice(0, 500).join('\n') : code}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', scrollBeyondLastLine: false }}
          onMount={handleMount}
        />
      </div>
      <div className="flex gap-2 p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Button size="sm" onClick={() => onGenerateQuiz(selection || code)} disabled={tooLong && !selection}>
          <Wand2 size={14} />
          {selection ? 'Generate from selection' : 'Generate from entire file'}
        </Button>
        {selection && (
          <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
            {selection.split('\n').length} lines selected
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create QuizGenerateModal**

Create `src/components/github/QuizGenerateModal.tsx`:
```tsx
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useQuizStore } from '@/stores/useQuizStore'
import { generateQuiz } from '@/services/quiz-generator'
import { X, Loader2 } from 'lucide-react'
import type { QuizType, Difficulty } from '@/types'

const QUIZ_TYPES: { value: QuizType; label: string; desc: string }[] = [
  { value: 'explain', label: 'Explain', desc: 'Describe what this code does' },
  { value: 'fill-blank', label: 'Fill Blank', desc: 'Fill in the missing parts' },
  { value: 'code', label: 'Code', desc: 'Write code from requirements' },
  { value: 'bug-hunt', label: 'Bug Hunt', desc: 'Find and fix the bugs' },
  { value: 'code-review', label: 'Code Review', desc: 'Find improvements' },
  { value: 'output-prediction', label: 'Output', desc: 'Predict the output' },
]

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

interface Props {
  open: boolean
  onClose: () => void
  code: string
  language: string
  sourceRepo: string
  sourceFile: string
}

export function QuizGenerateModal({ open, onClose, code, language, sourceRepo, sourceFile }: Props) {
  const [quizType, setQuizType] = useState<QuizType>('explain')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setCurrentQuiz, setIsGenerating } = useQuizStore()
  const navigate = useNavigate()

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setIsGenerating(true)
    try {
      const quiz = await generateQuiz(code, language, quizType, difficulty, sourceRepo, sourceFile)
      setCurrentQuiz(quiz)
      onClose()
      navigate(`/quiz/${quiz.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl p-6"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Generate Quiz</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {/* Quiz Type */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-sub)' }}>Quiz Type</p>
              <div className="grid grid-cols-2 gap-2">
                {QUIZ_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setQuizType(t.value)}
                    className="p-3 rounded-lg text-left transition-all"
                    style={{
                      backgroundColor: quizType === t.value ? 'var(--primary)' : 'var(--glass)',
                      color: quizType === t.value ? '#fff' : 'var(--text)',
                      border: `1px solid ${quizType === t.value ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-sub)' }}>Difficulty</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: difficulty === d.value ? 'var(--primary)' : 'var(--glass)',
                      color: difficulty === d.value ? '#fff' : 'var(--text)',
                      border: `1px solid ${difficulty === d.value ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {code.split('\n').length} lines of {language} code selected from {sourceFile}
            </p>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            <Button onClick={handleGenerate} loading={loading} className="w-full">
              Generate Quiz
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 6: Assemble ExplorePage**

Update `src/pages/ExplorePage.tsx`:
```tsx
import { useState } from 'react'
import { useTrendingRepos } from '@/hooks/useTrendingRepos'
import { fetchRepoTree, fetchFileContent } from '@/services/github'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { RepoCard } from '@/components/github/RepoCard'
import { FileTree } from '@/components/github/FileTree'
import { CodeViewer } from '@/components/github/CodeViewer'
import { QuizGenerateModal } from '@/components/github/QuizGenerateModal'
import { Badge, Skeleton, ErrorCard } from '@/components/ui'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import type { GitHubTreeItem } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExplorePage() {
  const { repos, loading, error, refetch } = useTrendingRepos()
  const { languageFilter, setLanguageFilter, githubPat } = useSettingsStore()
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; fullName: string } | null>(null)
  const [tree, setTree] = useState<GitHubTreeItem[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [fileContent, setFileContent] = useState<{ code: string; path: string; language: string } | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [quizModal, setQuizModal] = useState<{ code: string; language: string } | null>(null)

  const handleRepoClick = async (owner: string, repo: string, fullName: string) => {
    setSelectedRepo({ owner, repo, fullName })
    setFileContent(null)
    setTreeLoading(true)
    try {
      const items = await fetchRepoTree(owner, repo, 'main', githubPat || undefined)
      setTree(items)
    } catch {
      setTree([])
    } finally {
      setTreeLoading(false)
    }
  }

  const handleFileSelect = async (path: string) => {
    if (!selectedRepo) return
    setFileLoading(true)
    try {
      const code = await fetchFileContent(selectedRepo.owner, selectedRepo.repo, path, githubPat || undefined)
      const ext = path.split('.').pop() || ''
      const langMap: Record<string, string> = { py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript', go: 'go', rs: 'rust', java: 'java', rb: 'ruby', cpp: 'cpp', c: 'c', cs: 'csharp', swift: 'swift', kt: 'kotlin', php: 'php' }
      setFileContent({ code, path, language: langMap[ext] || ext })
    } catch {
      setFileContent(null)
    } finally {
      setFileLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Explore</h1>
        <Button variant="ghost" size="sm" onClick={refetch}><RefreshCw size={14} /></Button>
      </div>

      {/* Language filter */}
      <div className="flex flex-wrap gap-2">
        {['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'cpp'].map((lang) => (
          <Badge
            key={lang}
            active={languageFilter.includes(lang)}
            onClick={() => {
              if (languageFilter.includes(lang)) setLanguageFilter(languageFilter.filter((l) => l !== lang))
              else setLanguageFilter([...languageFilter, lang])
            }}
          >
            {lang}
          </Badge>
        ))}
      </div>

      {error && <ErrorCard message={error} onRetry={refetch} />}

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left: repos or file tree */}
        <div className="w-72 flex-shrink-0 overflow-auto rounded-xl" style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border)' }}>
          {!selectedRepo ? (
            <div className="p-3 space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                repos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    onClick={() => handleRepoClick(repo.owner.login, repo.name, repo.full_name)}
                  />
                ))
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setSelectedRepo(null); setFileContent(null) }}
                className="w-full p-3 text-sm text-left border-b flex items-center gap-2"
                style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
              >
                ← Back to repos
              </button>
              <p className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-sub)' }}>{selectedRepo.fullName}</p>
              {treeLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : (
                <FileTree items={tree} onSelectFile={handleFileSelect} />
              )}
            </div>
          )}
        </div>

        {/* Right: code viewer */}
        <div className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {fileLoading ? (
            <div className="p-6"><Skeleton className="h-full min-h-[300px]" /></div>
          ) : fileContent ? (
            <CodeViewer
              code={fileContent.code}
              language={fileContent.language}
              onGenerateQuiz={(code) => setQuizModal({ code, language: fileContent.language })}
            />
          ) : (
            <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">Select a file to view code</p>
            </div>
          )}
        </div>
      </div>

      {/* Quiz generate modal */}
      {quizModal && selectedRepo && fileContent && (
        <QuizGenerateModal
          open={!!quizModal}
          onClose={() => setQuizModal(null)}
          code={quizModal.code}
          language={quizModal.language}
          sourceRepo={selectedRepo.fullName}
          sourceFile={fileContent.path}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 7: Verify Explore page**

```bash
npm run dev
```

Navigate to `/#/explore`. Should see language filter badges, repo list (once GitHub API responds).

- [ ] **Step 8: Commit**

```bash
git add src/hooks/ src/components/github/ src/pages/ExplorePage.tsx
git commit -m "feat: add Explore page with trending repos, file tree, code viewer, and quiz generation"
```

---

### Task 11: My Repos page

**Files:**
- Create: `src/pages/MyReposPage.tsx`

- [ ] **Step 1: Implement MyReposPage**

Update `src/pages/MyReposPage.tsx` — similar to Explore but uses `fetchMyRepos`:
```tsx
import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGithubStore } from '@/stores/useGithubStore'
import { fetchMyRepos, fetchRepoTree, fetchFileContent } from '@/services/github'
import { RepoCard } from '@/components/github/RepoCard'
import { FileTree } from '@/components/github/FileTree'
import { CodeViewer } from '@/components/github/CodeViewer'
import { QuizGenerateModal } from '@/components/github/QuizGenerateModal'
import { Card, Skeleton, ErrorCard, Button } from '@/components/ui'
import { FolderGit2, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { GitHubTreeItem } from '@/types'

export default function MyReposPage() {
  const { githubPat } = useSettingsStore()
  const { myRepos, setMyRepos, isMyReposStale } = useGithubStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; fullName: string } | null>(null)
  const [tree, setTree] = useState<GitHubTreeItem[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [fileContent, setFileContent] = useState<{ code: string; path: string; language: string } | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [quizModal, setQuizModal] = useState<{ code: string; language: string } | null>(null)

  const fetchRepos = async () => {
    if (!githubPat) return
    setLoading(true)
    setError(null)
    try {
      const repos = await fetchMyRepos(githubPat)
      setMyRepos(repos)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch repos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (githubPat && isMyReposStale()) fetchRepos()
  }, [githubPat])

  const handleRepoClick = async (owner: string, repo: string, fullName: string) => {
    setSelectedRepo({ owner, repo, fullName })
    setFileContent(null)
    setTreeLoading(true)
    try {
      const items = await fetchRepoTree(owner, repo, 'main', githubPat || undefined)
      setTree(items)
    } catch {
      setTree([])
    } finally {
      setTreeLoading(false)
    }
  }

  const handleFileSelect = async (path: string) => {
    if (!selectedRepo) return
    setFileLoading(true)
    try {
      const code = await fetchFileContent(selectedRepo.owner, selectedRepo.repo, path, githubPat || undefined)
      const ext = path.split('.').pop() || ''
      const langMap: Record<string, string> = { py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript', go: 'go', rs: 'rust', java: 'java' }
      setFileContent({ code, path, language: langMap[ext] || ext })
    } catch {
      setFileContent(null)
    } finally {
      setFileLoading(false)
    }
  }

  if (!githubPat) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 text-center max-w-sm">
          <FolderGit2 size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-2" style={{ color: 'var(--text)' }}>GitHub Token Required</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-sub)' }}>Set up your Personal Access Token to browse your repos.</p>
          <Button onClick={() => navigate('/settings')}>
            <Settings size={14} /> Go to Settings
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>My Repos</h1>

      {error && <ErrorCard message={error} onRetry={fetchRepos} />}

      <div className="flex-1 min-h-0 flex gap-4">
        <div className="w-72 flex-shrink-0 overflow-auto rounded-xl" style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border)' }}>
          {!selectedRepo ? (
            <div className="p-3 space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                myRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onClick={() => handleRepoClick(repo.owner.login, repo.name, repo.full_name)} />
                ))
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setSelectedRepo(null); setFileContent(null) }}
                className="w-full p-3 text-sm text-left border-b flex items-center gap-2"
                style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
              >
                ← Back
              </button>
              {treeLoading ? (
                <div className="p-3 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
              ) : (
                <FileTree items={tree} onSelectFile={handleFileSelect} />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {fileLoading ? (
            <div className="p-6"><Skeleton className="h-full min-h-[300px]" /></div>
          ) : fileContent ? (
            <CodeViewer
              code={fileContent.code}
              language={fileContent.language}
              onGenerateQuiz={(code) => setQuizModal({ code, language: fileContent.language })}
            />
          ) : (
            <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">Select a file to view code</p>
            </div>
          )}
        </div>
      </div>

      {quizModal && selectedRepo && fileContent && (
        <QuizGenerateModal
          open={!!quizModal}
          onClose={() => setQuizModal(null)}
          code={quizModal.code}
          language={quizModal.language}
          sourceRepo={selectedRepo.fullName}
          sourceFile={fileContent.path}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build && git add src/pages/MyReposPage.tsx && git commit -m "feat: add My Repos page"
```

---

## Chunk 5: Quiz Page

### Task 12: Quiz page with 6 quiz types

**Files:**
- Create: `src/pages/QuizPage.tsx`
- Create: `src/components/quiz/ExplainQuiz.tsx`
- Create: `src/components/quiz/FillBlankQuiz.tsx`
- Create: `src/components/quiz/CodeQuiz.tsx`
- Create: `src/components/quiz/BugHuntQuiz.tsx`
- Create: `src/components/quiz/CodeReviewQuiz.tsx`
- Create: `src/components/quiz/OutputPredictionQuiz.tsx`
- Create: `src/components/quiz/HintPanel.tsx`
- Create: `src/components/quiz/GradingResult.tsx`

- [ ] **Step 1: Create HintPanel**

Create `src/components/quiz/HintPanel.tsx`:
```tsx
import { useState } from 'react'
import { useQuizStore } from '@/stores/useQuizStore'
import { Card, Button } from '@/components/ui'
import { Lightbulb, Lock, Unlock } from 'lucide-react'
import type { Quiz } from '@/types'

interface Props {
  quiz: Quiz
}

export function HintPanel({ quiz }: Props) {
  const { hintsUsed, useHint } = useQuizStore()

  return (
    <Card className="p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Lightbulb size={16} style={{ color: 'var(--warning)' }} /> Hints
      </p>

      {/* Level 1: always visible */}
      <div className="space-y-1">
        <p className="text-xs font-medium" style={{ color: 'var(--text-sub)' }}>Variables</p>
        {Object.entries(quiz.hints.variables).map(([name, desc]) => (
          <p key={name} className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--primary)' }}>{name}</span>: {desc}
          </p>
        ))}
        <p className="text-xs font-medium mt-2" style={{ color: 'var(--text-sub)' }}>Functions</p>
        {Object.entries(quiz.hints.functions).map(([name, desc]) => (
          <p key={name} className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--primary)' }}>{name}</span>: {desc}
          </p>
        ))}
      </div>

      {/* Level 2 */}
      <div>
        {hintsUsed >= 1 ? (
          <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--glass)', color: 'var(--text-sub)' }}>
            <Unlock size={12} className="inline mr-1" />{quiz.hintLevels.level2}
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={useHint}>
            <Lock size={12} /> Logic Hint (-20%)
          </Button>
        )}
      </div>

      {/* Level 3 */}
      <div>
        {hintsUsed >= 2 ? (
          <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--glass)', color: 'var(--text-sub)' }}>
            <Unlock size={12} className="inline mr-1" />{quiz.hintLevels.level3}
          </div>
        ) : hintsUsed >= 1 ? (
          <Button variant="ghost" size="sm" onClick={useHint}>
            <Lock size={12} /> Strong Hint (-50%)
          </Button>
        ) : null}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Score penalty: {hintsUsed === 0 ? 'None' : hintsUsed === 1 ? '-20%' : '-50%'}
      </p>
    </Card>
  )
}
```

- [ ] **Step 2: Create GradingResult component**

Create `src/components/quiz/GradingResult.tsx`:
```tsx
import { Card } from '@/components/ui'
import { CheckCircle, XCircle, Award } from 'lucide-react'
import type { GradingResult as GradingResultType } from '@/types'
import { motion } from 'framer-motion'

interface Props {
  result: GradingResultType
  finalScore: number
  hintsUsed: number
}

export function GradingResultView({ result, finalScore, hintsUsed }: Props) {
  const scoreColor = finalScore >= 80 ? 'var(--success)' : finalScore >= 50 ? 'var(--warning)' : 'var(--error)'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold" style={{ color: scoreColor }}>{finalScore}</div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              <Award size={14} className="inline mr-1" />
              {finalScore >= 80 ? 'Excellent!' : finalScore >= 50 ? 'Good effort' : 'Keep practicing'}
            </p>
            {hintsUsed > 0 && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Raw: {result.score} / Penalty: {hintsUsed === 1 ? '-20%' : '-50%'}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{result.feedback}</p>

        <div className="space-y-2">
          {result.details.map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {d.correct
                ? <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                : <XCircle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />}
              <div>
                <p style={{ color: 'var(--text)' }}>{d.point}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.comment}</p>
              </div>
            </div>
          ))}
        </div>

        <details>
          <summary className="text-sm cursor-pointer" style={{ color: 'var(--primary)' }}>View correct answer</summary>
          <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto font-mono" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
            {result.correctAnswer}
          </pre>
        </details>
      </Card>
    </motion.div>
  )
}
```

- [ ] **Step 3: Create quiz type components**

Create `src/components/quiz/ExplainQuiz.tsx`:
```tsx
import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { ExplainQuiz as ExplainQuizType } from '@/types'

interface Props {
  quiz: ExplainQuizType
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function ExplainQuizView({ quiz, value, onChange, disabled }: Props) {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border)' }}>
        <pre className="text-sm font-mono whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{quiz.code}</pre>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{quiz.question}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={8}
        className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        placeholder="Explain what this code does..."
      />
    </div>
  )
}
```

Create `src/components/quiz/FillBlankQuiz.tsx`:
```tsx
import { useState } from 'react'
import { Input } from '@/components/ui'
import type { FillBlankQuiz as FillBlankQuizType } from '@/types'

interface Props {
  quiz: FillBlankQuizType
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function FillBlankQuizView({ quiz, value, onChange, disabled }: Props) {
  const blanks = value ? value.split('|||') : quiz.answer.blanks.map(() => '')

  const updateBlank = (index: number, val: string) => {
    const updated = [...blanks]
    updated[index] = val
    onChange(updated.join('|||'))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{quiz.question}</p>
      <pre className="p-4 rounded-lg text-sm font-mono whitespace-pre-wrap" style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        {quiz.code}
      </pre>
      <div className="space-y-3">
        {quiz.answer.blanks.map((_, i) => (
          <Input
            key={i}
            label={`Blank ${i + 1}`}
            value={blanks[i] || ''}
            onChange={(e) => updateBlank(i, e.target.value)}
            disabled={disabled}
            placeholder="Fill in..."
          />
        ))}
      </div>
    </div>
  )
}
```

Create `src/components/quiz/CodeQuiz.tsx`:
```tsx
import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { CodeQuiz as CodeQuizType } from '@/types'

interface Props {
  quiz: CodeQuizType
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function CodeQuizView({ quiz, value, onChange, disabled }: Props) {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{quiz.question}</p>
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Requirements:</p>
        <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--text-sub)' }}>
          {quiz.answer.requirements.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', height: 300 }}>
        <Editor
          height="100%"
          language={quiz.language}
          value={value}
          onChange={(v) => onChange(v || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{ readOnly: disabled, minimap: { enabled: false }, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}
        />
      </div>
    </div>
  )
}
```

Create `src/components/quiz/BugHuntQuiz.tsx`:
```tsx
import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { BugHuntQuiz as BugHuntQuizType } from '@/types'

interface Props {
  quiz: BugHuntQuizType
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function BugHuntQuizView({ quiz, value, onChange, disabled }: Props) {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{quiz.question}</p>
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', height: 350 }}>
        <Editor
          height="100%"
          language={quiz.language}
          value={value || quiz.code}
          onChange={(v) => onChange(v || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{ readOnly: disabled, minimap: { enabled: false }, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}
        />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Edit the code above to fix the bug(s).</p>
    </div>
  )
}
```

Create `src/components/quiz/CodeReviewQuiz.tsx`:
```tsx
import type { CodeReviewQuiz as CodeReviewQuizType } from '@/types'

interface Props {
  quiz: CodeReviewQuizType
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function CodeReviewQuizView({ quiz, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{quiz.question}</p>
      <pre className="p-4 rounded-lg text-sm font-mono whitespace-pre-wrap" style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        {quiz.code}
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={8}
        className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        placeholder="List the improvements you would make..."
      />
    </div>
  )
}
```

Create `src/components/quiz/OutputPredictionQuiz.tsx`:
```tsx
import { Input } from '@/components/ui'
import type { OutputPredictionQuiz as OutputPredictionQuizType } from '@/types'

interface Props {
  quiz: OutputPredictionQuizType
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function OutputPredictionQuizView({ quiz, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{quiz.question}</p>
      <pre className="p-4 rounded-lg text-sm font-mono whitespace-pre-wrap" style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        {quiz.code}
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        className="w-full px-4 py-3 rounded-lg text-sm font-mono outline-none resize-y"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        placeholder="What will this code output?"
      />
    </div>
  )
}
```

- [ ] **Step 4: Assemble QuizPage**

Update `src/pages/QuizPage.tsx`:
```tsx
import { useQuizStore } from '@/stores/useQuizStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { gradeQuiz, calculateFinalScore } from '@/services/quiz-generator'
import { HintPanel } from '@/components/quiz/HintPanel'
import { GradingResultView } from '@/components/quiz/GradingResult'
import { ExplainQuizView } from '@/components/quiz/ExplainQuiz'
import { FillBlankQuizView } from '@/components/quiz/FillBlankQuiz'
import { CodeQuizView } from '@/components/quiz/CodeQuiz'
import { BugHuntQuizView } from '@/components/quiz/BugHuntQuiz'
import { CodeReviewQuizView } from '@/components/quiz/CodeReviewQuiz'
import { OutputPredictionQuizView } from '@/components/quiz/OutputPredictionQuiz'
import { Button, Card } from '@/components/ui'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const quizComponents = {
  'explain': ExplainQuizView,
  'fill-blank': FillBlankQuizView,
  'code': CodeQuizView,
  'bug-hunt': BugHuntQuizView,
  'code-review': CodeReviewQuizView,
  'output-prediction': OutputPredictionQuizView,
}

export default function QuizPage() {
  const { currentQuiz, userAnswer, setUserAnswer, gradingResult, setGradingResult, hintsUsed, isGrading, setIsGrading, getElapsed } = useQuizStore()
  const { addQuiz } = useHistoryStore()
  const navigate = useNavigate()

  if (!currentQuiz) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="mb-4" style={{ color: 'var(--text)' }}>No quiz loaded.</p>
          <Button onClick={() => navigate('/explore')}><ArrowLeft size={14} /> Explore</Button>
        </Card>
      </div>
    )
  }

  const QuizComponent = quizComponents[currentQuiz.type] as any
  const isSubmitted = !!gradingResult

  const handleSubmit = async () => {
    setIsGrading(true)
    try {
      const result = await gradeQuiz(currentQuiz, userAnswer)
      setGradingResult(result)
      const finalScore = calculateFinalScore(result.score, hintsUsed)
      addQuiz({
        id: currentQuiz.id,
        date: new Date().toISOString(),
        type: currentQuiz.type,
        language: currentQuiz.language,
        difficulty: currentQuiz.difficulty,
        score: finalScore,
        rawScore: result.score,
        hintsUsed,
        sourceRepo: currentQuiz.sourceRepo,
        sourceFile: currentQuiz.sourceFile,
        timeSpent: getElapsed(),
      })
    } catch (e) {
      // Show error inline
      setGradingResult({
        score: 0,
        feedback: e instanceof Error ? e.message : 'Grading failed',
        details: [],
        correctAnswer: '',
      })
    } finally {
      setIsGrading(false)
    }
  }

  const finalScore = gradingResult ? calculateFinalScore(gradingResult.score, hintsUsed) : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex gap-4"
    >
      {/* Left: quiz content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /></Button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{currentQuiz.type.replace('-', ' ').toUpperCase()}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {currentQuiz.language} / {currentQuiz.difficulty} / {currentQuiz.sourceFile}
            </p>
          </div>
        </div>

        <QuizComponent
          quiz={currentQuiz}
          value={userAnswer}
          onChange={setUserAnswer}
          disabled={isSubmitted}
        />

        {!isSubmitted && (
          <Button onClick={handleSubmit} loading={isGrading} disabled={!userAnswer.trim()}>
            <Send size={14} /> Submit
          </Button>
        )}

        {isSubmitted && gradingResult && (
          <GradingResultView result={gradingResult} finalScore={finalScore} hintsUsed={hintsUsed} />
        )}
      </div>

      {/* Right: hints */}
      <div className="w-72 flex-shrink-0">
        <HintPanel quiz={currentQuiz} />
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build
git add src/components/quiz/ src/pages/QuizPage.tsx
git commit -m "feat: add Quiz page with 6 quiz types, hints, and AI grading"
```

---

## Chunk 6: Dashboard & History

### Task 13: Dashboard page

**Files:**
- Create: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Implement Dashboard**

Update `src/pages/DashboardPage.tsx`:
```tsx
import { useHistoryStore } from '@/stores/useHistoryStore'
import { Card, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Target, TrendingUp, Search, BookOpen } from 'lucide-react'

export default function DashboardPage() {
  const { stats, quizzes } = useHistoryStore()
  const navigate = useNavigate()
  const recentQuizzes = quizzes.slice(0, 5)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Solved', value: stats.totalSolved, color: 'var(--primary)' },
          { icon: TrendingUp, label: 'Avg Score', value: stats.averageScore, color: 'var(--success)' },
          { icon: Flame, label: 'Streak', value: `${stats.currentStreak}d`, color: 'var(--warning)' },
          { icon: BookOpen, label: 'Languages', value: Object.keys(stats.byLanguage).length, color: 'var(--primary-end)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-4">
            <Icon size={20} style={{ color }} />
            <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/explore')}><Search size={14} /> Explore Trending</Button>
        <Button variant="secondary" onClick={() => navigate('/my-repos')}>My Repos</Button>
      </div>

      {/* Language breakdown */}
      {Object.keys(stats.byLanguage).length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>By Language</p>
          <div className="space-y-2">
            {Object.entries(stats.byLanguage)
              .sort(([, a], [, b]) => b - a)
              .map(([lang, count]) => (
                <div key={lang} className="flex items-center gap-3">
                  <span className="text-sm w-24" style={{ color: 'var(--text-sub)' }}>{lang}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / stats.totalSolved) * 100}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--primary-end))',
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{count}</span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Recent quizzes */}
      {recentQuizzes.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Recent</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>View all</Button>
          </div>
          <div className="space-y-2">
            {recentQuizzes.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{q.type.replace('-', ' ')} — {q.language}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.sourceFile}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: q.score >= 80 ? 'var(--success)' : q.score >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                  {q.score}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {stats.totalSolved === 0 && (
        <Card className="p-8 text-center">
          <BookOpen size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-2" style={{ color: 'var(--text)' }}>No quizzes yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-sub)' }}>Start by exploring trending repos and generating your first quiz!</p>
          <Button onClick={() => navigate('/explore')}><Search size={14} /> Start Exploring</Button>
        </Card>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardPage.tsx && git commit -m "feat: add Dashboard page with stats, recent quizzes, and language breakdown"
```

---

### Task 14: History page

**Files:**
- Create: `src/pages/HistoryPage.tsx`

- [ ] **Step 1: Implement History page**

Update `src/pages/HistoryPage.tsx`:
```tsx
import { useState } from 'react'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { Card, Badge } from '@/components/ui'
import { Clock, Star } from 'lucide-react'

export default function HistoryPage() {
  const { quizzes } = useHistoryStore()
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterLang, setFilterLang] = useState<string | null>(null)

  const types = [...new Set(quizzes.map((q) => q.type))]
  const languages = [...new Set(quizzes.map((q) => q.language))]

  const filtered = quizzes.filter((q) => {
    if (filterType && q.type !== filterType) return false
    if (filterLang && q.language !== filterLang) return false
    return true
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge active={!filterType} onClick={() => setFilterType(null)}>All types</Badge>
        {types.map((t) => (
          <Badge key={t} active={filterType === t} onClick={() => setFilterType(filterType === t ? null : t)}>
            {t.replace('-', ' ')}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge active={!filterLang} onClick={() => setFilterLang(null)}>All languages</Badge>
        {languages.map((l) => (
          <Badge key={l} active={filterLang === l} onClick={() => setFilterLang(filterLang === l ? null : l)}>
            {l}
          </Badge>
        ))}
      </div>

      {/* Quiz list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>No quizzes found</p>
          </Card>
        ) : (
          filtered.map((q) => (
            <Card key={q.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={q.score >= 80 ? 'success' : q.score >= 50 ? 'warning' : 'error'}>
                    {q.type.replace('-', ' ')}
                  </Badge>
                  <Badge>{q.language}</Badge>
                  <Badge>{q.difficulty}</Badge>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-sub)' }}>{q.sourceRepo} / {q.sourceFile}</p>
                <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span><Clock size={12} className="inline mr-1" />{new Date(q.date).toLocaleDateString()}</span>
                  <span>{Math.floor(q.timeSpent / 60)}m {q.timeSpent % 60}s</span>
                  {q.hintsUsed > 0 && <span>Hints: {q.hintsUsed}</span>}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-2xl font-bold" style={{ color: q.score >= 80 ? 'var(--success)' : q.score >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                  {q.score}
                </p>
                {q.rawScore !== q.score && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>raw: {q.rawScore}</p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/HistoryPage.tsx && git commit -m "feat: add History page with filtering"
```

---

## Chunk 7: Deployment

### Task 15: GitHub Actions deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/ && git commit -m "feat: add GitHub Actions workflow for Pages deployment"
```

---

### Task 16: Final verification

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Dev server smoke test**

```bash
npm run dev
```

Verify all routes render:
- `/#/` — Dashboard with empty state
- `/#/explore` — Language filter + repo list
- `/#/my-repos` — PAT required message
- `/#/history` — Empty history
- `/#/settings` — AI settings, GitHub PAT, language filter

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "feat: CodeTraining platform v1 complete"
```
