import { useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Key,
} from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTranslation } from '@/i18n'
import APITestPanel from './APITestPanel'

const DEFAULT_PRESET_KEYS = ['openai', 'claude', 'gemini', 'ollama']

export default function AISettings() {
  const activePresetKey = useSettingsStore((s) => s.activePresetKey)
  const presets = useSettingsStore((s) => s.presets)
  const setActivePresetKey = useSettingsStore((s) => s.setActivePresetKey)
  const updatePreset = useSettingsStore((s) => s.updatePreset)
  const addPreset = useSettingsStore((s) => s.addPreset)
  const deletePreset = useSettingsStore((s) => s.deletePreset)
  const corsProxyUrl = useSettingsStore((s) => s.corsProxyUrl)
  const setCorsProxyUrl = useSettingsStore((s) => s.setCorsProxyUrl)
  const { t } = useTranslation()

  const [newPresetName, setNewPresetName] = useState('')
  const [testOpen, setTestOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

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
      bodyTemplate: '{\n  "messages": {{MESSAGES}}\n}',
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

  // Build select options with descriptions
  const presetOptions = Object.entries(presets).map(([key, p]) => ({
    value: key,
    label: p.name,
    description: key === 'openai' ? 'CORS OK'
      : key === 'claude' ? 'Proxy required'
      : key === 'gemini' ? 'Proxy required'
      : key === 'ollama' ? 'Local (localhost)'
      : undefined,
  }))

  // Find which headers use {{KEY}} to show user
  const headersUsingKey = Object.entries(headers)
    .filter(([, v]) => v.includes('{{KEY}}'))
    .map(([k]) => k)
  const urlUsesKey = preset.url.includes('{{KEY}}')

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
        {t('settings.aiConnection')}
      </h2>

      {/* CORS Proxy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Input
          label={t('settings.corsProxyLabel')}
          placeholder={t('settings.corsProxyPlaceholder')}
          value={corsProxyUrl}
          onChange={(e) => setCorsProxyUrl(e.target.value)}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {corsProxyUrl
            ? <>{t('settings.corsProxyActive')} <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--success)', backgroundColor: 'var(--glass)', padding: '1px 4px', borderRadius: 4 }}>{corsProxyUrl}</code></>
            : t('settings.corsProxyHint')
          }
        </p>
      </div>

      {/* Preset Selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Select
            label={t('settings.preset')}
            value={activePresetKey}
            onChange={setActivePresetKey}
            options={presetOptions}
            placeholder="Select a preset..."
          />
        </div>
        {!isDefault && (
          <Button variant="danger" size="sm" onClick={handleDeletePreset}>
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {/* Add Custom Preset */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            label={t('settings.addCustomPreset')}
            placeholder={t('settings.presetName')}
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPreset()}
          />
        </div>
        <Button variant="secondary" size="md" onClick={handleAddPreset}>
          <Plus size={14} />
          {t('settings.add')}
        </Button>
      </div>

      {/* URL */}
      <Input
        label={t('settings.apiUrl')}
        placeholder="https://api.example.com/v1/chat/completions"
        value={preset.url}
        onChange={(e) => updatePreset(activePresetKey, { url: e.target.value })}
      />

      {/* API Key */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Key size={14} />
          {t('settings.apiKey')}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={preset.apiKey}
            onChange={(e) => updatePreset(activePresetKey, { apiKey: e.target.value })}
            placeholder={t('settings.apiKeyPlaceholder')}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 14,
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {showApiKey ? t('settings.hide') : t('settings.show')}
          </button>
        </div>
        {/* Explanation of where the key goes */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {headersUsingKey.length > 0 || urlUsesKey ? (
            <span>
              {t('settings.apiKeyReplacesIn')}{' '}
              {urlUsesKey && <span style={{ fontFamily: 'var(--font-mono)' }}>{t('common.url')}</span>}
              {urlUsesKey && headersUsingKey.length > 0 && ', '}
              {headersUsingKey.map((h, i) => (
                <span key={h}>
                  {i > 0 && ', '}
                  {t('common.header')} <span style={{ fontFamily: 'var(--font-mono)' }}>{h}</span>
                </span>
              ))}
            </span>
          ) : (
            <span>
              {t('settings.apiKeyAddHint')}
            </span>
          )}
        </div>
      </div>

      {/* Headers Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          {t('settings.headers')}
        </label>
        {Object.entries(headers).map(([key, value], idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder={t('settings.headerName')}
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
              placeholder={t('settings.headerValue')}
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
          {t('settings.addHeader')}
        </Button>
      </div>

      {/* Body Template */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          {t('settings.bodyTemplate')}
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
          {t('settings.bodyTemplateHint')}
        </p>
      </div>

      {/* Response Path */}
      <Input
        label={t('settings.responsePath')}
        placeholder="choices[0].message.content"
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
          {t('settings.testConnection')}
        </button>
        {testOpen && <APITestPanel />}
      </div>
    </section>
  )
}
