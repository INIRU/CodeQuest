import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Sparkles,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import { Button, Card } from '@/components/ui'
import CodeBlock from '@/components/quiz/CodeBlock'
import { useTranslation } from '@/i18n'
import { useLearningStore } from '@/stores/useLearningStore'
import { useQuizStore } from '@/stores/useQuizStore'
import { generateLesson } from '@/services/learning'
import { generateHomeworkFromStep } from '@/services/quick-quiz'
import type { Lesson } from '@/services/learning'

export default function LessonPage() {
  const { stepId } = useParams<{ stepId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { plans, activePlanId, completeStep } = useLearningStore()
  const activePlan = plans.find((p) => p.id === activePlanId) ?? null
  const step = activePlan?.steps.find((s) => s.id === stepId) ?? null

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)
  const [generatingPractice, setGeneratingPractice] = useState(false)

  useEffect(() => {
    if (!step) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await generateLesson(step)
        if (!cancelled) {
          setLesson(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [step?.id])

  const totalSlides = lesson?.slides.length ?? 0

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setDirection(1)
      setCurrentSlide((prev) => prev + 1)
    }
  }, [currentSlide, totalSlides])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide((prev) => prev - 1)
    }
  }, [currentSlide])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  // Mark as read when reaching last slide
  useEffect(() => {
    if (lesson && currentSlide === totalSlides - 1 && activePlan && step && !step.completed) {
      completeStep(activePlan.id, step.id)
    }
  }, [currentSlide, totalSlides, lesson])

  const handleStartPractice = async () => {
    if (!step) return
    setGeneratingPractice(true)
    try {
      const quizzes = await generateHomeworkFromStep(step, 'code', 'intermediate', 3)
      if (quizzes.length > 1) {
        useQuizStore.getState().setQuizSeries(quizzes)
      } else {
        useQuizStore.getState().setCurrentQuiz(quizzes[0])
      }
      navigate(`/quiz/${quizzes[0].id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setGeneratingPractice(false)
    }
  }

  if (!activePlan || !step) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('quiz.noQuiz')}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/learn')}>
          <ChevronLeft size={14} />
          {t('quiz.backToLearning')}
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            gap: 16,
          }}
        >
          <Loader2 size={32} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 15, color: 'var(--text-sub)', margin: 0 }}>
            {t('learn.generatingLesson')}
          </p>
        </Card>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Card
          style={{
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              color: 'var(--error)',
              fontSize: 14,
              width: '100%',
            }}
          >
            {error}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/learn')}>
              <ChevronLeft size={14} />
              {t('quiz.backToLearning')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!lesson || lesson.slides.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t('common.error')}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/learn')}>
          <ChevronLeft size={14} />
          {t('quiz.backToLearning')}
        </Button>
      </div>
    )
  }

  const slide = lesson.slides[currentSlide]
  const isLastSlide = currentSlide === totalSlides - 1

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <Button variant="ghost" size="sm" onClick={() => navigate('/learn')}>
          <ChevronLeft size={16} />
          {t('quiz.backToLearning')}
        </Button>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          {t('learn.pageProgress', { current: currentSlide + 1, total: totalSlides })}
        </span>
      </div>

      {/* Progress Dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
        }}
      >
        {lesson.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentSlide ? 1 : -1)
              setCurrentSlide(i)
            }}
            style={{
              width: i === currentSlide ? 24 : 10,
              height: 10,
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              background:
                i === currentSlide
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-end))'
                  : i < currentSlide
                    ? 'var(--primary)'
                    : 'var(--border)',
              opacity: i < currentSlide ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      {/* Slide Content */}
      <div style={{ position: 'relative', minHeight: 400, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {/* Slide Title */}
              <div
                style={{
                  padding: '24px 28px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-end))',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={18} color="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {slide.title}
                </h2>
              </div>

              {/* Explanation */}
              <div
                style={{
                  padding: '20px 28px',
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {slide.explanation}
              </div>

              {/* Code Example */}
              {slide.codeExample && (
                <div style={{ padding: '0 28px 20px' }}>
                  <CodeBlock
                    code={slide.codeExample}
                    language={slide.codeLanguage || 'javascript'}
                  />
                </div>
              )}

              {/* Key Points */}
              {slide.keyPoints.length > 0 && (
                <div
                  style={{
                    padding: '0 28px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-sub)',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} />
                    {t('learn.keyPoints')}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      backgroundColor: 'var(--surface)',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}
                  >
                    {slide.keyPoints.map((point, pi) => (
                      <div
                        key={pi}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: 'var(--text)',
                        }}
                      >
                        <CheckCircle
                          size={16}
                          style={{
                            color: 'var(--success)',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Glossary */}
              {slide.glossary && slide.glossary.length > 0 && (
                <div
                  style={{
                    padding: '0 28px 24px',
                  }}
                >
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 16,
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
                    {slide.glossary.map((item, gi) => (
                      <div key={gi}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
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
            </Card>

            {/* Practice transition on last slide */}
            {isLastSlide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Card
                  style={{
                    marginTop: 16,
                    padding: '24px 28px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  <GraduationCap
                    size={32}
                    style={{ color: 'var(--primary)', marginBottom: 12 }}
                  />
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--text-sub)',
                      margin: '0 0 8px',
                      fontWeight: 600,
                    }}
                  >
                    {t('learn.readComplete')}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--text-muted)',
                      margin: '0 0 20px',
                      lineHeight: 1.6,
                    }}
                  >
                    {t('learn.practiceIntro')}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={generatingPractice}
                    onClick={handleStartPractice}
                  >
                    {generatingPractice ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        {t('learn.generatingLesson')}
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        {t('learn.startPractice')}
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          padding: '0 4px',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={goPrev}
          disabled={currentSlide === 0}
          style={{ opacity: currentSlide === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
          {t('learn.previous')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={goNext}
          disabled={isLastSlide}
          style={{ opacity: isLastSlide ? 0.4 : 1 }}
        >
          {t('learn.next')}
          <ChevronRight size={16} />
        </Button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
