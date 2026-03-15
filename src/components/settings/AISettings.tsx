import { useState } from 'react'
import {
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import APITestPanel from './APITestPanel'

const DEFAULT_PRESET_KEYS = ['openai', 'claude', 'gemini', 'ollama']

export default function AISettings() {
  const activePresetKey = useSettingsStore((s) => s.activePresetKey)
  const presets = useSettingsStore((s) => s.presets)
  const setActivePresetKey = useSettingsStore((s) => s.setActivePresetKey)
  const updatePreset = useSettingsStore((s) => s.updatePreset)
  const addPreset = useSettingsStore((s) => s.addPreset)
  const deletePreset = useSettingsStore((s) => s.deletePreset)

  const [newPresetName, setNewPresetName] = useState('')
  const [testOpen, setTestOpen] = useState(false)

  const preset = presets[activePresetKey]
  const headers = preset?.headers ?? {}
  const isDefault = DEFAULT_PRESET_KEYS.includes(activePresetKey)

  function handleAddPreset() {
    const trimmed = newPresetName.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase().replace(/\s+/g, '-')
    if (presets[key]) return
    addPreset(key, {
      name: trimmed,
      url: '',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      apiKey: '',
      bodyTemplate: '{\n  "messages": "{{MESSAGES}}",\n  "prompt": "{{PROMPT}}"\n}',
      responsePath: '',
    })
    setNewPresetName('')
  }

  function handleDeletePreset() {
    if (isDefault) return
    deletePreset(activePresetKey)
  }

  function handleHeaderChange(
    oldKey: string,
    field: 'key' | 'value',
    newValue: string,
  ) {
    const entries = Object.entries(headers)
    const newHeaders: Record<string, string> = {}
    for (const [k, v] of entries) {
      if (k === oldKey) {
        if (field === 'key') {
          newHeaders[newValue] = v
        } else {
          newHeaders[k] = newValue
        }
      } else {
        newHeaders[k] = v
      }
    }
    updatePreset(activePresetKey, { headers: newHeaders })
  }

  function handleAddHeader() {
    const newHeaders = { ...headers, '': '' }
    updatePreset(activePresetKey, { headers: newHeaders })
  }

  function handleRemoveHeader(key: string) {
    const { [key]: _, ...rest } = headers
    updatePreset(activePresetKey, { headers: rest })
  }

  if (!preset) return null

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
        AI API Connection
      </h2>

      {/* CORS Warning */}
      <Card style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16 }}>
        <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--warning)' }}>CORS Warning:</strong> Browser-based API
          calls may be blocked by CORS policies. If you encounter errors, consider using a
          CORS proxy or a local API endpoint (e.g., Ollama).
        </div>
      </Card>

      {/* Preset Selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label
            htmlFor="preset-select"
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}
          >
            Preset
          </label>
          <select
            id="preset-select"
            value={activePresetKey}
            onChange={(e) => setActivePresetKey(e.target.value)}
            style={{
              padding: '10px 14px',
              fontSize: 14,
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {Object.entries(presets).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {!isDefault && (
          <Button variant="danger" size="sm" onClick={handleDeletePreset}>
            <Trash2 size={14} />
            Delete
          </Button>
        )}
      </div>

      {/* Add Custom Preset */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Add Custom Preset"
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPreset()}
          />
        </div>
        <Button variant="secondary" size="md" onClick={handleAddPreset}>
          <Plus size={14} />
          Add
        </Button>
      </div>

      {/* URL */}
      <Input
        label="API URL"
        placeholder="https://api.example.com/v1/chat/completions"
        value={preset.url}
        onChange={(e) => updatePreset(activePresetKey, { url: e.target.value })}
      />

      {/* API Key */}
      <Input
        label="API Key"
        type="password"
        placeholder="sk-..."
        value={preset.apiKey}
        onChange={(e) => updatePreset(activePresetKey, { apiKey: e.target.value })}
      />

      {/* Headers Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          Headers
        </label>
        {Object.entries(headers).map(([key, value], idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Header name"
              value={key}
              onChange={(e) => handleHeaderChange(key, 'key', e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <input
              placeholder="Value"
              value={value}
              onChange={(e) => handleHeaderChange(key, 'value', e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <button
              onClick={() => handleRemoveHeader(key)}
              title="Remove header"
              style={{
                padding: 6,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={handleAddHeader} style={{ alignSelf: 'flex-start' }}>
          <Plus size={14} />
          Add Header
        </Button>
      </div>

      {/* Body Template */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          Body Template
        </label>
        <textarea
          value={preset.bodyTemplate}
          onChange={(e) => updatePreset(activePresetKey, { bodyTemplate: e.target.value })}
          rows={8}
          style={{
            padding: '10px 14px',
            fontSize: 13,
            borderRadius: 10,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            resize: 'vertical',
            lineHeight: 1.5,
          }}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Use {'{{MESSAGES}}'} for the full messages array or {'{{PROMPT}}'} for the
          combined prompt text. Use {'{{KEY}}'} in URL or headers for the API key.
        </p>
      </div>

      {/* Response Path */}
      <Input
        label="Response Path"
        placeholder="choices.0.message.content"
        value={preset.responsePath}
        onChange={(e) => updatePreset(activePresetKey, { responsePath: e.target.value })}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
      />

      {/* Test Connection (collapsible) */}
      <div>
        <button
          onClick={() => setTestOpen(!testOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 0',
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {testOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Test Connection
        </button>
        {testOpen && <APITestPanel />}
      </div>
    </section>
  )
}
