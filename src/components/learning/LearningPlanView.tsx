import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, GraduationCap } from 'lucide-react'
import { Button, Card, ConfirmModal } from '@/components/ui'
import { useTranslation } from '@/i18n'
import type { LearningPlan } from '@/services/learning'
import StepCard from './StepCard'

interface LearningPlanViewProps {
  plan: LearningPlan
  onCompleteStep: (stepId: string) => void
  onDelete: () => void
}

export default function LearningPlanView({
  plan,
  onCompleteStep,
  onDelete,
}: LearningPlanViewProps) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const completedCount = plan.steps.filter((s) => s.completed).length
  const totalSteps = plan.steps.length
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  const handleDeleteConfirm = () => {
    setConfirmOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Plan Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <GraduationCap size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {plan.title}
              </h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
              {plan.description}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDeleteConfirm}>
            <Trash2 size={16} />
          </Button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 500 }}>
              {t('learn.stepProgress', { completed: completedCount, total: totalSteps })}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              backgroundColor: 'var(--border)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-end))',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            onComplete={() => onCompleteStep(step.id)}
          />
        ))}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('history.delete')}
        description={t('learn.deletePlan')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={onDelete}
      />
    </div>
  )
}
