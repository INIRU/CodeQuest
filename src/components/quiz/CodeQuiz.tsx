import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTranslation } from '@/i18n'
import type { CodeQuiz } from '@/types'

interface CodeQuizProps {
  quiz: CodeQuiz
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export default function CodeQuizView({
  quiz,
  value,
  onChange,
  disabled,
}: CodeQuizProps) {
  const theme = useSettingsStore((s) => s.theme)
  const { t } = useTranslation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 15, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
        {quiz.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          {t('quiz.requirements')}
        </span>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {quiz.answer.requirements.map((req, i) => (
            <li
              key={i}
              style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}
            >
              {req}
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <Editor
          height={300}
          language={quiz.language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            readOnly: disabled,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  )
}
