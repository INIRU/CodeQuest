import { useState } from 'react'
import { motion } from 'framer-motion'
import * as Tabs from '@radix-ui/react-tabs'
import { GraduationCap, Target, ExternalLink, Trash2 } from 'lucide-react'
import { Button, Card, ConfirmModal } from '@/components/ui'
import { useTranslation } from '@/i18n'
import { useLearningStore } from '@/stores/useLearningStore'
import { generateLearningPlanFromGoal, generateLearningPlanFromUrl } from '@/services/learning'
import GoalInput from '@/components/learning/GoalInput'
import UrlInput from '@/components/learning/UrlInput'
import LearningPlanView from '@/components/learning/LearningPlanView'

export default function LearningPage() {
  const { t } = useTranslation()
  const { plans, activePlanId, addPlan, deletePlan, setActivePlan, completeStep } =
    useLearningStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null

  const handleGoalSubmit = async (
    goal: string,
    skillLevel: 'beginner' | 'intermediate' | 'advanced',
  ) => {
    setLoading(true)
    setError(null)
    try {
      const plan = await generateLearningPlanFromGoal(goal, skillLevel)
      addPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleUrlSubmit = async (url: string, context?: string) => {
    setLoading(true)
    setError(null)
    try {
      const plan = await generateLearningPlanFromUrl(url, context)
      addPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GraduationCap size={28} style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {t('learn.title')}
          </h1>
        </div>
      </motion.div>

      {/* Active Plan View */}
      {activePlan ? (
        <motion.div
          key={activePlan.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePlan(null)}
            >
              {t('learn.myPlans')}
            </Button>
          </div>
          <LearningPlanView
            plan={activePlan}
            onCompleteStep={(stepId) => completeStep(activePlan.id, stepId)}
            onDelete={() => deletePlan(activePlan.id)}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* Create New Plan Tabs */}
          <Tabs.Root defaultValue="goal">
            <Tabs.List
              style={{
                display: 'flex',
                gap: 2,
                padding: 4,
                backgroundColor: 'var(--glass)',
                borderRadius: 12,
                marginBottom: 16,
                width: 'fit-content',
              }}
            >
              <Tabs.Trigger
                value="goal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'var(--text)',
                  background: 'transparent',
                }}
                data-state-styles=""
                ref={(el) => {
                  if (!el) return
                  const observer = new MutationObserver(() => {
                    const isActive = el.getAttribute('data-state') === 'active'
                    el.style.background = isActive
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-end))'
                      : 'transparent'
                    el.style.color = isActive ? '#FFFFFF' : 'var(--text-sub)'
                  })
                  observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
                  // Initial state
                  const isActive = el.getAttribute('data-state') === 'active'
                  el.style.background = isActive
                    ? 'linear-gradient(135deg, var(--primary), var(--primary-end))'
                    : 'transparent'
                  el.style.color = isActive ? '#FFFFFF' : 'var(--text-sub)'
                }}
              >
                <Target size={16} />
                {t('learn.goalTab')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="url"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: 'var(--text)',
                  background: 'transparent',
                }}
                ref={(el) => {
                  if (!el) return
                  const observer = new MutationObserver(() => {
                    const isActive = el.getAttribute('data-state') === 'active'
                    el.style.background = isActive
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-end))'
                      : 'transparent'
                    el.style.color = isActive ? '#FFFFFF' : 'var(--text-sub)'
                  })
                  observer.observe(el, { attributes: true, attributeFilter: ['data-state'] })
                  const isActive = el.getAttribute('data-state') === 'active'
                  el.style.background = isActive
                    ? 'linear-gradient(135deg, var(--primary), var(--primary-end))'
                    : 'transparent'
                  el.style.color = isActive ? '#FFFFFF' : 'var(--text-sub)'
                }}
              >
                <ExternalLink size={16} />
                {t('learn.urlTab')}
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="goal">
              <GoalInput onSubmit={handleGoalSubmit} loading={loading} />
            </Tabs.Content>
            <Tabs.Content value="url">
              <UrlInput onSubmit={handleUrlSubmit} loading={loading} />
            </Tabs.Content>
          </Tabs.Root>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: 'var(--error)',
                fontSize: 14,
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Existing Plans */}
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 12px',
              }}
            >
              {t('learn.myPlans')}
            </h2>

            {plans.length === 0 ? (
              <Card
                style={{
                  textAlign: 'center',
                  padding: 40,
                }}
              >
                <GraduationCap
                  size={40}
                  style={{ color: 'var(--text-muted)', marginBottom: 12 }}
                />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                  {t('learn.noPlan')}
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plans.map((plan) => {
                  const completedCount = plan.steps.filter((s) => s.completed).length
                  const totalSteps = plan.steps.length
                  const progressPercent =
                    totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        hover
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActivePlan(plan.id)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: 'var(--text)',
                                marginBottom: 4,
                              }}
                            >
                              {plan.title}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-muted)',
                                marginBottom: 10,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {plan.description}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  flex: 1,
                                  maxWidth: 200,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: 'var(--border)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    borderRadius: 3,
                                    background:
                                      'linear-gradient(135deg, var(--primary), var(--primary-end))',
                                    transition: 'width 0.3s',
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {t('learn.stepProgress', {
                                  completed: completedCount,
                                  total: totalSteps,
                                })}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTargetId(plan.id)
                              setConfirmOpen(true)
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('history.delete')}
        description={t('learn.deletePlan')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={() => {
          if (deleteTargetId) {
            deletePlan(deleteTargetId)
            setDeleteTargetId(null)
          }
        }}
      />
    </div>
  )
}
