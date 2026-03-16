import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
}

export default function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9998,
            animation: 'confirmOverlayIn 0.15s ease-out',
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: 420,
            backgroundColor: 'var(--surface)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            zIndex: 9999,
            outline: 'none',
            animation: 'confirmContentIn 0.15s ease-out',
          }}
        >
          <style>{`
            @keyframes confirmOverlayIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes confirmContentIn {
              from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}</style>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {variant === 'danger' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
                </div>
              )}
              <Dialog.Title
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                {title}
              </Dialog.Title>
            </div>

            <Dialog.Close asChild>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description
            style={{
              fontSize: 14,
              color: 'var(--text-sub)',
              lineHeight: 1.6,
              margin: '0 0 20px 0',
            }}
          >
            {description}
          </Dialog.Description>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Dialog.Close asChild>
              <Button variant="secondary" size="sm">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
