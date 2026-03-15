import { Input } from '@/components/ui'
import { useTranslation } from '@/i18n'
import CodeBlock from './CodeBlock'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '100%', overflow: 'hidden' }}>
      <p style={{ fontSize: 15, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
        {quiz.question}
      </p>

      <CodeBlock code={quiz.code} language={quiz.language} />

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
