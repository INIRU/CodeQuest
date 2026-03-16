import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useTranslation } from '@/i18n'
import type { LearningStep } from '@/services/learning'

interface StepCardProps {
  step: LearningStep
  index: number
  onComplete: () => void
  onStartHomework: () => void
}

export default function StepCard({ step, index, onComplete, onStartHomework }: StepCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        backgroundColor: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${step.completed ? 'var(--success)' : 'var(--border)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
            background: step.completed
              ? 'var(--success)'
              : 'linear-gradient(135deg, var(--primary), var(--primary-end))',
            color: '#FFFFFF',
          }}
        >
          {step.completed ? (
            <CheckCircle size={16} />
          ) : (
            index + 1
          )}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {step.title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {step.description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <Clock size={14} />
          {t('learn.estimatedTime', { minutes: step.estimatedMinutes })}
        </div>

        {expanded ? (
          <ChevronUp size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    marginBottom: 8,
                  }}
                >
                  {t('learn.topics')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {step.topics.map((topic, i) => (
                    <Badge key={i}>{topic}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    marginBottom: 8,
                  }}
                >
                  <BookOpen size={14} />
                  {t('learn.homework')}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--text)',
                    lineHeight: 1.6,
                    backgroundColor: 'var(--surface)',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  {step.homework}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartHomework()
                  }}
                >
                  {t('learn.startHomework')}
                </Button>
                {!step.completed && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onComplete()
                    }}
                  >
                    <Circle size={14} />
                    {t('learn.markComplete')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
