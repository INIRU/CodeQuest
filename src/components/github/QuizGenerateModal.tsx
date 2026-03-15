import { useState } from 'react'
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

interface QuizGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  language: string
  sourceRepo: string
  sourceFile: string
}

export default function QuizGenerateModal({
  open,
  onOpenChange,
  code,
  language,
  sourceRepo,
  sourceFile,
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

  const lineCount = code.split('\n').length

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setIsGenerating(true)
    try {
      const quiz = await generateQuiz(
        code,
        language,
        selectedType,
        selectedDifficulty,
        sourceRepo,
        sourceFile,
      )
      setCurrentQuiz(quiz)
      onOpenChange(false)
      navigate(`/quiz/${quiz.id}`)
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
            {t('quizModal.linesOfCode', { lines: lineCount, language, file: sourceFile })}
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
