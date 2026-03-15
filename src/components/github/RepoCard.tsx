import { Star } from 'lucide-react'
import { Card } from '@/components/ui'
import type { GitHubRepo } from '@/types'

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
}

interface RepoCardProps {
  repo: GitHubRepo
  onClick: (repo: GitHubRepo) => void
}

export default function RepoCard({ repo, onClick }: RepoCardProps) {
  const langColor = repo.language ? LANG_COLORS[repo.language] ?? 'var(--text-muted)' : null

  return (
    <Card
      hover
      onClick={() => onClick(repo)}
      style={{ padding: 16, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          width={32}
          height={32}
          style={{ borderRadius: '50%' }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {repo.full_name}
        </span>
      </div>

      {repo.description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-sub)',
            margin: '0 0 10px 0',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {repo.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
        {repo.language && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: langColor ?? 'var(--text-muted)',
                display: 'inline-block',
              }}
            />
            {repo.language}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
          <Star size={12} />
          {repo.stargazers_count.toLocaleString()}
        </span>
      </div>
    </Card>
  )
}
