import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Loader2,
  Code,
  FileCode,
  Bug,
  Search,
  Terminal,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useTranslation } from '@/i18n'
import { generateHomeworkFromStep } from '@/services/quick-quiz'
import { useQuizStore } from '@/stores/useQuizStore'
import type { LearningStep } from '@/services/learning'
import type { QuizType } from '@/types'

const QUIZ_TYPES: { type: QuizType; icon: typeof Code; labelKey: string }[] = [
  { type: 'code', icon: Code, labelKey: 'quiz.code' },
  { type: 'explain', icon: BookOpen, labelKey: 'quiz.explain' },
  { type: 'fill-blank', icon: FileCode, labelKey: 'quiz.fillBlank' },
  { type: 'bug-hunt', icon: Bug, labelKey: 'quiz.bugHunt' },
  { type: 'code-review', icon: Search, labelKey: 'quiz.codeReview' },
  { type: 'output-prediction', icon: Terminal, labelKey: 'quiz.output' },
]

const COUNT_OPTIONS = [1, 3, 5]

interface StepCardProps {
  step: LearningStep
  index: number
  onComplete: () => void
}

export default function StepCard({ step, index, onComplete }: StepCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState<QuizType>('code')
  const [selectedCount, setSelectedCount] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleStartHomework = async () => {
    setGenerating(true)
    setError(null)
    try {
      const quizzes = await generateHomeworkFromStep(
        step,
        selectedType,
        'intermediate',
        selectedCount,
      )
      if (quizzes.length > 1) {
        useQuizStore.getState().setQuizSeries(quizzes)
      } else {
        useQuizStore.getState().setCurrentQuiz(quizzes[0])
      }
      navigate(`/quiz/${quizzes[0].id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        backgroundColor: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${step.completed ? 'var(--success)' : 'var(--border)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
            background: step.completed
              ? 'var(--success)'
              : 'linear-gradient(135deg, var(--primary), var(--primary-end))',
            color: '#FFFFFF',
          }}
        >
          {step.completed ? (
            <CheckCircle size={16} />
          ) : (
            index + 1
          )}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {step.title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {step.description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <Clock size={14} />
          {t('learn.estimatedTime', { minutes: step.estimatedMinutes })}
        </div>

        {expanded ? (
          <ChevronUp size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    marginBottom: 8,
                  }}
                >
                  {t('learn.topics')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {step.topics.map((topic, i) => (
                    <Badge key={i}>{topic}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    marginBottom: 8,
                  }}
                >
                  <BookOpen size={14} />
                  {t('learn.homework')}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--text)',
                    lineHeight: 1.6,
                    backgroundColor: 'var(--surface)',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  {step.homework}
                </div>
              </div>

              {step.glossary && step.glossary.length > 0 && (
                <div>
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 14,
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-sub)',
                    }}
                  >
                    <BookOpen size={14} />
                    {t('learn.glossary')}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {step.glossary.map((item, gi) => (
                      <div key={gi}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--primary)',
                          }}
                        >
                          {item.term}
                        </span>
                        <span style={{ color: 'var(--text-sub)' }}>
                          {' '}- {item.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Type Selector */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    marginBottom: 8,
                  }}
                >
                  {t('learn.quizType')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {QUIZ_TYPES.map(({ type, icon: Icon, labelKey }) => {
                    const isActive = selectedType === type
                    return (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedType(type)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: 'inherit',
                          borderRadius: 6,
                          border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--text-sub)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Icon size={12} />
                        {t(labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question Count Selector */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    marginBottom: 8,
                  }}
                >
                  {t('quiz.questionCount')}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {COUNT_OPTIONS.map((count) => {
                    const isActive = selectedCount === count
                    return (
                      <button
                        key={count}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCount(count)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 28,
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          borderRadius: 6,
                          border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--text-sub)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {count}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--error)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(220, 38, 38, 0.06)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={generating}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartHomework()
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      {t('learn.generating')}
                    </>
                  ) : (
                    t('learn.startHomework')
                  )}
                </Button>
                {!step.completed && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onComplete()
                    }}
                  >
                    <Circle size={14} />
                    {t('learn.markComplete')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}
