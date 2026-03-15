import { type JSX, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileCode, BookOpen, Code, Bug, Search, Terminal } from 'lucide-react'
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

const quizTypeLabels: Record<QuizType, string> = {
  explain: 'Explain Code',
  'fill-blank': 'Fill in the Blanks',
  code: 'Write Code',
  'bug-hunt': 'Bug Hunt',
  'code-review': 'Code Review',
  'output-prediction': 'Predict Output',
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
            No quiz loaded
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0 }}>
            Explore trending repos and generate a quiz to get started.
          </p>
          <Button onClick={() => navigate('/explore')}>Explore</Button>
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
      style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}
    >
      <div style={{ display: 'flex', gap: 24 }}>
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
              Submit Answer
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
        </div>

        {/* Right panel */}
        <div style={{ width: 288, flexShrink: 0 }}>
          <HintPanel quiz={currentQuiz} />
        </div>
      </div>
    </motion.div>
  )
}
