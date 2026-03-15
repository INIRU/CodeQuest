import { useState, useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type * as monacoNs from 'monaco-editor'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'

const MAX_DISPLAY_LINES = 1000
const TRUNCATE_TO = 500

interface CodeViewerProps {
  code: string
  filePath: string
  onGenerateFromSelection: (code: string) => void
  onGenerateFromFile: (code: string) => void
}

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cs: 'csharp',
    php: 'php',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    html: 'html',
    css: 'css',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    xml: 'xml',
    toml: 'toml',
  }
  return langMap[ext] ?? 'plaintext'
}

export default function CodeViewer({
  code,
  filePath,
  onGenerateFromSelection,
  onGenerateFromFile,
}: CodeViewerProps) {
  const theme = useSettingsStore((s) => s.theme)
  const editorRef = useRef<monacoNs.editor.IStandaloneCodeEditor | null>(null)
  const [selectedText, setSelectedText] = useState('')

  const lineCount = code.split('\n').length
  const isTruncated = lineCount > MAX_DISPLAY_LINES
  const displayCode = isTruncated
    ? code.split('\n').slice(0, TRUNCATE_TO).join('\n')
    : code

  const language = detectLanguage(filePath)

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        const model = editor.getModel()
        if (model) {
          setSelectedText(model.getValueInRange(selection))
        }
      } else {
        setSelectedText('')
      }
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Truncation warning */}
      {isTruncated && (
        <Card
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
          }}
        >
          <AlertTriangle size={16} color="var(--warning)" />
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>
            File has {lineCount.toLocaleString()} lines. Showing first {TRUNCATE_TO} lines.
          </span>
        </Card>
      )}

      {/* Monaco Editor */}
      <div
        style={{
          flex: 1,
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        <Editor
          height="100%"
          language={language}
          value={displayCode}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            wordWrap: 'on',
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0 0 0',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {isTruncated ? `${TRUNCATE_TO}` : lineCount} lines
          {selectedText && ` | ${selectedText.split('\n').length} lines selected`}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedText ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGenerateFromSelection(selectedText)}
            >
              <Sparkles size={14} />
              Generate from selection
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGenerateFromFile(displayCode)}
            >
              <Sparkles size={14} />
              Generate from entire file
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
