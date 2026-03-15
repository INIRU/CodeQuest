import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useQuizStore } from '@/stores/useQuizStore'
import { generateQuiz } from '@/services/quiz-generator'
import { useTranslation } from '@/i18n'
import type { QuizType, Difficulty } from '@/types'

function useQuizTypes() {
  const { t } = useTranslation()
  return [
    { type: 'explain' as QuizType, name: t('quiz.explain'), description: t('quiz.explainDesc') },
    { type: 'fill-blank' as QuizType, name: t('quiz.fillBlank'), description: t('quiz.fillBlankDesc') },
    { type: 'code' as QuizType, name: t('quiz.code'), description: t('quiz.codeDesc') },
    { type: 'bug-hunt' as QuizType, name: t('quiz.bugHunt'), description: t('quiz.bugHuntDesc') },
    { type: 'code-review' as QuizType, name: t('quiz.codeReview'), description: t('quiz.codeReviewDesc') },
    { type: 'output-prediction' as QuizType, name: t('quiz.output'), description: t('quiz.outputDesc') },
  ]
}

function useDifficulties() {
  const { t } = useTranslation()
  return [
    { value: 'beginner' as Difficulty, label: t('quiz.beginner') },
    { value: 'intermediate' as Difficulty, label: t('quiz.intermediate') },
    { value: 'advanced' as Difficulty, label: t('quiz.advanced') },
  ]
}

const MAX_COMBINED_LINES = 500
const MAX_COMBINED_CHARS = 15000


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

export interface MultiFileEntry {
  path: string
  content: string
}

interface QuizGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  language: string
  sourceRepo: string
  sourceFile: string
  /** When provided, generates from multiple files instead of single file */
  files?: MultiFileEntry[]
}

export default function QuizGenerateModal({
  open,
  onOpenChange,
  code,
  language,
  sourceRepo,
  sourceFile,
  files,
}: QuizGenerateModalProps) {
  const navigate = useNavigate()
  const setCurrentQuiz = useQuizStore((s) => s.setCurrentQuiz)
  const setIsGenerating = useQuizStore((s) => s.setIsGenerating)
  const { t } = useTranslation()
  const QUIZ_TYPES = useQuizTypes()
  const DIFFICULTIES = useDifficulties()

  const [selectedType, setSelectedType] = useState<QuizType>('explain')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('intermediate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMultiFile = files && files.length > 0

  // Combine multiple files into a single code string with headers
  const { combinedCode, primaryLanguage, totalLines } = useMemo(() => {
    if (!isMultiFile) {
      return {
        combinedCode: code,
        primaryLanguage: language,
        totalLines: code.split('\n').length,
      }
    }

    // Detect primary language from most common extension
    const langCounts = new Map<string, number>()
    for (const file of files) {
      const lang = detectLanguageFromPath(file.path)
      langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1)
    }
    let detectedLang = language
    let maxCount = 0
    for (const [lang, count] of langCounts) {
      if (count > maxCount) {
        maxCount = count
        detectedLang = lang
      }
    }

    // Combine with file path headers, respecting limits
    let combined = ''
    let lineCount = 0
    for (const file of files) {
      const header = `// --- ${file.path} ---\n`
      const content = file.content + '\n\n'
      const headerLines = 1
      const contentLines = file.content.split('\n').length + 1

      if (lineCount + headerLines + contentLines > MAX_COMBINED_LINES) {
        // Truncate this file's content to fit
        const remainingLines = MAX_COMBINED_LINES - lineCount - headerLines
        if (remainingLines > 5) {
          combined += header
          combined += file.content.split('\n').slice(0, remainingLines).join('\n') + '\n\n'
          lineCount += headerLines + remainingLines
        }
        break
      }

      combined += header + content
      lineCount += headerLines + contentLines

      if (combined.length > MAX_COMBINED_CHARS) {
        combined = combined.slice(0, MAX_COMBINED_CHARS)
        break
      }
    }

    return {
      combinedCode: combined,
      primaryLanguage: detectedLang,
      totalLines: lineCount,
    }
  }, [isMultiFile, files, code, language])

  const lineCount = isMultiFile ? totalLines : code.split('\n').length

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setIsGenerating(true)
    try {
      const resolvedSourceFile = isMultiFile
        ? files.map((f) => f.path).join(', ')
        : sourceFile

      {
        const quiz = await generateQuiz(
          combinedCode,
          primaryLanguage,
          selectedType,
          selectedDifficulty,
          sourceRepo,
          resolvedSourceFile,
        )
        setCurrentQuiz(quiz)
        onOpenChange(false)
        navigate(`/quiz/${quiz.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 28,
            width: '90vw',
            maxWidth: 480,
            maxHeight: '85vh',
            overflowY: 'auto',
            zIndex: 51,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Dialog.Title style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {t('quizModal.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Quiz Type Grid */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 8, display: 'block' }}>
              {t('quizModal.quizType')}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {QUIZ_TYPES.map(({ type, name, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: `2px solid ${selectedType === type ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: selectedType === type ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 8, display: 'block' }}>
              {t('quizModal.difficulty')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTIES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedDifficulty(value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: `2px solid ${selectedDifficulty === value ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor:
                      selectedDifficulty === value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>


          {/* Code info */}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {isMultiFile
              ? t('quizModal.multiFileInfo', {
                  count: files.length,
                  lines: lineCount,
                })
              : t('quizModal.linesOfCode', { lines: lineCount, language: primaryLanguage, file: sourceFile })}
          </p>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: 'var(--error)', margin: 0 }}>{error}</p>
          )}

          {/* Generate button */}
          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleGenerate}
            style={{ width: '100%' }}
          >
            {t('quizModal.generate')}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
