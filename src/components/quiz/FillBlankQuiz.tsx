import { Input } from '@/components/ui'
import { useTranslation } from '@/i18n'
import type { FillBlankQuiz } from '@/types'

interface FillBlankQuizProps {
  quiz: FillBlankQuiz
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export default function FillBlankQuizView({
  quiz,
  value,
  onChange,
  disabled,
}: FillBlankQuizProps) {
  const { t } = useTranslation()
  const blanks = value ? value.split('|||') : quiz.answer.blanks.map(() => '')

  function handleBlankChange(index: number, newValue: string) {
    const updated = [...blanks]
    updated[index] = newValue
    onChange(updated.join('|||'))
  }

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {blanks.map((blankValue, i) => (
          <Input
            key={i}
            label={`Blank ${i + 1}`}
            value={blankValue}
            onChange={(e) => handleBlankChange(i, e.target.value)}
            disabled={disabled}
            placeholder={t('quiz.fillBlankPlaceholder')}
            style={{ fontFamily: 'monospace' }}
          />
        ))}
      </div>
    </div>
  )
}
