import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { GradingResult as GradingResultType } from '@/types'

interface GradingResultProps {
  result: GradingResultType
  rawScore: number
  hintsUsed: number
  finalScore: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--error)'
}

function getAwardText(score: number): string {
  if (score >= 80) return 'Excellent!'
  if (score >= 50) return 'Good effort'
  return 'Keep practicing'
}

export default function GradingResultView({
  result,
  rawScore,
  hintsUsed,
  finalScore,
}: GradingResultProps) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Score */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: getScoreColor(finalScore),
              lineHeight: 1,
            }}
          >
            {finalScore}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 8,
              color: getScoreColor(finalScore),
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <Award size={20} />
            {getAwardText(finalScore)}
          </div>
        </div>

        {/* Raw score + penalty info */}
        {hintsUsed > 0 && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--text-sub)',
            }}
          >
            Raw score: {rawScore} | Hints used: {hintsUsed} | Penalty:{' '}
            {hintsUsed === 1 ? '-20%' : '-50%'}
          </div>
        )}

        {/* Feedback */}
        <p
          style={{
            fontSize: 14,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {result.feedback}
        </p>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.details.map((detail, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: 10,
                borderRadius: 8,
                backgroundColor: 'var(--surface)',
              }}
            >
              {detail.correct ? (
                <CheckCircle
                  size={16}
                  style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}
                />
              ) : (
                <XCircle
                  size={16}
                  style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  {detail.point}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-sub)',
                    marginTop: 2,
                  }}
                >
                  {detail.comment}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Collapsible correct answer */}
        <div>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {showAnswer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            View correct answer
          </button>
          {showAnswer && (
            <pre
              style={{
                margin: 0,
                padding: 16,
                borderRadius: 10,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text)',
                fontFamily: 'monospace',
              }}
            >
              <code>{result.correctAnswer}</code>
            </pre>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
