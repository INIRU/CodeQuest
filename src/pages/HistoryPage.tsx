import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Lightbulb, FileText, Trash2 } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useTranslation } from '@/i18n'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { QuizType } from '@/types'

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--error)'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function HistoryPage() {
  const quizzes = useHistoryStore((s) => s.quizzes)
  const deleteQuiz = useHistoryStore((s) => s.deleteQuiz)
  const [filterType, setFilterType] = useState<QuizType | 'all'>('all')
  const [filterLang, setFilterLang] = useState<string>('all')
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const uniqueTypes = useMemo(() => {
    const set = new Set<QuizType>()
    for (const q of quizzes) set.add(q.type)
    return Array.from(set)
  }, [quizzes])

  const uniqueLanguages = useMemo(() => {
    const set = new Set<string>()
    for (const q of quizzes) set.add(q.language)
    return Array.from(set)
  }, [quizzes])

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      if (filterType !== 'all' && q.type !== filterType) return false
      if (filterLang !== 'all' && q.language !== filterLang) return false
      return true
    })
  }, [quizzes, filterType, filterLang])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: isMobile ? 16 : 32, maxWidth: 900, margin: '0 auto' }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 24px 0',
        }}
      >
        {t('history.title')}
      </h1>

      {/* Filter by type */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-sub)',
            marginBottom: 8,
          }}
        >
          Type
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Badge
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          >
            {t('history.allTypes')}
          </Badge>
          {uniqueTypes.map((tp) => (
            <Badge
              key={tp}
              active={filterType === tp}
              onClick={() => setFilterType(tp)}
            >
              {tp}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filter by language */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-sub)',
            marginBottom: 8,
          }}
        >
          {t('settings.language')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Badge
            active={filterLang === 'all'}
            onClick={() => setFilterLang('all')}
          >
            {t('history.allLanguages')}
          </Badge>
          {uniqueLanguages.map((l) => (
            <Badge
              key={l}
              active={filterLang === l}
              onClick={() => setFilterLang(l)}
            >
              {l}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quiz list */}
      {filtered.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 48,
          }}
        >
          <FileText size={40} style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontSize: 15, color: 'var(--text-sub)', margin: 0 }}>
            {t('history.noResults')}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((q) => (
            <Card key={q.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <Badge>{q.type}</Badge>
                    <Badge>{q.language}</Badge>
                    <Badge>{q.difficulty}</Badge>
                  </div>

                  {/* Source */}
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text-sub)',
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {q.sourceRepo} / {q.sourceFile}
                  </div>

                  {/* Date, time, hints */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{formatDate(q.date)}</span>
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Clock size={12} />
                      {formatTime(q.timeSpent)}
                    </span>
                    {q.hintsUsed > 0 && (
                      <span
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Lightbulb size={12} />
                        {q.hintsUsed} hint{q.hintsUsed > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score and delete */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: getScoreColor(q.score),
                    }}
                  >
                    {q.score}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(t('history.deleteConfirm'))) {
                        deleteQuiz(q.id)
                      }
                    }}
                    title={t('history.delete')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--error)'
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.background = 'none'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
