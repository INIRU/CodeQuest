import { type HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  active?: boolean
  children: React.ReactNode
}

const variantColors: Record<BadgeVariant, { color: string; bg: string }> = {
  default: { color: 'var(--text-sub)', bg: 'var(--glass)' },
  success: { color: 'var(--success)', bg: 'rgba(5, 150, 105, 0.1)' },
  error: { color: 'var(--error)', bg: 'rgba(220, 38, 38, 0.1)' },
  warning: { color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.1)' },
}

export default function Badge({
  variant = 'default',
  active = false,
  children,
  onClick,
  style,
  ...props
}: BadgeProps) {
  const colors = variantColors[variant]

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 999,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        color: active ? '#FFFFFF' : colors.color,
        backgroundColor: active ? colors.color : colors.bg,
        border: `1px solid ${active ? 'transparent' : colors.color}20`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
