import { Lightbulb, Lock, Unlock } from 'lucide-react'
import { Card } from '@/components/ui'
import { useQuizStore } from '@/stores/useQuizStore'
import type { Quiz } from '@/types'

interface HintPanelProps {
  quiz: Quiz
}

export default function HintPanel({ quiz }: HintPanelProps) {
  const hintsUsed = useQuizStore((s) => s.hintsUsed)
  const useHint = useQuizStore((s) => s.useHint)

  const variables = quiz.hints.variables
  const functions = quiz.hints.functions
  const hasVariables = Object.keys(variables).length > 0
  const hasFunctions = Object.keys(functions).length > 0

  const penaltyText =
    hintsUsed === 0
      ? 'No penalty'
      : hintsUsed === 1
        ? '-20% penalty'
        : '-50% penalty'

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lightbulb size={18} style={{ color: 'var(--warning)' }} />
        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
          Hints
        </span>
      </div>

      {/* Level 1: Variables & Functions (always visible) */}
      {(hasVariables || hasFunctions) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-sub)' }}>
            References
          </span>
          {Object.entries(variables).map(([name, desc]) => (
            <div key={name} style={{ fontSize: 13, color: 'var(--text-sub)' }}>
              <code
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--primary)',
                  backgroundColor: 'var(--surface)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {name}
              </code>{' '}
              {desc}
            </div>
          ))}
          {Object.entries(functions).map(([name, desc]) => (
            <div key={name} style={{ fontSize: 13, color: 'var(--text-sub)' }}>
              <code
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--primary)',
                  backgroundColor: 'var(--surface)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {name}
              </code>{' '}
              {desc}
            </div>
          ))}
        </div>
      )}

      {/* Level 2 hint */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hintsUsed >= 1 ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--warning)',
              }}
            >
              <Unlock size={14} />
              Logic Hint
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0 }}>
              {quiz.hintLevels.level2}
            </p>
          </div>
        ) : (
          <button
            onClick={useHint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            <Lock size={14} />
            Logic Hint (-20%)
          </button>
        )}
      </div>

      {/* Level 3 hint (only show after level 2 used) */}
      {hintsUsed >= 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hintsUsed >= 2 ? (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--error)',
                }}
              >
                <Unlock size={14} />
                Strong Hint
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0 }}>
                {quiz.hintLevels.level3}
              </p>
            </div>
          ) : (
            <button
              onClick={useHint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
            >
              <Lock size={14} />
              Strong Hint (-50%)
            </button>
          )}
        </div>
      )}

      {/* Current penalty */}
      <div
        style={{
          fontSize: 12,
          color: hintsUsed === 0 ? 'var(--success)' : 'var(--warning)',
          fontWeight: 500,
          paddingTop: 8,
          borderTop: '1px solid var(--border)',
        }}
      >
        {penaltyText}
      </div>
    </Card>
  )
}
