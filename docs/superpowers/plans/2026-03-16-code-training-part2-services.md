# CodeTraining Platform — Part 2: Services & Settings

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build AI API service, GitHub API service, quiz generator service, and the Settings page UI.

**Architecture:** All API calls are client-side. AI connector is universal (user-configured URL/headers/body). GitHub uses REST API with PAT from localStorage.

**Tech Stack:** Vite, React, TypeScript, Zustand, Monaco Editor, Radix UI

**Spec:** `docs/superpowers/specs/2026-03-16-code-training-platform-design.md`

---

## Chunk 2: Services

### Task 6: AI API service

**Files:**
- Create: `src/services/ai.ts`
- Create: `src/services/__tests__/ai.test.ts`

- [ ] **Step 1: Write test for AI service**

Create `src/services/__tests__/ai.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildRequest, parseResponse, extractByPath } from '../ai'

describe('extractByPath', () => {
  it('extracts nested value', () => {
    const obj = { choices: [{ message: { content: 'hello' } }] }
    expect(extractByPath(obj, 'choices[0].message.content')).toBe('hello')
  })

  it('returns undefined for invalid path', () => {
    expect(extractByPath({}, 'a.b.c')).toBeUndefined()
  })
})

describe('buildRequest', () => {
  it('replaces {{KEY}} in headers', () => {
    const req = buildRequest({
      url: 'https://api.example.com',
      method: 'POST',
      headers: { 'Authorization': 'Bearer {{KEY}}' },
      apiKey: 'test-key',
      bodyTemplate: '{"messages":{{MESSAGES}}}',
      responsePath: 'result',
    }, [{ role: 'user', content: 'hi' }])

    expect(req.headers['Authorization']).toBe('Bearer test-key')
  })

  it('replaces {{MESSAGES}} with JSON array', () => {
    const req = buildRequest({
      url: 'https://api.example.com',
      method: 'POST',
      headers: {},
      apiKey: '',
      bodyTemplate: '{"messages":{{MESSAGES}}}',
      responsePath: 'result',
    }, [{ role: 'user', content: 'hi' }])

    const body = JSON.parse(req.body)
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }])
  })

  it('replaces {{PROMPT}} with concatenated string', () => {
    const req = buildRequest({
      url: 'https://api.example.com',
      method: 'POST',
      headers: {},
      apiKey: '',
      bodyTemplate: '{"prompt":{{PROMPT}}}',
      responsePath: 'result',
    }, [{ role: 'system', content: 'sys' }, { role: 'user', content: 'usr' }])

    const body = JSON.parse(req.body)
    expect(body.prompt).toBe('sys\n\nusr')
  })

  it('replaces {{KEY}} in URL', () => {
    const req = buildRequest({
      url: 'https://api.example.com?key={{KEY}}',
      method: 'POST',
      headers: {},
      apiKey: 'my-key',
      bodyTemplate: '{"messages":{{MESSAGES}}}',
      responsePath: 'result',
    }, [])

    expect(req.url).toBe('https://api.example.com?key=my-key')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/__tests__/ai.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement AI service**

Create `src/services/ai.ts`:
```typescript
import type { AIPreset } from '@/types'

interface Message {
  role: string
  content: string
}

interface BuiltRequest {
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

export function extractByPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function buildRequest(
  preset: Omit<AIPreset, 'name'>,
  messages: Message[]
): BuiltRequest {
  const { url, method, headers, apiKey, bodyTemplate } = preset

  // Replace {{KEY}} in URL
  const finalUrl = url.replace(/\{\{KEY\}\}/g, apiKey)

  // Replace {{KEY}} in headers
  const finalHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    finalHeaders[k] = v.replace(/\{\{KEY\}\}/g, apiKey)
  }

  // Replace {{MESSAGES}} and {{PROMPT}} in body via JSON-aware substitution
  const messagesJson = JSON.stringify(messages)
  const promptText = messages.map((m) => m.content).join('\n\n')

  // Parse template, replace placeholders
  let bodyStr = bodyTemplate
  // Replace {{MESSAGES}} — it should be a JSON value, not a string
  bodyStr = bodyStr.replace(/"?\{\{MESSAGES\}\}"?/g, messagesJson)
  // Replace {{PROMPT}} — should be a JSON string
  bodyStr = bodyStr.replace(/"?\{\{PROMPT\}\}"?/g, JSON.stringify(promptText))

  return {
    url: finalUrl,
    method,
    headers: finalHeaders,
    body: bodyStr,
  }
}

export async function callAI(
  preset: AIPreset,
  messages: Message[],
  timeout = 30000
): Promise<{ raw: unknown; text: string }> {
  const req = buildRequest(preset, messages)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    const raw = await response.json()
    const text = extractByPath(raw, preset.responsePath)

    if (typeof text !== 'string') {
      throw new Error(`Response path "${preset.responsePath}" did not resolve to a string. Got: ${typeof text}`)
    }

    return { raw, text }
  } finally {
    clearTimeout(timer)
  }
}

// Auto-detect response path from known patterns
const KNOWN_PATHS = [
  'choices[0].message.content',
  'content[0].text',
  'message.content',
  'candidates[0].content.parts[0].text',
  'response',
  'output',
  'result',
  'text',
]

export function autoDetectResponsePath(responseJson: unknown): string | null {
  for (const path of KNOWN_PATHS) {
    const val = extractByPath(responseJson, path)
    if (typeof val === 'string' && val.length > 0) return path
  }
  return null
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/services/__tests__/ai.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai.ts src/services/__tests__/
git commit -m "feat: add universal AI API service with request builder and response parser"
```

---

### Task 7: GitHub API service

**Files:**
- Create: `src/services/github.ts`

- [ ] **Step 1: Implement GitHub service**

Create `src/services/github.ts`:
```typescript
import { useGithubStore } from '@/stores/useGithubStore'
import type { GitHubRepo, GitHubTreeItem } from '@/types'

const BASE = 'https://api.github.com'

function authHeaders(pat?: string): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (pat) h['Authorization'] = `Bearer ${pat}`
  return h
}

function updateRateLimit(headers: Headers) {
  const remaining = headers.get('X-RateLimit-Remaining')
  const reset = headers.get('X-RateLimit-Reset')
  if (remaining && reset) {
    useGithubStore.getState().setRateLimit(Number(remaining), Number(reset))
  }
}

async function ghFetch<T>(path: string, pat?: string): Promise<T> {
  const { rateLimitRemaining } = useGithubStore.getState()
  if (rateLimitRemaining !== null && rateLimitRemaining <= 0) {
    const reset = useGithubStore.getState().rateLimitReset
    const resetDate = reset ? new Date(reset * 1000).toLocaleTimeString() : 'soon'
    throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}`)
  }

  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(pat) })
  updateRateLimit(res.headers)

  if (!res.ok) {
    if (res.status === 403) throw new Error('GitHub API rate limit or access denied')
    if (res.status === 401) throw new Error('GitHub token is invalid. Check your PAT in Settings.')
    throw new Error(`GitHub API error: ${res.status}`)
  }

  return res.json()
}

export async function fetchTrendingRepos(languages: string[], pat?: string): Promise<GitHubRepo[]> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const langQuery = languages.length > 0
    ? languages.map((l) => `language:${l}`).join('+')
    : ''
  const q = `stars:>100+created:>${weekAgo}${langQuery ? '+' + langQuery : ''}`
  const data = await ghFetch<{ items: GitHubRepo[] }>(
    `/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=20`,
    pat
  )
  return data.items
}

export async function fetchMyRepos(pat: string): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>('/user/repos?sort=updated&per_page=30', pat)
}

export async function fetchRepoTree(owner: string, repo: string, branch = 'main', pat?: string): Promise<GitHubTreeItem[]> {
  try {
    const data = await ghFetch<{ tree: GitHubTreeItem[] }>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      pat
    )
    return data.tree.filter((item) => item.type === 'blob')
  } catch {
    // fallback to master branch
    const data = await ghFetch<{ tree: GitHubTreeItem[] }>(
      `/repos/${owner}/${repo}/git/trees/master?recursive=1`,
      pat
    )
    return data.tree.filter((item) => item.type === 'blob')
  }
}

export async function fetchFileContent(owner: string, repo: string, path: string, pat?: string): Promise<string> {
  const data = await ghFetch<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/contents/${path}`,
    pat
  )
  if (data.encoding === 'base64') {
    return atob(data.content.replace(/\n/g, ''))
  }
  return data.content
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/services/github.ts
git commit -m "feat: add GitHub API service (trending, my repos, file tree, file content)"
```

---

### Task 8: Quiz generator service

**Files:**
- Create: `src/services/quiz-generator.ts`

- [ ] **Step 1: Implement quiz generator**

Create `src/services/quiz-generator.ts`:
```typescript
import { callAI } from './ai'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Quiz, QuizType, Difficulty, GradingResult } from '@/types'

const MAX_CODE_LINES = 500
const MAX_CODE_CHARS = 15000

function truncateCode(code: string): string {
  const lines = code.split('\n')
  if (lines.length > MAX_CODE_LINES) {
    return lines.slice(0, MAX_CODE_LINES).join('\n') + '\n// ... truncated'
  }
  if (code.length > MAX_CODE_CHARS) {
    return code.slice(0, MAX_CODE_CHARS) + '\n// ... truncated'
  }
  return code
}

function getActivePreset() {
  const { activePresetKey, presets } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) throw new Error('No AI preset configured. Go to Settings to set up your AI API.')
  if (!preset.url) throw new Error('AI API URL is not configured.')
  return preset
}

const SCHEMA_HINTS: Record<QuizType, string> = {
  'explain': `{ "type": "explain", "question": "...", "code": "...", "hints": { "variables": {}, "functions": {} }, "hintLevels": { "level2": "...", "level3": "..." }, "answer": { "referenceAnswer": "...", "keyPoints": ["..."] }, "explanation": "...", "difficulty": "..." }`,
  'fill-blank': `{ "type": "fill-blank", "question": "...", "code": "code with ___ blanks", "hints": { "variables": {}, "functions": {} }, "hintLevels": { "level2": "...", "level3": "..." }, "answer": { "blanks": ["answer1"], "blankPositions": [0] }, "explanation": "...", "difficulty": "..." }`,
  'code': `{ "type": "code", "question": "...", "code": "reference context", "hints": { "variables": {}, "functions": {} }, "hintLevels": { "level2": "...", "level3": "..." }, "answer": { "referenceSolution": "...", "requirements": ["..."] }, "explanation": "...", "difficulty": "..." }`,
  'bug-hunt': `{ "type": "bug-hunt", "question": "...", "code": "buggy code", "hints": { "variables": {}, "functions": {} }, "hintLevels": { "level2": "...", "level3": "..." }, "answer": { "correctCode": "...", "bugs": [{ "line": 1, "description": "..." }] }, "explanation": "...", "difficulty": "..." }`,
  'code-review': `{ "type": "code-review", "question": "...", "code": "...", "hints": { "variables": {}, "functions": {} }, "hintLevels": { "level2": "...", "level3": "..." }, "answer": { "improvements": [{ "category": "...", "description": "...", "severity": "low|medium|high" }] }, "explanation": "...", "difficulty": "..." }`,
  'output-prediction': `{ "type": "output-prediction", "question": "...", "code": "...", "hints": { "variables": {}, "functions": {} }, "hintLevels": { "level2": "...", "level3": "..." }, "answer": { "expectedOutput": "...", "acceptableVariations": [] }, "explanation": "...", "difficulty": "..." }`,
}

export async function generateQuiz(
  code: string,
  language: string,
  quizType: QuizType,
  difficulty: Difficulty,
  sourceRepo: string,
  sourceFile: string
): Promise<Quiz> {
  const preset = getActivePreset()
  const truncated = truncateCode(code)

  const messages = [
    {
      role: 'system',
      content: `You are a coding quiz generator. Generate a ${quizType} quiz from the given code.
Difficulty: ${difficulty}
Language: ${language}
Respond ONLY with valid JSON matching this schema:
${SCHEMA_HINTS[quizType]}
Include variable descriptions, function signatures in hints. Include level2 (logic hint) and level3 (near-answer hint) in hintLevels.`
    },
    {
      role: 'user',
      content: `Generate a quiz from this ${language} code:\n\`\`\`${language}\n${truncated}\n\`\`\``
    }
  ]

  const { text } = await callAI(preset, messages)

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
  const jsonStr = (jsonMatch[1] || text).trim()

  let parsed: Quiz
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse AI response as JSON. The AI may not have followed the expected format.')
  }

  // Attach metadata
  parsed.id = crypto.randomUUID()
  parsed.language = language
  parsed.sourceRepo = sourceRepo
  parsed.sourceFile = sourceFile

  return parsed
}

export async function gradeQuiz(quiz: Quiz, userAnswer: string): Promise<GradingResult> {
  const preset = getActivePreset()

  const messages = [
    {
      role: 'system',
      content: `You are a coding quiz grader. Evaluate the user's answer and respond ONLY with valid JSON:
{
  "score": 0-100,
  "feedback": "overall feedback",
  "details": [{ "point": "...", "correct": true/false, "comment": "..." }],
  "correctAnswer": "the correct answer revealed"
}
Evaluate purely on answer quality. Do not apply hint penalties (handled client-side).`
    },
    {
      role: 'user',
      content: `Quiz type: ${quiz.type}
Question: ${quiz.question}
Original code: ${quiz.code}
Reference answer: ${JSON.stringify(quiz.answer)}
User's answer: ${userAnswer}`
    }
  ]

  const { text } = await callAI(preset, messages)

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
  const jsonStr = (jsonMatch[1] || text).trim()

  try {
    return JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse grading response.')
  }
}

export function calculateFinalScore(rawScore: number, hintsUsed: number): number {
  const penalties = [1.0, 0.8, 0.5]
  const penalty = penalties[Math.min(hintsUsed, 2)]
  return Math.round(rawScore * penalty)
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/services/quiz-generator.ts
git commit -m "feat: add quiz generator and grading service with per-type schemas"
```

---

## Chunk 3: Settings Page

### Task 9: Settings page — AI API connector UI

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Create: `src/components/settings/AISettings.tsx`
- Create: `src/components/settings/GitHubSettings.tsx`
- Create: `src/components/settings/LanguageFilterSettings.tsx`
- Create: `src/components/settings/APITestPanel.tsx`

- [ ] **Step 1: Create AISettings component**

Create `src/components/settings/AISettings.tsx`:
```tsx
import { useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Button, Card, Input } from '@/components/ui'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import type { AIPreset } from '@/types'
import { APITestPanel } from './APITestPanel'

export function AISettings() {
  const { activePresetKey, presets, setActivePreset, updatePreset, addPreset, deletePreset } = useSettingsStore()
  const preset = presets[activePresetKey]
  const [showTest, setShowTest] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  if (!preset) return null

  const updateField = <K extends keyof AIPreset>(field: K, value: AIPreset[K]) => {
    updatePreset(activePresetKey, { ...preset, [field]: value })
  }

  const handleAddHeader = () => {
    updateField('headers', { ...preset.headers, '': '' })
  }

  const handleAddPreset = () => {
    if (!newPresetName.trim()) return
    const key = newPresetName.toLowerCase().replace(/\s+/g, '-')
    addPreset(key, {
      name: newPresetName,
      url: '',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      apiKey: '',
      bodyTemplate: '{"messages":{{MESSAGES}}}',
      responsePath: '',
    })
    setActivePreset(key)
    setNewPresetName('')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>AI API Settings</h2>

      <Card className="p-4 text-sm" style={{ color: 'var(--text-sub)', borderColor: 'var(--warning)', borderWidth: '1px' }}>
        Some AI APIs block browser requests (CORS). If you get errors, use a CORS proxy server.
      </Card>

      {/* Preset selector */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-sub)' }}>Preset</label>
          <select
            value={activePresetKey}
            onChange={(e) => setActivePreset(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {Object.entries(presets).map(([key, p]) => (
              <option key={key} value={key}>{p.name}</option>
            ))}
          </select>
        </div>
        {!['openai', 'claude', 'gemini', 'ollama'].includes(activePresetKey) && (
          <Button variant="danger" size="sm" onClick={() => {
            deletePreset(activePresetKey)
            setActivePreset('openai')
          }}>
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {/* Add custom preset */}
      <div className="flex gap-2">
        <Input
          placeholder="New preset name"
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
        />
        <Button variant="secondary" size="sm" onClick={handleAddPreset}>
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* URL */}
      <Input label="URL" value={preset.url} onChange={(e) => updateField('url', e.target.value)} />

      {/* API Key */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-sub)' }}>API Key</label>
        <input
          type="password"
          value={preset.apiKey}
          onChange={(e) => updateField('apiKey', e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          placeholder="Replaced into {{KEY}} in headers/URL"
        />
      </div>

      {/* Headers */}
      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-sub)' }}>Headers</label>
        {Object.entries(preset.headers).map(([key, value], i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={key}
              onChange={(e) => {
                const newHeaders = { ...preset.headers }
                delete newHeaders[key]
                newHeaders[e.target.value] = value
                updateField('headers', newHeaders)
              }}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              placeholder="Key"
            />
            <input
              value={value}
              onChange={(e) => updateField('headers', { ...preset.headers, [key]: e.target.value })}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              placeholder="Value"
            />
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={handleAddHeader}>
          <Plus size={14} /> Add Header
        </Button>
      </div>

      {/* Body Template */}
      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-sub)' }}>
          Body Template <span className="text-xs font-normal">(use {'{{MESSAGES}}'} or {'{{PROMPT}}'})</span>
        </label>
        <textarea
          value={preset.bodyTemplate}
          onChange={(e) => updateField('bodyTemplate', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Response Path */}
      <Input
        label="Response Path"
        value={preset.responsePath}
        onChange={(e) => updateField('responsePath', e.target.value)}
        placeholder="e.g. choices[0].message.content"
      />

      {/* Test */}
      <Button onClick={() => setShowTest(!showTest)} variant="secondary">
        <ChevronDown size={14} className={showTest ? 'rotate-180 transition-transform' : 'transition-transform'} />
        Test Connection
      </Button>

      {showTest && <APITestPanel />}
    </div>
  )
}
```

- [ ] **Step 2: Create APITestPanel**

Create `src/components/settings/APITestPanel.tsx`:
```tsx
import { useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { buildRequest, extractByPath, autoDetectResponsePath } from '@/services/ai'
import { Button, Card } from '@/components/ui'
import { Play, Zap } from 'lucide-react'

export function APITestPanel() {
  const { activePresetKey, presets } = useSettingsStore()
  const preset = presets[activePresetKey]
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    status: number
    time: number
    request: { url: string; headers: Record<string, string>; body: string }
    response: unknown
    detectedPath: string | null
    parsedText: string | null
    error?: string
  } | null>(null)

  if (!preset) return null

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    const messages = [{ role: 'user', content: "Hello, respond with 'OK'" }]
    const req = buildRequest(preset, messages)
    const start = performance.now()

    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      })
      const time = Math.round(performance.now() - start)
      const raw = await res.json()
      const detectedPath = autoDetectResponsePath(raw)
      const parsedText = preset.responsePath
        ? (extractByPath(raw, preset.responsePath) as string) ?? null
        : detectedPath
        ? (extractByPath(raw, detectedPath) as string) ?? null
        : null

      setResult({
        status: res.status,
        time,
        request: { url: req.url, headers: req.headers, body: req.body },
        response: raw,
        detectedPath,
        parsedText,
      })
    } catch (err) {
      const time = Math.round(performance.now() - start)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      const isCors = msg.includes('Failed to fetch') || msg.includes('NetworkError')
      setResult({
        status: 0,
        time,
        request: { url: req.url, headers: req.headers, body: req.body },
        response: null,
        detectedPath: null,
        parsedText: null,
        error: isCors
          ? 'CORS error: This API blocks browser requests. Use a CORS proxy server.'
          : msg,
      })
    } finally {
      setLoading(false)
    }
  }

  const applyDetectedPath = () => {
    if (result?.detectedPath) {
      useSettingsStore.getState().updatePreset(activePresetKey, {
        ...preset,
        responsePath: result.detectedPath,
      })
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <Button onClick={runTest} loading={loading} size="sm">
        <Play size={14} /> Run Test
      </Button>

      {result && (
        <>
          <div className="flex gap-4 text-sm">
            <span style={{ color: result.status >= 200 && result.status < 300 ? 'var(--success)' : 'var(--error)' }}>
              {result.status > 0 ? `${result.status} ${result.status < 300 ? 'OK' : 'Error'}` : 'Failed'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{result.time}ms</span>
          </div>

          {result.error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
              {result.error}
            </div>
          )}

          {/* Request */}
          <details>
            <summary className="text-sm cursor-pointer" style={{ color: 'var(--text-sub)' }}>Request</summary>
            <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto font-mono" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
              {JSON.stringify(result.request, null, 2)}
            </pre>
          </details>

          {/* Response */}
          {result.response && (
            <details open>
              <summary className="text-sm cursor-pointer" style={{ color: 'var(--text-sub)' }}>Response (raw JSON)</summary>
              <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto font-mono max-h-64" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </details>
          )}

          {/* Auto-detect path */}
          {result.detectedPath && !preset.responsePath && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--text-sub)' }}>
                Detected path: <code className="font-mono">{result.detectedPath}</code>
              </span>
              <Button variant="secondary" size="sm" onClick={applyDetectedPath}>
                <Zap size={14} /> Apply
              </Button>
            </div>
          )}

          {/* Parsed result */}
          {result.parsedText && (
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-sub)' }}>Parsed result:</p>
              <div className="p-3 rounded-lg text-sm font-mono" style={{ backgroundColor: 'var(--surface)', color: 'var(--success)' }}>
                {result.parsedText}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
```

- [ ] **Step 3: Create GitHubSettings**

Create `src/components/settings/GitHubSettings.tsx`:
```tsx
import { useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGithubStore } from '@/stores/useGithubStore'
import { Card, Input, Button } from '@/components/ui'
import { Eye, EyeOff, Shield } from 'lucide-react'

export function GitHubSettings() {
  const { githubPat, setGithubPat } = useSettingsStore()
  const { rateLimitRemaining, rateLimitReset } = useGithubStore()
  const [show, setShow] = useState(false)

  const resetTime = rateLimitReset ? new Date(rateLimitReset * 1000).toLocaleTimeString() : null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>GitHub Settings</h2>

      <Card className="p-4 text-sm flex items-start gap-3" style={{ color: 'var(--text-sub)' }}>
        <Shield size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p>Your token is stored only in this browser's localStorage. Avoid using on shared computers.</p>
          <p className="mt-1">Recommended: Create a Fine-grained token with read-only access to public repos only.</p>
        </div>
      </Card>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Personal Access Token"
            type={show ? 'text' : 'password'}
            value={githubPat}
            onChange={(e) => setGithubPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
          />
        </div>
        <button
          onClick={() => setShow(!show)}
          className="p-2 rounded-lg"
          style={{ color: 'var(--text-sub)' }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {rateLimitRemaining !== null && (
        <p className="text-sm" style={{ color: rateLimitRemaining > 10 ? 'var(--text-muted)' : 'var(--warning)' }}>
          API requests remaining: {rateLimitRemaining}
          {resetTime && ` (resets at ${resetTime})`}
        </p>
      )}

      {!githubPat && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Without a token: 60 requests/hour. With a token: 5,000 requests/hour.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create LanguageFilterSettings**

Create `src/components/settings/LanguageFilterSettings.tsx`:
```tsx
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Badge } from '@/components/ui'

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'go', 'rust',
  'c', 'cpp', 'csharp', 'ruby', 'swift', 'kotlin', 'php',
]

export function LanguageFilterSettings() {
  const { languageFilter, setLanguageFilter } = useSettingsStore()

  const toggle = (lang: string) => {
    if (languageFilter.includes(lang)) {
      setLanguageFilter(languageFilter.filter((l) => l !== lang))
    } else {
      setLanguageFilter([...languageFilter, lang])
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Language Filter</h2>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <Badge
            key={lang}
            variant="default"
            active={languageFilter.includes(lang)}
            onClick={() => toggle(lang)}
          >
            {lang}
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Assemble SettingsPage**

Update `src/pages/SettingsPage.tsx`:
```tsx
import { AISettings } from '@/components/settings/AISettings'
import { GitHubSettings } from '@/components/settings/GitHubSettings'
import { LanguageFilterSettings } from '@/components/settings/LanguageFilterSettings'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
      <AISettings />
      <hr style={{ borderColor: 'var(--border)' }} />
      <GitHubSettings />
      <hr style={{ borderColor: 'var(--border)' }} />
      <LanguageFilterSettings />
    </div>
  )
}
```

- [ ] **Step 6: Verify Settings page renders**

```bash
npm run dev
```

Navigate to `/#/settings`. All sections should render: AI API settings with presets, GitHub PAT input, language filter badges.

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/ src/pages/SettingsPage.tsx
git commit -m "feat: add Settings page with AI connector, GitHub PAT, and language filter"
```
