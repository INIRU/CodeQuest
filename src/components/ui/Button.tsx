import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 13, borderRadius: 8 },
  md: { padding: '8px 16px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '12px 24px', fontSize: 16, borderRadius: 12 },
}

function getVariantStyles(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: 'linear-gradient(135deg, var(--primary), var(--primary-end))',
        color: '#FFFFFF',
        border: 'none',
      }
    case 'secondary':
      return {
        background: 'transparent',
        color: 'var(--text)',
        border: '1px solid var(--border)',
      }
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--text-sub)',
        border: 'none',
      }
    case 'danger':
      return {
        background: 'var(--error)',
        color: '#FFFFFF',
        border: 'none',
      }
  }
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="8"
        opacity="0.8"
      />
    </svg>
  )
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        ...sizeStyles[size],
        ...getVariantStyles(variant),
        ...style,
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(1.02)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
