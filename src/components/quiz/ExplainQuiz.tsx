import { useTranslation } from '@/i18n'
import type { ExplainQuiz } from '@/types'

interface ExplainQuizProps {
  quiz: ExplainQuiz
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export default function ExplainQuizView({
  quiz,
  value,
  onChange,
  disabled,
}: ExplainQuizProps) {
  const { t } = useTranslation()

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
        rows={8}
        placeholder={t('quiz.explainPlaceholder')}
        style={{
          padding: '12px 14px',
          fontSize: 14,
          borderRadius: 10,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.6,
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  )
}
