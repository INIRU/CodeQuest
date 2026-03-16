import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Trash2, GraduationCap } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useTranslation } from '@/i18n'
import type { LearningPlan, LearningStep, HomeworkQuiz } from '@/services/learning'
import { generateHomeworkQuiz } from '@/services/learning'
import { useSettingsStore } from '@/stores/useSettingsStore'
import StepCard from './StepCard'

interface LearningPlanViewProps {
  plan: LearningPlan
  onCompleteStep: (stepId: string) => void
  onDelete: () => void
}

export default function LearningPlanView({
  plan,
  onCompleteStep,
  onDelete,
}: LearningPlanViewProps) {
  const { t, language } = useTranslation()
  const uiLang = useSettingsStore((s) => s.language)
  const [quizStep, setQuizStep] = useState<LearningStep | null>(null)
  const [quizzes, setQuizzes] = useState<HomeworkQuiz[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({})

  const completedCount = plan.steps.filter((s) => s.completed).length
  const totalSteps = plan.steps.length
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  const handleStartHomework = async (step: LearningStep) => {
    setQuizStep(step)
    setQuizzes([])
    setQuizError(null)
    setUserAnswers({})
    setShowAnswers({})
    setQuizLoading(true)
    try {
      const result = await generateHomeworkQuiz(step, uiLang)
      setQuizzes(result)
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : String(err))
    } finally {
      setQuizLoading(false)
    }
  }

  const handleDeleteConfirm = () => {
    if (window.confirm(t('learn.deletePlan'))) {
      onDelete()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Plan Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <GraduationCap size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {plan.title}
              </h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
              {plan.description}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDeleteConfirm}>
            <Trash2 size={16} />
          </Button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 500 }}>
              {t('learn.stepProgress', { completed: completedCount, total: totalSteps })}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              backgroundColor: 'var(--border)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-end))',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            onComplete={() => onCompleteStep(step.id)}
            onStartHomework={() => handleStartHomework(step)}
          />
        ))}
      </div>

      {/* Homework Quiz Modal / Section */}
      {quizStep && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card style={{ border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BookOpen size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {t('learn.homework')} - {quizStep.title}
              </h3>
            </div>

            {quizLoading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                {t('common.loading')}
              </div>
            )}

            {quizError && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: 'var(--error)',
                  fontSize: 14,
                }}
              >
                {quizError}
              </div>
            )}

            {quizzes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {quizzes.map((quiz, qi) => (
                  <div
                    key={qi}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text)',
                        marginBottom: 12,
                      }}
                    >
                      {qi + 1}. {quiz.question}
                    </div>

                    {quiz.type === 'multiple-choice' && quiz.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {quiz.options.map((option, oi) => (
                          <label
                            key={oi}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 14,
                              color: 'var(--text)',
                              backgroundColor:
                                userAnswers[qi] === option ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              border: `1px solid ${userAnswers[qi] === option ? 'var(--primary)' : 'var(--border)'}`,
                              transition: 'all 0.15s',
                            }}
                          >
                            <input
                              type="radio"
                              name={`quiz-${qi}`}
                              value={option}
                              checked={userAnswers[qi] === option}
                              onChange={() =>
                                setUserAnswers((prev) => ({ ...prev, [qi]: option }))
                              }
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}

                    {(quiz.type === 'short-answer' || quiz.type === 'code') && (
                      <textarea
                        value={userAnswers[qi] || ''}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({ ...prev, [qi]: e.target.value }))
                        }
                        rows={quiz.type === 'code' ? 4 : 2}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: 14,
                          fontFamily: quiz.type === 'code' ? 'monospace' : 'inherit',
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

                    <div style={{ marginTop: 10 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowAnswers((prev) => ({ ...prev, [qi]: !prev[qi] }))
                        }
                      >
                        {showAnswers[qi] ? t('quiz.viewCorrectAnswer') : t('quiz.viewCorrectAnswer')}
                      </Button>

                      {showAnswers[qi] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                          style={{
                            marginTop: 8,
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: 'rgba(5, 150, 105, 0.08)',
                            border: '1px solid rgba(5, 150, 105, 0.2)',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>
                            {language === 'ko' ? '정답' : 'Answer'}
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>
                            {quiz.answer}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
                            {quiz.explanation}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setQuizStep(null)}>
                {t('common.back')}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
