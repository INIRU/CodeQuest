import { type JSX, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileCode, BookOpen, Code, Bug, Search, Terminal, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'
import HintPanel from '@/components/quiz/HintPanel'
import GradingResultView from '@/components/quiz/GradingResult'
import ExplainQuizView from '@/components/quiz/ExplainQuiz'
import FillBlankQuizView from '@/components/quiz/FillBlankQuiz'
import CodeQuizView from '@/components/quiz/CodeQuiz'
import BugHuntQuizView from '@/components/quiz/BugHuntQuiz'
import CodeReviewQuizView from '@/components/quiz/CodeReviewQuiz'
import OutputPredictionQuizView from '@/components/quiz/OutputPredictionQuiz'
import { useQuizStore } from '@/stores/useQuizStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { gradeQuiz, calculateFinalScore } from '@/services/quiz-generator'
import { useTranslation } from '@/i18n'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type {
  Quiz,
  ExplainQuiz,
  FillBlankQuiz,
  CodeQuiz,
  BugHuntQuiz,
  CodeReviewQuiz,
  OutputPredictionQuiz,
  QuizType,
} from '@/types'

function useQuizTypeLabels(): Record<QuizType, string> {
  const { t } = useTranslation()
  return {
    explain: t('quiz.explain'),
    'fill-blank': t('quiz.fillBlank'),
    code: t('quiz.code'),
    'bug-hunt': t('quiz.bugHunt'),
    'code-review': t('quiz.codeReview'),
    'output-prediction': t('quiz.output'),
  }
}

const quizTypeIcons: Record<QuizType, JSX.Element> = {
  explain: <BookOpen size={20} />,
  'fill-blank': <FileCode size={20} />,
  code: <Code size={20} />,
  'bug-hunt': <Bug size={20} />,
  'code-review': <Search size={20} />,
  'output-prediction': <Terminal size={20} />,
}

function renderQuizComponent(
  quiz: Quiz,
  value: string,
  onChange: (v: string) => void,
  disabled: boolean,
): JSX.Element {
  switch (quiz.type) {
    case 'explain':
      return (
        <ExplainQuizView
          quiz={quiz as ExplainQuiz}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'fill-blank':
      return (
        <FillBlankQuizView
          quiz={quiz as FillBlankQuiz}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'code':
      return (
        <CodeQuizView
          quiz={quiz as CodeQuiz}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'bug-hunt':
      return (
        <BugHuntQuizView
          quiz={quiz as BugHuntQuiz}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'code-review':
      return (
        <CodeReviewQuizView
          quiz={quiz as CodeReviewQuiz}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'output-prediction':
      return (
        <OutputPredictionQuizView
          quiz={quiz as OutputPredictionQuiz}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
  }
}

export default function QuizPage() {
  const navigate = useNavigate()
  const currentQuiz = useQuizStore((s) => s.currentQuiz)
  const userAnswer = useQuizStore((s) => s.userAnswer)
  const setUserAnswer = useQuizStore((s) => s.setUserAnswer)
  const gradingResult = useQuizStore((s) => s.gradingResult)
  const setGradingResult = useQuizStore((s) => s.setGradingResult)
  const hintsUsed = useQuizStore((s) => s.hintsUsed)
  const isGrading = useQuizStore((s) => s.isGrading)
  const setIsGrading = useQuizStore((s) => s.setIsGrading)
  const getElapsedTime = useQuizStore((s) => s.getElapsedTime)
  const addQuiz = useHistoryStore((s) => s.addQuiz)
  const { t } = useTranslation()
  const quizTypeLabels = useQuizTypeLabels()

  // Series state
  const quizSeries = useQuizStore((s) => s.quizSeries)
  const currentIndex = useQuizStore((s) => s.currentIndex)
  const seriesGradingResults = useQuizStore((s) => s.seriesGradingResults)
  const nextQuiz = useQuizStore((s) => s.nextQuiz)
  const prevQuiz = useQuizStore((s) => s.prevQuiz)
  const goToQuiz = useQuizStore((s) => s.goToQuiz)

  const isMobile = useMediaQuery('(max-width: 768px)')

  const isSeries = quizSeries.length > 1
  const isLastInSeries = isSeries && currentIndex === quizSeries.length - 1
  const isFirstInSeries = isSeries && currentIndex === 0

  // Check if all quizzes in the series have been graded
  const allSeriesGraded = useMemo(() => {
    if (!isSeries) return false
    return seriesGradingResults.every((r) => r !== null)
  }, [isSeries, seriesGradingResults])

  // Calculate average score for completed series
  const averageScore = useMemo(() => {
    if (!allSeriesGraded) return 0
    const scores = seriesGradingResults.map((r) => r?.score ?? 0)
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [allSeriesGraded, seriesGradingResults])

  const handleSubmit = useCallback(async () => {
    if (!currentQuiz || !userAnswer.trim() || isGrading) return

    setIsGrading(true)
    try {
      const result = await gradeQuiz(currentQuiz, userAnswer)
      setGradingResult(result)

      const finalScore = calculateFinalScore(result.score, hintsUsed)
      const elapsed = getElapsedTime()

      addQuiz({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: currentQuiz.type,
        language: currentQuiz.language,
        difficulty: currentQuiz.difficulty,
        score: finalScore,
        rawScore: result.score,
        hintsUsed,
        sourceRepo: currentQuiz.sourceRepo,
        sourceFile: currentQuiz.sourceFile,
        timeSpent: elapsed,
      })
    } catch {
      setGradingResult({
        score: 0,
        feedback: 'Failed to grade quiz. Please check your AI settings and try again.',
        details: [],
        correctAnswer: '',
      })
    } finally {
      setIsGrading(false)
    }
  }, [
    currentQuiz,
    userAnswer,
    isGrading,
    hintsUsed,
    setIsGrading,
    setGradingResult,
    getElapsedTime,
    addQuiz,
  ])

  if (!currentQuiz) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 32,
        }}
      >
        <Card
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            maxWidth: 400,
          }}
        >
          <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            {t('quiz.noQuiz')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0 }}>
            {t('dashboard.noQuizzesDesc')}
          </p>
          <Button onClick={() => navigate('/explore')}>{t('quiz.exploreBtn')}</Button>
        </Card>
      </motion.div>
    )
  }

  const finalScore = gradingResult
    ? calculateFinalScore(gradingResult.score, hintsUsed)
    : 0
  const isSubmitted = gradingResult !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: isMobile ? 16 : 32, maxWidth: 1200, margin: '0 auto' }}
    >
      {/* Series progress indicator */}
      {isSeries && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Progress text */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-sub)',
            }}
          >
            {t('quiz.questionProgress', {
              current: currentIndex + 1,
              total: quizSeries.length,
            })}
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {quizSeries.map((_, idx) => {
              const isCompleted = seriesGradingResults[idx] !== null
              const isCurrent = idx === currentIndex
              return (
                <button
                  key={idx}
                  onClick={() => goToQuiz(idx)}
                  style={{
                    width: isCurrent ? 28 : 12,
                    height: 12,
                    borderRadius: 6,
                    border: '2px solid var(--primary)',
                    backgroundColor: isCompleted
                      ? 'var(--primary)'
                      : isCurrent
                        ? 'rgba(99, 102, 241, 0.3)'
                        : 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s',
                  }}
                  aria-label={`Question ${idx + 1}`}
                />
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24 }}>
        {/* Left panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--primary)',
              }}
            >
              {quizTypeIcons[currentQuiz.type]}
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                {quizTypeLabels[currentQuiz.type]}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge>{currentQuiz.language}</Badge>
              <Badge>{currentQuiz.difficulty}</Badge>
              <Badge
                style={{
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentQuiz.sourceFile}
              </Badge>
            </div>
          </div>

          {/* Quiz component */}
          <Card>
            {renderQuizComponent(
              currentQuiz,
              userAnswer,
              setUserAnswer,
              isSubmitted,
            )}
          </Card>

          {/* Submit button */}
          {!isSubmitted && (
            <Button
              onClick={handleSubmit}
              loading={isGrading}
              disabled={!userAnswer.trim()}
              size="lg"
              style={{ alignSelf: 'flex-start' }}
            >
              {t('quiz.submit')}
            </Button>
          )}

          {/* Grading result */}
          {gradingResult && (
            <GradingResultView
              result={gradingResult}
              rawScore={gradingResult.score}
              hintsUsed={hintsUsed}
              finalScore={finalScore}
            />
          )}

          {/* Series navigation buttons */}
          {isSeries && isSubmitted && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginTop: 8,
              }}
            >
              {!isFirstInSeries && (
                <Button
                  variant="secondary"
                  onClick={prevQuiz}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ChevronLeft size={16} />
                  {t('quiz.prevQuestion')}
                </Button>
              )}
              {!isLastInSeries && (
                <Button
                  variant="primary"
                  onClick={nextQuiz}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {t('quiz.nextQuestion')}
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          )}

          {/* Series complete summary */}
          {isSeries && allSeriesGraded && isLastInSeries && (
            <Card
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: 28,
                border: '2px solid var(--primary)',
                background: 'rgba(99, 102, 241, 0.05)',
              }}
            >
              <Trophy size={40} style={{ color: 'var(--primary)' }} />
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                {t('quiz.seriesComplete')}
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: 'var(--text-sub)',
                  }}
                >
                  {t('quiz.averageScore')}
                </span>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color:
                      averageScore >= 80
                        ? 'var(--success, #22c55e)'
                        : averageScore >= 50
                          ? 'var(--warning, #eab308)'
                          : 'var(--error, #ef4444)',
                  }}
                >
                  {averageScore}
                </span>
              </div>

              {/* Individual scores */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {seriesGradingResults.map((result, idx) => {
                  const score = result?.score ?? 0
                  return (
                    <button
                      key={idx}
                      onClick={() => goToQuiz(idx)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${idx === currentIndex ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor:
                          idx === currentIndex
                            ? 'rgba(99, 102, 241, 0.1)'
                            : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        Q{idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color:
                            score >= 80
                              ? 'var(--success, #22c55e)'
                              : score >= 50
                                ? 'var(--warning, #eab308)'
                                : 'var(--error, #ef4444)',
                        }}
                      >
                        {score}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button onClick={() => navigate('/explore')}>
                  {t('quiz.exploreBtn')}
                </Button>
                {currentQuiz.sourceRepo === 'Learning Mode' && (
                  <Button variant="secondary" onClick={() => navigate('/learn')}>
                    {t('quiz.backToLearning')}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Back to Learning button (non-series, after grading) */}
          {!isSeries && isSubmitted && currentQuiz.sourceRepo === 'Learning Mode' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <Button variant="secondary" onClick={() => navigate('/learn')}>
                {t('quiz.backToLearning')}
              </Button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={isMobile ? { width: '100%' } : { width: 288, flexShrink: 0 }}>
          <HintPanel quiz={currentQuiz} />
        </div>
      </div>
    </motion.div>
  )
}
