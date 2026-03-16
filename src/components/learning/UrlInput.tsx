import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useTranslation } from '@/i18n'

interface UrlInputProps {
  onSubmit: (url: string, context?: string) => void
  loading: boolean
}

export default function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [context, setContext] = useState('')
  const { t } = useTranslation()

  const handleSubmit = () => {
    if (!url.trim()) return
    onSubmit(url.trim(), context.trim() || undefined)
  }

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ExternalLink size={20} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {t('learn.urlTab')}
        </span>
      </div>

      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t('learn.urlPlaceholder')}
        type="url"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          {t('learn.urlContext')}
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t('learn.urlContextPlaceholder')}
          rows={2}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            borderRadius: 10,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!url.trim()}
        loading={loading}
        size="lg"
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? t('learn.analyzingUrl') : t('learn.createPlan')}
      </Button>
    </Card>
  )
}
