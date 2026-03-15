import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useQuizStore } from '@/stores/useQuizStore'
import { generateQuiz } from '@/services/quiz-generator'
import type { QuizType, Difficulty } from '@/types'

const QUIZ_TYPES: Array<{ type: QuizType; name: string; description: string }> = [
  { type: 'explain', name: 'Explain Code', description: 'Explain what the code does' },
  { type: 'fill-blank', name: 'Fill Blanks', description: 'Fill in missing code parts' },
  { type: 'code', name: 'Write Code', description: 'Write code to solve a problem' },
  { type: 'bug-hunt', name: 'Bug Hunt', description: 'Find and fix bugs in code' },
  { type: 'code-review', name: 'Code Review', description: 'Review and improve code' },
  { type: 'output-prediction', name: 'Predict Output', description: 'Predict what code outputs' },
]

const DIFFICULTIES: Array<{ value: Difficulty; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

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
              Generate Quiz
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
              Quiz Type
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
              Difficulty
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
            {lineCount} lines of {language} from {sourceFile}
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
            Generate Quiz
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
