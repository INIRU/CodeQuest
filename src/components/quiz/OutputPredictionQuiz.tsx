import type { OutputPredictionQuiz } from '@/types'

interface OutputPredictionQuizProps {
  quiz: OutputPredictionQuiz
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export default function OutputPredictionQuizView({
  quiz,
  value,
  onChange,
  disabled,
}: OutputPredictionQuizProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 15, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
        {quiz.question}
      </p>

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
        <code>{quiz.code}</code>
      </pre>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={6}
        placeholder="Predict the output..."
        style={{
          padding: '12px 14px',
          fontSize: 14,
          borderRadius: 10,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'monospace',
          lineHeight: 1.6,
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  )
}
