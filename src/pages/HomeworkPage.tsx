import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, CheckCircle, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useTranslation } from '@/i18n'
import { useLearningStore } from '@/stores/useLearningStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { generateHomeworkQuiz } from '@/services/learning'
import type { HomeworkQuiz } from '@/services/learning'
import CodeBlock from '@/components/quiz/CodeBlock'

export default function HomeworkPage() {
  const { stepId } = useParams<{ stepId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const uiLang = useSettingsStore((s) => s.language)

  const { plans, activePlanId, completeStep } = useLearningStore()
  const activePlan = plans.find((p) => p.id === activePlanId) ?? null
  const step = activePlan?.steps.find((s) => s.id === stepId) ?? null

  const [quizzes, setQuizzes] = useState<HomeworkQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!step) return
    let cancelled = false

    const fetchQuizzes = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await generateHomeworkQuiz(step, uiLang)
        if (!cancelled) {
          setQuizzes(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchQuizzes()
    return () => {
      cancelled = true
    }
  }, [step, uiLang])

  const handleCompleteAndReturn = () => {
    if (activePlan && stepId) {
      completeStep(activePlan.id, stepId)
    }
    navigate('/learn')
  }

  if (!activePlan || !step) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/learn')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
        <Card style={{ marginTop: 20, textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            {t('common.error')}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/learn')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <BookOpen size={24} style={{ color: 'var(--primary)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          {t('learn.homeworkFor', { step: step.title })}
        </h1>
      </div>

      {/* Loading State */}
      {loading && (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', marginBottom: 16 }}
          >
            <Loader2 size={32} style={{ color: 'var(--primary)' }} />
          </motion.div>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
            {t('learn.generating')}
          </p>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card
          style={{
            padding: 20,
            backgroundColor: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--error)' }}>{error}</div>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/learn')}>
              {t('common.back')}
            </Button>
          </div>
        </Card>
      )}

      {/* Quiz Questions */}
      {!loading && quizzes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {quizzes.map((quiz, qi) => (
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.08, duration: 0.3 }}
            >
              <Card>
                {/* Question */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  {qi + 1}. {quiz.question}
                </div>

                {/* Multiple Choice */}
                {quiz.type === 'multiple-choice' && quiz.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quiz.options.map((option, oi) => {
                      const isSelected = userAnswers[qi] === option
                      return (
                        <button
                          key={oi}
                          onClick={() =>
                            setUserAnswers((prev) => ({ ...prev, [qi]: option }))
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontSize: 14,
                            color: 'var(--text)',
                            backgroundColor: isSelected
                              ? 'rgba(99, 102, 241, 0.1)'
                              : 'var(--surface)',
                            border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            width: '100%',
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                              flexShrink: 0,
                              transition: 'all 0.15s',
                            }}
                          >
                            {isSelected && (
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background:
                                    'linear-gradient(135deg, var(--primary), var(--primary-end))',
                                }}
                              />
                            )}
                          </span>
                          {option}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {quiz.type === 'short-answer' && (
                  <textarea
                    value={userAnswers[qi] || ''}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({ ...prev, [qi]: e.target.value }))
                    }
                    placeholder={t('learn.yourAnswer')}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--glass)',
                      color: 'var(--text)',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                )}

                {/* Code */}
                {quiz.type === 'code' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <CodeBlock
                      code={userAnswers[qi] || '// ' + t('learn.yourAnswer')}
                      language="javascript"
                      maxHeight={200}
                    />
                    <textarea
                      value={userAnswers[qi] || ''}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({ ...prev, [qi]: e.target.value }))
                      }
                      placeholder={t('learn.yourAnswer')}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, monospace',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--glass)',
                        color: 'var(--text)',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Show/Hide Answer */}
                <div style={{ marginTop: 14 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowAnswers((prev) => ({ ...prev, [qi]: !prev[qi] }))
                    }
                  >
                    {showAnswers[qi] ? t('learn.hideAnswer') : t('learn.showAnswer')}
                  </Button>

                  {showAnswers[qi] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      style={{
                        marginTop: 10,
                        padding: 14,
                        borderRadius: 10,
                        backgroundColor: 'rgba(5, 150, 105, 0.08)',
                        border: '1px solid rgba(5, 150, 105, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--success)',
                          marginBottom: 6,
                        }}
                      >
                        {t('learn.showAnswer')}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: 'var(--text)',
                          marginBottom: 8,
                          lineHeight: 1.6,
                        }}
                      >
                        {quiz.answer}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-sub)',
                          lineHeight: 1.6,
                        }}
                      >
                        {quiz.explanation}
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Complete & Return Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: quizzes.length * 0.08 + 0.1, duration: 0.3 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 8,
              paddingBottom: 32,
            }}
          >
            <Button variant="primary" onClick={handleCompleteAndReturn}>
              <CheckCircle size={18} />
              {t('learn.completeAndReturn')}
            </Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
