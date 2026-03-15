# CodeTraining Platform — Part 1: Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up project scaffolding, theme system, shared UI components, routing, and Zustand stores.

**Architecture:** Vite + React 18 + TypeScript with Hash Router for GitHub Pages. Tailwind CSS with CSS variables for dark/light theme. Zustand with persist middleware for all state.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, React Router (HashRouter), Zustand, Radix UI, Lucide React, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-16-code-training-platform-design.md`

---

## Chunk 1: Project Scaffolding

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Scaffold with Vite**

```bash
cd /Users/iniru/Documents/CodingTraning
npm create vite@latest . -- --template react-ts
```

Select: React, TypeScript

- [ ] **Step 2: Install core dependencies**

```bash
npm install react-router-dom zustand @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip lucide-react framer-motion @monaco-editor/react
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom @types/node
```

- [ ] **Step 4: Configure vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/CodingTraning/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create src/index.css with Tailwind**

```css
@import "tailwindcss";

@font-face {
  font-family: 'JetBrains Mono';
  src: url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
}

:root {
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --glass: rgba(0,0,0,0.03);
  --border: rgba(0,0,0,0.08);
  --primary: #6366F1;
  --primary-end: #8B5CF6;
  --success: #059669;
  --error: #DC2626;
  --warning: #D97706;
  --text: #0F172A;
  --text-sub: #475569;
  --text-muted: #94A3B8;
  --font-mono: 'JetBrains Mono', monospace;
}

.dark {
  --bg: #0A0A0F;
  --surface: #12121A;
  --glass: rgba(255,255,255,0.05);
  --border: rgba(255,255,255,0.08);
  --primary: #6366F1;
  --primary-end: #8B5CF6;
  --success: #10B981;
  --error: #EF4444;
  --warning: #F59E0B;
  --text: #E2E8F0;
  --text-sub: #94A3B8;
  --text-muted: #64748B;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s, color 0.2s;
}
```

- [ ] **Step 7: Verify project runs**

```bash
npm run dev
```

Expected: Dev server starts on localhost:5173, shows default Vite React page.

- [ ] **Step 8: Commit**

```bash
git init
echo "node_modules/\ndist/\n.DS_Store" > .gitignore
git add -A
git commit -m "feat: initialize Vite + React + TypeScript project with dependencies"
```

---

### Task 2: Set up routing and layout shell

**Files:**
- Create: `src/App.tsx`, `src/layouts/MainLayout.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/ExplorePage.tsx`, `src/pages/MyReposPage.tsx`, `src/pages/QuizPage.tsx`, `src/pages/HistoryPage.tsx`, `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Create placeholder pages**

Create `src/pages/DashboardPage.tsx`:
```tsx
export default function DashboardPage() {
  return <div>Dashboard</div>
}
```

Create the same pattern for: `ExplorePage.tsx`, `MyReposPage.tsx`, `QuizPage.tsx`, `HistoryPage.tsx`, `SettingsPage.tsx`.

- [ ] **Step 2: Create MainLayout with sidebar navigation**

Create `src/layouts/MainLayout.tsx`:
```tsx
import { Outlet, NavLink } from 'react-router-dom'
import { Home, Search, FolderGit2, History, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/my-repos', icon: FolderGit2, label: 'My Repos' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <aside
        className="w-16 flex flex-col items-center py-6 gap-2 border-r"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                isActive ? 'text-white' : ''
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'linear-gradient(135deg, var(--primary), var(--primary-end))' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-sub)',
            })}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Set up HashRouter in App.tsx**

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import DashboardPage from '@/pages/DashboardPage'
import ExplorePage from '@/pages/ExplorePage'
import MyReposPage from '@/pages/MyReposPage'
import QuizPage from '@/pages/QuizPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/my-repos" element={<MyReposPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 4: Update main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Verify routing works**

```bash
npm run dev
```

Navigate to `/#/`, `/#/explore`, `/#/settings` — each shows placeholder text with sidebar navigation.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add hash router with layout shell and placeholder pages"
```

---

### Task 3: Create Zustand stores

**Files:**
- Create: `src/stores/useSettingsStore.ts`, `src/stores/useQuizStore.ts`, `src/stores/useHistoryStore.ts`, `src/stores/useGithubStore.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Define TypeScript types**

Create `src/types/index.ts`:
```typescript
// Quiz Types
export type QuizType = 'explain' | 'fill-blank' | 'code' | 'bug-hunt' | 'code-review' | 'output-prediction'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface QuizBase {
  id: string
  type: QuizType
  question: string
  code: string
  language: string
  difficulty: Difficulty
  hints: {
    variables: Record<string, string>
    functions: Record<string, string>
  }
  hintLevels: {
    level2: string
    level3: string
  }
  explanation: string
  sourceRepo: string
  sourceFile: string
}

export interface ExplainQuiz extends QuizBase {
  type: 'explain'
  answer: { referenceAnswer: string; keyPoints: string[] }
}

export interface FillBlankQuiz extends QuizBase {
  type: 'fill-blank'
  answer: { blanks: string[]; blankPositions: number[] }
}

export interface CodeQuiz extends QuizBase {
  type: 'code'
  answer: { referenceSolution: string; requirements: string[] }
}

export interface BugHuntQuiz extends QuizBase {
  type: 'bug-hunt'
  answer: { correctCode: string; bugs: Array<{ line: number; description: string }> }
}

export interface CodeReviewQuiz extends QuizBase {
  type: 'code-review'
  answer: { improvements: Array<{ category: string; description: string; severity: 'low' | 'medium' | 'high' }> }
}

export interface OutputPredictionQuiz extends QuizBase {
  type: 'output-prediction'
  answer: { expectedOutput: string; acceptableVariations: string[] }
}

export type Quiz = ExplainQuiz | FillBlankQuiz | CodeQuiz | BugHuntQuiz | CodeReviewQuiz | OutputPredictionQuiz

// Grading
export interface GradingResult {
  score: number
  feedback: string
  details: Array<{ point: string; correct: boolean; comment: string }>
  correctAnswer: string
}

// History
export interface QuizHistory {
  id: string
  date: string
  type: QuizType
  language: string
  difficulty: Difficulty
  score: number
  rawScore: number
  hintsUsed: number
  sourceRepo: string
  sourceFile: string
  timeSpent: number
}

export interface Stats {
  totalSolved: number
  byLanguage: Record<string, number>
  byType: Record<QuizType, number>
  averageScore: number
  currentStreak: number
  bestStreak: number
}

// AI API Config
export interface AIPreset {
  name: string
  url: string
  method: string
  headers: Record<string, string>
  apiKey: string
  bodyTemplate: string
  responsePath: string
}

// GitHub
export interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
  updated_at: string
}

export interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  size?: number
}
```

- [ ] **Step 2: Create useSettingsStore**

Create `src/stores/useSettingsStore.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIPreset } from '@/types'

const defaultPresets: Record<string, AIPreset> = {
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: { 'Authorization': 'Bearer {{KEY}}', 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: '{"model":"gpt-4o","messages":{{MESSAGES}}}',
    responsePath: 'choices[0].message.content',
  },
  claude: {
    name: 'Claude (proxy required)',
    url: 'https://api.anthropic.com/v1/messages',
    method: 'POST',
    headers: { 'x-api-key': '{{KEY}}', 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: '{"model":"claude-sonnet-4-20250514","max_tokens":4096,"messages":{{MESSAGES}}}',
    responsePath: 'content[0].text',
  },
  gemini: {
    name: 'Gemini (proxy required)',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={{KEY}}',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: '{"contents":{{MESSAGES}}}',
    responsePath: 'candidates[0].content.parts[0].text',
  },
  ollama: {
    name: 'Ollama (local)',
    url: 'http://localhost:11434/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: '{"model":"llama3","messages":{{MESSAGES}}}',
    responsePath: 'message.content',
  },
}

interface SettingsState {
  theme: 'dark' | 'light'
  languageFilter: string[]
  githubPat: string
  activePresetKey: string
  presets: Record<string, AIPreset>
  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setLanguageFilter: (langs: string[]) => void
  setGithubPat: (pat: string) => void
  setActivePreset: (key: string) => void
  updatePreset: (key: string, preset: AIPreset) => void
  addPreset: (key: string, preset: AIPreset) => void
  deletePreset: (key: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      languageFilter: ['python', 'javascript', 'typescript'],
      githubPat: '',
      activePresetKey: 'openai',
      presets: defaultPresets,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setLanguageFilter: (languageFilter) => set({ languageFilter }),
      setGithubPat: (githubPat) => set({ githubPat }),
      setActivePreset: (activePresetKey) => set({ activePresetKey }),
      updatePreset: (key, preset) => set((s) => ({ presets: { ...s.presets, [key]: preset } })),
      addPreset: (key, preset) => set((s) => ({ presets: { ...s.presets, [key]: preset } })),
      deletePreset: (key) => set((s) => {
        const { [key]: _, ...rest } = s.presets
        return { presets: rest }
      }),
    }),
    { name: 'codetraining-settings', version: 1 }
  )
)
```

- [ ] **Step 3: Create useQuizStore**

Create `src/stores/useQuizStore.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Quiz, GradingResult } from '@/types'

interface QuizState {
  currentQuiz: Quiz | null
  userAnswer: string
  gradingResult: GradingResult | null
  hintsUsed: number
  isGenerating: boolean
  isGrading: boolean
  startTime: number | null
  setCurrentQuiz: (quiz: Quiz) => void
  setUserAnswer: (answer: string) => void
  setGradingResult: (result: GradingResult) => void
  useHint: () => void
  setIsGenerating: (v: boolean) => void
  setIsGrading: (v: boolean) => void
  startTimer: () => void
  getElapsed: () => number
  reset: () => void
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      currentQuiz: null,
      userAnswer: '',
      gradingResult: null,
      hintsUsed: 0,
      isGenerating: false,
      isGrading: false,
      startTime: null,
      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz, userAnswer: '', gradingResult: null, hintsUsed: 0, startTime: Date.now() }),
      setUserAnswer: (userAnswer) => set({ userAnswer }),
      setGradingResult: (gradingResult) => set({ gradingResult }),
      useHint: () => set((s) => ({ hintsUsed: Math.min(s.hintsUsed + 1, 2) })),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsGrading: (isGrading) => set({ isGrading }),
      startTimer: () => set({ startTime: Date.now() }),
      getElapsed: () => {
        const start = get().startTime
        return start ? Math.floor((Date.now() - start) / 1000) : 0
      },
      reset: () => set({ currentQuiz: null, userAnswer: '', gradingResult: null, hintsUsed: 0, isGenerating: false, isGrading: false, startTime: null }),
    }),
    { name: 'codetraining-quiz', version: 1 }
  )
)
```

- [ ] **Step 4: Create useHistoryStore**

Create `src/stores/useHistoryStore.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuizHistory, Stats, QuizType } from '@/types'

interface HistoryState {
  quizzes: QuizHistory[]
  stats: Stats
  addQuiz: (quiz: QuizHistory) => void
  getStats: () => Stats
}

function calcStats(quizzes: QuizHistory[]): Stats {
  const byLanguage: Record<string, number> = {}
  const byType: Record<string, number> = {}
  let totalScore = 0

  for (const q of quizzes) {
    byLanguage[q.language] = (byLanguage[q.language] || 0) + 1
    byType[q.type] = (byType[q.type] || 0) + 1
    totalScore += q.score
  }

  // streak calculation
  const dates = [...new Set(quizzes.map((q) => q.date.slice(0, 10)))].sort().reverse()
  let currentStreak = 0
  const today = new Date().toISOString().slice(0, 10)
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    if (dates[i] === expected) currentStreak++
    else break
  }

  return {
    totalSolved: quizzes.length,
    byLanguage,
    byType: byType as Record<QuizType, number>,
    averageScore: quizzes.length > 0 ? Math.round(totalScore / quizzes.length) : 0,
    currentStreak,
    bestStreak: currentStreak, // simplified — track best separately if needed
  }
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      stats: { totalSolved: 0, byLanguage: {}, byType: {} as Record<QuizType, number>, averageScore: 0, currentStreak: 0, bestStreak: 0 },
      addQuiz: (quiz) => set((s) => {
        const quizzes = [quiz, ...s.quizzes]
        return { quizzes, stats: calcStats(quizzes) }
      }),
      getStats: () => calcStats(get().quizzes),
    }),
    { name: 'codetraining-history', version: 1 }
  )
)
```

- [ ] **Step 5: Create useGithubStore**

Create `src/stores/useGithubStore.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GitHubRepo } from '@/types'

interface GithubState {
  trendingRepos: GitHubRepo[]
  trendingLastFetched: number | null
  myRepos: GitHubRepo[]
  myReposLastFetched: number | null
  rateLimitRemaining: number | null
  rateLimitReset: number | null
  setTrending: (repos: GitHubRepo[]) => void
  setMyRepos: (repos: GitHubRepo[]) => void
  setRateLimit: (remaining: number, reset: number) => void
  isTrendingStale: () => boolean
  isMyReposStale: () => boolean
}

const TRENDING_TTL = 6 * 60 * 60 * 1000 // 6 hours
const MY_REPOS_TTL = 30 * 60 * 1000     // 30 minutes

export const useGithubStore = create<GithubState>()(
  persist(
    (set, get) => ({
      trendingRepos: [],
      trendingLastFetched: null,
      myRepos: [],
      myReposLastFetched: null,
      rateLimitRemaining: null,
      rateLimitReset: null,
      setTrending: (repos) => set({ trendingRepos: repos, trendingLastFetched: Date.now() }),
      setMyRepos: (repos) => set({ myRepos: repos, myReposLastFetched: Date.now() }),
      setRateLimit: (remaining, reset) => set({ rateLimitRemaining: remaining, rateLimitReset: reset }),
      isTrendingStale: () => {
        const t = get().trendingLastFetched
        return !t || Date.now() - t > TRENDING_TTL
      },
      isMyReposStale: () => {
        const t = get().myReposLastFetched
        return !t || Date.now() - t > MY_REPOS_TTL
      },
    }),
    { name: 'codetraining-github', version: 1 }
  )
)
```

- [ ] **Step 6: Verify stores compile**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/types/ src/stores/
git commit -m "feat: add TypeScript types and Zustand stores with persist"
```

---

### Task 4: Theme system integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/layouts/MainLayout.tsx`

- [ ] **Step 1: Apply theme class to document**

Modify `src/App.tsx` — add theme effect:
```tsx
import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import DashboardPage from '@/pages/DashboardPage'
import ExplorePage from '@/pages/ExplorePage'
import MyReposPage from '@/pages/MyReposPage'
import QuizPage from '@/pages/QuizPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/my-repos" element={<MyReposPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 2: Add theme toggle to sidebar**

Add to `MainLayout.tsx` — a theme toggle button at the bottom of the sidebar:
```tsx
import { Sun, Moon } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'

// Inside the aside, after navItems map, add:
<div className="mt-auto">
  <button
    onClick={() => useSettingsStore.getState().toggleTheme()}
    className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
    style={{ color: 'var(--text-sub)' }}
    title="Toggle theme"
  >
    {useSettingsStore((s) => s.theme) === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
  </button>
</div>
```

- [ ] **Step 3: Verify theme toggle works**

```bash
npm run dev
```

Click the sun/moon icon — background and text colors should switch between dark and light.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: add dark/light theme toggle with CSS variables"
```

---

### Task 5: Shared UI components

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/ErrorCard.tsx`

- [ ] **Step 1: Create Button component**

Create `src/components/ui/Button.tsx`:
```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'border',
  ghost: 'hover:opacity-80',
  danger: 'text-white',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, style, ...props }, ref) => {
    const bgStyle = variant === 'primary'
      ? { background: 'linear-gradient(135deg, var(--primary), var(--primary-end))' }
      : variant === 'danger'
      ? { background: 'var(--error)' }
      : variant === 'secondary'
      ? { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }
      : { color: 'var(--text-sub)' }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all
          ${variantStyles[variant]} ${sizeStyles[size]}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}
        style={{ ...bgStyle, ...style }}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Create Card component**

Create `src/components/ui/Card.tsx`:
```tsx
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, children, className = '', style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl backdrop-blur-xl ${hover ? 'transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer' : ''} ${className}`}
        style={{
          backgroundColor: 'var(--glass)',
          border: '1px solid var(--border)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
```

- [ ] **Step 3: Create Input component**

Create `src/components/ui/Input.tsx`:
```tsx
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium" style={{ color: 'var(--text-sub)' }}>{label}</label>}
        <input
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary)] ${className}`}
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            ...style,
          }}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'
```

- [ ] **Step 4: Create Badge, Skeleton, ErrorCard**

Create `src/components/ui/Badge.tsx`:
```tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning'
  active?: boolean
  onClick?: () => void
}

const colorMap = {
  default: 'var(--text-sub)',
  success: 'var(--success)',
  error: 'var(--error)',
  warning: 'var(--warning)',
}

export function Badge({ children, variant = 'default', active, onClick }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      style={{
        backgroundColor: active ? colorMap[variant] : 'var(--glass)',
        color: active ? '#fff' : colorMap[variant],
        border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
      }}
    >
      {children}
    </span>
  )
}
```

Create `src/components/ui/Skeleton.tsx`:
```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--glass)' }}
    />
  )
}
```

Create `src/components/ui/ErrorCard.tsx`:
```tsx
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'

interface ErrorCardProps {
  message: string
  detail?: string
  onRetry?: () => void
}

export function ErrorCard({ message, detail, onRetry }: ErrorCardProps) {
  return (
    <Card className="p-6 flex flex-col items-center gap-3 text-center">
      <AlertTriangle size={32} style={{ color: 'var(--error)' }} />
      <p className="font-medium" style={{ color: 'var(--text)' }}>{message}</p>
      {detail && <p className="text-sm" style={{ color: 'var(--text-sub)' }}>{detail}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry
        </Button>
      )}
    </Card>
  )
}
```

- [ ] **Step 5: Create barrel export**

Create `src/components/ui/index.ts`:
```typescript
export { Button } from './Button'
export { Card } from './Card'
export { Input } from './Input'
export { Badge } from './Badge'
export { Skeleton } from './Skeleton'
export { ErrorCard } from './ErrorCard'
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI components (Button, Card, Input, Badge, Skeleton, ErrorCard)"
```
