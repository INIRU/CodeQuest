import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { Link as LinkIcon } from 'lucide-react'
import { useTranslation } from '@/i18n'

interface Props {
  onLoad: (owner: string, repo: string) => void
  loading?: boolean
}

export function RepoUrlInput({ onLoad, loading }: Props) {
  const [url, setUrl] = useState('')
  const { t } = useTranslation()

  const handleLoad = () => {
    const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
    if (!match) return
    onLoad(match[1], match[2].replace(/\.git$/, ''))
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <Input
          label={t('explore.urlLabel') || 'GitHub URL'}
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
        />
      </div>
      <Button onClick={handleLoad} loading={loading} disabled={!url.trim()}>
        <LinkIcon size={14} />
        {t('explore.loadRepo') || 'Load'}
      </Button>
    </div>
  )
}
