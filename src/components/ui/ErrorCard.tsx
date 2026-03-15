import { AlertTriangle } from 'lucide-react'
import Card from './Card'
import Button from './Button'

interface ErrorCardProps {
  message: string
  detail?: string
  onRetry?: () => void
}

export default function ErrorCard({ message, detail, onRetry }: ErrorCardProps) {
  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={40} color="var(--error)" />
      <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
        {message}
      </p>
      {detail && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          {detail}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} style={{ marginTop: 8 }}>
          Retry
        </Button>
      )}
    </Card>
  )
}
