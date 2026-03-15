import Editor from '@monaco-editor/react'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface CodeBlockProps {
  code: string
  language?: string
  maxHeight?: number
}

export default function CodeBlock({ code, language = 'javascript', maxHeight = 350 }: CodeBlockProps) {
  const theme = useSettingsStore((s) => s.theme)
  const lineCount = code.split('\n').length

  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      <Editor
        height={Math.min(lineCount * 20 + 20, maxHeight)}
        language={language}
        value={code}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'JetBrains Mono, monospace',
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          scrollbar: {
            horizontal: 'auto',
            vertical: 'auto',
          },
          wordWrap: 'off',
          domReadOnly: true,
        }}
      />
    </div>
  )
}
