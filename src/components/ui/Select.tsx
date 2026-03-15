import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
  description?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
}

export function Select({ value, onChange, options, placeholder, label }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-sub)' }}>
          {label}
        </label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onChange}>
        <SelectPrimitive.Trigger
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '10px 14px',
            fontSize: 14,
            borderRadius: 10,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'border-color 0.2s',
          }}
        >
          <SelectPrimitive.Value placeholder={placeholder || 'Select...'} />
          <SelectPrimitive.Icon>
            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 4,
              minWidth: 'var(--radix-select-trigger-width)',
              maxHeight: 320,
              overflow: 'auto',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(20px)',
              zIndex: 100,
            }}
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} description={option.description}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}

interface SelectItemProps extends SelectPrimitive.SelectItemProps {
  description?: string
  children: React.ReactNode
}

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, description, ...props }, ref) => {
    return (
      <SelectPrimitive.Item
        ref={ref}
        {...props}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          fontSize: 14,
          borderRadius: 8,
          color: 'var(--text)',
          cursor: 'pointer',
          outline: 'none',
          userSelect: 'none',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--glass)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <SelectPrimitive.ItemIndicator style={{ width: 16, display: 'flex', alignItems: 'center' }}>
          <Check size={14} style={{ color: 'var(--primary)' }} />
        </SelectPrimitive.ItemIndicator>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
          {description && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {description}
            </span>
          )}
        </div>
      </SelectPrimitive.Item>
    )
  }
)
SelectItem.displayName = 'SelectItem'
