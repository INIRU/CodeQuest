import { useState } from 'react'
import { Upload, Download, AlertTriangle } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTranslation } from '@/i18n'
import { saveToGist, loadFromGist } from '@/services/gist-sync'

export default function SyncSettings() {
  const githubPat = useSettingsStore((s) => s.githubPat)
  const syncGistId = useSettingsStore((s) => s.syncGistId)
  const { t } = useTranslation()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveToGist()
      setMessage({ type: 'success', text: t('settings.syncSaved') })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setMessage({ type: 'error', text: t('settings.syncError', { error }) })
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await loadFromGist()
      const timestamp = new Date(result.timestamp).toLocaleString()
      setMessage({ type: 'success', text: t('settings.syncLoaded', { timestamp }) })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setMessage({ type: 'error', text: t('settings.syncError', { error }) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          {t('settings.sync')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: '8px 0 0', lineHeight: 1.5 }}>
          {t('settings.syncDesc')}
        </p>
      </div>

      {!githubPat ? (
        <Card style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16 }}>
          <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
            {t('settings.syncNoToken')}
          </p>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
              }}
            >
              <Upload size={16} />
              {saving ? t('settings.syncSaving') : t('settings.syncSave')}
            </Button>
            <Button
              onClick={handleLoad}
              disabled={saving || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
              }}
            >
              <Download size={16} />
              {loading ? t('settings.syncLoading') : t('settings.syncLoad')}
            </Button>
          </div>

          {message && (
            <p
              style={{
                fontSize: 13,
                margin: 0,
                lineHeight: 1.5,
                color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
              }}
            >
              {message.text}
            </p>
          )}

          {syncGistId && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {t('settings.syncGistId')}: {syncGistId}
            </p>
          )}
        </>
      )}
    </section>
  )
}
