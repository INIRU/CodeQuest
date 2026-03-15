import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button, Card, Input, Select } from '@/components/ui'
import { useQuizStore } from '@/stores/useQuizStore'
import { generateQuickQuiz, generateQuickMultipleQuizzes } from '@/services/quick-quiz'
import { useTranslation } from '@/i18n'
import type { QuizType, Difficulty } from '@/types'

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
]

const QUESTION_COUNTS = [1, 3, 5] as const

function useQuizTypes() {
  const { t } = useTranslation()
  return [
    { type: 'explain' as QuizType, label: t('quiz.explain') },
    { type: 'fill-blank' as QuizType, label: t('quiz.fillBlank') },
    { type: 'code' as QuizType, label: t('quiz.code') },
    { type: 'bug-hunt' as QuizType, label: t('quiz.bugHunt') },
    { type: 'code-review' as QuizType, label: t('quiz.codeReview') },
    { type: 'output-prediction' as QuizType, label: t('quiz.output') },
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

export default function QuickQuizCard() {
  const navigate = useNavigate()
  const setCurrentQuiz = useQuizStore((s) => s.setCurrentQuiz)
  const setQuizSeries = useQuizStore((s) => s.setQuizSeries)
  const { t } = useTranslation()
  const QUIZ_TYPES = useQuizTypes()
  const DIFFICULTIES = useDifficulties()

  const [language, setLanguage] = useState('python')
  const [topic, setTopic] = useState('')
  const [quizType, setQuizType] = useState<QuizType>('explain')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [questionCount, setQuestionCount] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const trimmedTopic = topic.trim() || undefined
      if (questionCount > 1) {
        const quizzes = await generateQuickMultipleQuizzes(
          language,
          quizType,
          difficulty,
          questionCount,
          trimmedTopic,
        )
        setQuizSeries(quizzes)
        navigate(`/quiz/${quizzes[0].id}`)
      } else {
        const quiz = await generateQuickQuiz(language, quizType, difficulty, trimmedTopic)
        setCurrentQuiz(quiz)
        navigate(`/quiz/${quiz.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.06), rgba(249, 115, 22, 0.04))',
        border: '1px solid rgba(234, 179, 8, 0.2)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.15))',
            color: 'rgb(234, 179, 8)',
          }}
        >
          <Sparkles size={18} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            {t('dashboard.quickQuiz')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
            {t('dashboard.quickQuizDesc')}
          </div>
        </div>
      </div>

      {/* Language + Topic row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Select
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_OPTIONS}
          label={t('dashboard.selectLanguage')}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
            {t('dashboard.topic')}
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('dashboard.topicPlaceholder')}
            style={{ height: 42 }}
          />
        </div>
      </div>

      {/* Quiz Type */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 6, display: 'block' }}>
          {t('quizModal.quizType')}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUIZ_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setQuizType(type)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: `1.5px solid ${quizType === type ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: quizType === type ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: quizType === type ? 'var(--primary)' : 'var(--text)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty + Question Count row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 6, display: 'block' }}>
            {t('quizModal.difficulty')}
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DIFFICULTIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1.5px solid ${difficulty === value ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: difficulty === value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: difficulty === value ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 6, display: 'block' }}>
            {t('quiz.questionCount')}
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1.5px solid ${questionCount === count ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: questionCount === count ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: questionCount === count ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: 'var(--error)', margin: '0 0 12px 0' }}>{error}</p>
      )}

      {/* Generate button */}
      <Button
        variant="primary"
        loading={loading}
        onClick={handleGenerate}
        style={{ width: '100%' }}
      >
        <Sparkles size={15} style={{ marginRight: 6 }} />
        {t('dashboard.generateQuiz')}
      </Button>
    </Card>
  )
}
