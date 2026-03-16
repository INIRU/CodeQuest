import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Select } from '@/components/ui/Select'
import { useTranslation } from '@/i18n'

interface GoalInputProps {
  onSubmit: (goal: string, skillLevel: 'beginner' | 'intermediate' | 'advanced') => void
  loading: boolean
}

const skillLevelOptions = [
  { value: 'beginner', label: 'Beginner', labelKey: 'quiz.beginner' },
  { value: 'intermediate', label: 'Intermediate', labelKey: 'quiz.intermediate' },
  { value: 'advanced', label: 'Advanced', labelKey: 'quiz.advanced' },
]

export default function GoalInput({ onSubmit, loading }: GoalInputProps) {
  const [goal, setGoal] = useState('')
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const { t } = useTranslation()

  const handleSubmit = () => {
    if (!goal.trim()) return
    onSubmit(goal.trim(), skillLevel)
  }

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Target size={20} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {t('learn.goalTab')}
        </span>
      </div>

      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder={t('learn.goalPlaceholder')}
        rows={3}
        style={{
          padding: '10px 14px',
          fontSize: 14,
          borderRadius: 10,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />

      <Select
        label={t('learn.skillLevel')}
        value={skillLevel}
        onChange={(v) => setSkillLevel(v as 'beginner' | 'intermediate' | 'advanced')}
        options={skillLevelOptions.map((o) => ({
          value: o.value,
          label: t(o.labelKey),
        }))}
      />

      <Button
        onClick={handleSubmit}
        disabled={!goal.trim()}
        loading={loading}
        size="lg"
        style={{ alignSelf: 'flex-start' }}
      >
        {loading ? t('learn.generatingPlan') : t('learn.createPlan')}
      </Button>
    </Card>
  )
}
