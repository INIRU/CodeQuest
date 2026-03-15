import { useState } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { Card, Input } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGithubStore } from '@/stores/useGithubStore'

export default function GitHubSettings() {
  const githubPat = useSettingsStore((s) => s.githubPat)
  const setGithubPat = useSettingsStore((s) => s.setGithubPat)
  const rateLimitRemaining = useGithubStore((s) => s.rateLimitRemaining)
  const rateLimitReset = useGithubStore((s) => s.rateLimitReset)

  const [showPat, setShowPat] = useState(false)

  const resetDate = rateLimitReset
    ? new Date(rateLimitReset * 1000).toLocaleTimeString()
    : null

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
        GitHub Integration
      </h2>

      {/* Security Warning */}
      <Card style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16 }}>
        <Shield size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--warning)' }}>Security Notice:</strong> Your
          token is stored in the browser's localStorage and is never sent to any server
          other than GitHub's API. We recommend using a{' '}
          <strong>fine-grained personal access token</strong> with minimal read-only
          permissions.
        </div>
      </Card>

      {/* PAT Input with eye toggle */}
      <div style={{ position: 'relative' }}>
        <Input
          label="Personal Access Token"
          type={showPat ? 'text' : 'password'}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value={githubPat}
          onChange={(e) => setGithubPat(e.target.value)}
          style={{ paddingRight: 44 }}
        />
        <button
          onClick={() => setShowPat(!showPat)}
          title={showPat ? 'Hide token' : 'Show token'}
          style={{
            position: 'absolute',
            right: 12,
            bottom: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {showPat ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Rate Limit Display */}
      {rateLimitRemaining !== null && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 13,
            color: 'var(--text-sub)',
          }}
        >
          <span>
            Rate Limit Remaining:{' '}
            <strong
              style={{
                color:
                  rateLimitRemaining < 10
                    ? 'var(--error)'
                    : rateLimitRemaining < 100
                      ? 'var(--warning)'
                      : 'var(--success)',
              }}
            >
              {rateLimitRemaining}
            </strong>
          </span>
          {resetDate && <span>Resets at: {resetDate}</span>}
        </div>
      )}

      {/* Without token message */}
      {!githubPat && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Without a token, GitHub API limits you to <strong>60 requests/hour</strong>.
          With a token, the limit increases to <strong>5,000 requests/hour</strong>.
        </p>
      )}
    </section>
  )
}
