import { useState } from 'react'
import { Play, ChevronDown, ChevronUp, Check, AlertTriangle } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { buildRequest, autoDetectResponsePath, extractByPath } from '@/services/ai'
import { useTranslation } from '@/i18n'

export default function APITestPanel() {
  const presets = useSettingsStore((s) => s.presets)
  const activePresetKey = useSettingsStore((s) => s.activePresetKey)
  const updatePreset = useSettingsStore((s) => s.updatePreset)
  const { t } = useTranslation()

  const preset = presets[activePresetKey]

  const [loading, setLoading] = useState(false)
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [rawResponse, setRawResponse] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCorsError, setIsCorsError] = useState(false)
  const [detectedPath, setDetectedPath] = useState<string | null>(null)
  const [parsedText, setParsedText] = useState<string | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [responseOpen, setResponseOpen] = useState(true)

  if (!preset) return null

  const testMessages = [{ role: 'user', content: "Hello, respond with 'OK'" }]
  const builtRequest = buildRequest(preset, testMessages)

  async function handleRunTest() {
    setLoading(true)
    setError(null)
    setIsCorsError(false)
    setStatusCode(null)
    setResponseTime(null)
    setRawResponse(null)
    setDetectedPath(null)
    setParsedText(null)

    const corsProxy = useSettingsStore.getState().corsProxyUrl
    const start = performance.now()
    try {
      const targetUrl = corsProxy
        ? `${corsProxy}${corsProxy.endsWith('?') || corsProxy.endsWith('=') ? '' : '/'}${builtRequest.url}`
        : builtRequest.url

      const response = await fetch(targetUrl, {
        method: builtRequest.method,
        headers: builtRequest.headers,
        body: builtRequest.body,
      })
      const elapsed = Math.round(performance.now() - start)
      setResponseTime(elapsed)
      setStatusCode(response.status)

      const responseText = await response.text()
      let json: unknown
      try {
        json = JSON.parse(responseText)
      } catch {
        // Response is not JSON — show raw text
        setRawResponse(responseText)
        setError(`Response is not valid JSON (status ${response.status})`)
        return
      }
      setRawResponse(json)

      // Auto-detect response path
      const detected = autoDetectResponsePath(json)
      setDetectedPath(detected)

      // Try to extract with current path
      if (preset.responsePath) {
        const extracted = extractByPath(json, preset.responsePath)
        if (typeof extracted === 'string') {
          setParsedText(extracted)
        }
      } else if (detected) {
        const extracted = extractByPath(json, detected)
        if (typeof extracted === 'string') {
          setParsedText(extracted)
        }
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - start)
      setResponseTime(elapsed)

      const msg = err instanceof Error ? err.message : 'Unknown error'

      // Detect specific error types
      const isMixedContent = builtRequest.url.startsWith('http:') && window.location.protocol === 'https:'
      const isNetworkError = err instanceof TypeError && (
        msg === 'Failed to fetch' ||
        msg === 'Load failed' ||
        msg.includes('NetworkError') ||
        msg.includes('Network request failed')
      )

      if (isMixedContent && isNetworkError) {
        setIsCorsError(false)
        setError('Mixed Content: HTTPS page cannot request HTTP API. Your API server needs HTTPS, or use an HTTPS proxy.')
      } else if (isNetworkError) {
        setIsCorsError(true)
        setError(t('settings.corsError'))
      } else if (msg.includes('AbortError') || msg.includes('aborted')) {
        setError('Request timed out. The API server may be slow or unreachable.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleApplyDetectedPath() {
    if (detectedPath) {
      updatePreset(activePresetKey, { responsePath: detectedPath })
    }
  }

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      {!preset.apiKey && preset.url.includes('{{KEY}}') && (
        <p style={{ fontSize: 13, color: 'var(--warning)', margin: 0 }}>
          {t('settings.apiKeyEmpty')}
        </p>
      )}
      <Button
        variant="primary"
        size="sm"
        loading={loading}
        onClick={handleRunTest}
      >
        <Play size={14} />
        {t('settings.runTest')}
      </Button>

      {/* Status + Timing */}
      {(statusCode !== null || responseTime !== null) && (
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          {statusCode !== null && (
            <span style={{
              color: statusCode >= 200 && statusCode < 300
                ? 'var(--success)'
                : 'var(--error)',
              fontWeight: 600,
            }}>
              Status: {statusCode}
            </span>
          )}
          {responseTime !== null && (
            <span style={{ color: 'var(--text-sub)' }}>
              Time: {responseTime}ms
            </span>
          )}
        </div>
      )}

      {/* CORS Error Guidance */}
      {isCorsError && (
        <Card style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14 }}>
          <AlertTriangle size={18} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--error)' }}>{t('settings.corsError')}</strong>
          </div>
        </Card>
      )}

      {/* General Error */}
      {error && !isCorsError && (
        <p style={{ fontSize: 13, color: 'var(--error)', margin: 0 }}>{error}</p>
      )}

      {/* Request Details (collapsible) */}
      <div>
        <button
          onClick={() => setRequestOpen(!requestOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 0',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-sub)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {requestOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {t('settings.request')}
        </button>
        {requestOpen && (
          <pre
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-sub)',
              backgroundColor: 'var(--surface)',
              borderRadius: 8,
              padding: 12,
              overflow: 'auto',
              maxHeight: 200,
              margin: '8px 0 0 0',
              border: '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(
              {
                url: builtRequest.url,
                method: builtRequest.method,
                headers: builtRequest.headers,
                body: (() => { try { return JSON.parse(builtRequest.body) } catch { return builtRequest.body } })(),
              },
              null,
              2,
            )}
          </pre>
        )}
      </div>

      {/* Response JSON (collapsible, open by default) */}
      {rawResponse !== null && (
        <div>
          <button
            onClick={() => setResponseOpen(!responseOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-sub)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {responseOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {t('settings.response')}
          </button>
          {responseOpen && (
            <pre
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-sub)',
                backgroundColor: 'var(--surface)',
                borderRadius: 8,
                padding: 12,
                overflow: 'auto',
                maxHeight: 300,
                margin: '8px 0 0 0',
                border: '1px solid var(--border)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Auto-detected Path */}
      {detectedPath && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
          }}
        >
          <Check size={14} color="var(--success)" />
          <span style={{ color: 'var(--text-sub)' }}>
            {t('settings.detectedPath')}:{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--glass)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {detectedPath}
            </code>
          </span>
          <Button variant="secondary" size="sm" onClick={handleApplyDetectedPath}>
            {t('settings.apply')}
          </Button>
        </div>
      )}

      {/* Parsed Text Preview */}
      {parsedText && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
            {t('settings.parsedResult')}
          </span>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text)',
              backgroundColor: 'var(--surface)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {parsedText}
          </div>
        </div>
      )}
    </Card>
  )
}
