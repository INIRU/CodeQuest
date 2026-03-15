import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { BugHuntQuiz } from '@/types'

interface BugHuntQuizProps {
  quiz: BugHuntQuiz
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export default function BugHuntQuizView({
  quiz,
  value,
  onChange,
  disabled,
}: BugHuntQuizProps) {
  const theme = useSettingsStore((s) => s.theme)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 15, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
        {quiz.question}
      </p>

      <div
        style={{
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <Editor
          height={350}
          language={quiz.language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={value || quiz.code}
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
