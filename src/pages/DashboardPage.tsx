import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Flame, BookOpen, Play, X } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useQuizStore } from '@/stores/useQuizStore'
import { useTranslation } from '@/i18n'

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--error)'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const quizzes = useHistoryStore((s) => s.quizzes)
  const getStats = useHistoryStore((s) => s.getStats)
  const stats = getStats()
  const { t } = useTranslation()

  // Resume quiz detection
  const currentQuiz = useQuizStore((s) => s.currentQuiz)
  const gradingResult = useQuizStore((s) => s.gradingResult)
  const quizSeries = useQuizStore((s) => s.quizSeries)
  const currentIndex = useQuizStore((s) => s.currentIndex)
  const seriesGradingResults = useQuizStore((s) => s.seriesGradingResults)
  const resetQuiz = useQuizStore((s) => s.reset)

  const hasIncompleteQuiz = (() => {
    if (!currentQuiz) return false
    if (quizSeries.length > 1) {
      return seriesGradingResults.some((r) => r === null)
    }
    return gradingResult === null
  })()

  const languageEntries = Object.entries(stats.byLanguage).sort(
    ([, a], [, b]) => b - a,
  )
  const recentQuizzes = quizzes.slice(0, 5)

  if (stats.totalSolved === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 24,
        }}
      >
        {/* Resume card in empty state */}
        {hasIncompleteQuiz && currentQuiz && (
          <Card
            style={{
              maxWidth: 400,
              width: '100%',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                {t('dashboard.continueQuiz')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                {t('dashboard.continueDesc')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                {currentQuiz.type} - {currentQuiz.language} - {currentQuiz.sourceFile}
                {quizSeries.length > 1 && (
                  <span>
                    {' '}
                    ({t('dashboard.seriesProgress', {
                      current: String(currentIndex + 1),
                      total: String(quizSeries.length),
                    })})
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => resetQuiz()}>
                  <X size={14} style={{ marginRight: 4 }} />
                  {t('dashboard.discard')}
                </Button>
                <Button size="sm" onClick={() => navigate(`/quiz/${currentQuiz.id}`)}>
                  <Play size={14} style={{ marginRight: 4 }} />
                  {t('dashboard.continueQuiz')}
                </Button>
              </div>
            </div>
          </Card>
        )}
        <Card
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            maxWidth: 400,
          }}
        >
          <BookOpen size={48} style={{ color: 'var(--text-muted)' }} />
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            {t('dashboard.noQuizzes')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: 0 }}>
            {t('dashboard.noQuizzesDesc')}
          </p>
          <Button onClick={() => navigate('/explore')}>{t('dashboard.startExploring')}</Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 24px 0',
        }}
      >
        {t('dashboard.title')}
      </h1>

      {/* Resume incomplete quiz */}
      {hasIncompleteQuiz && currentQuiz && (
        <Card
          style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
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
                {t('dashboard.continueQuiz')}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-sub)',
                  marginBottom: 8,
                }}
              >
                {t('dashboard.continueDesc')}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--text-sub)',
                }}
              >
                <span>{currentQuiz.type}</span>
                <span>-</span>
                <span>{currentQuiz.language}</span>
                <span>-</span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}
                >
                  {currentQuiz.sourceFile}
                </span>
                {quizSeries.length > 1 && (
                  <>
                    <span>-</span>
                    <span>
                      {t('dashboard.seriesProgress', {
                        current: String(currentIndex + 1),
                        total: String(quizSeries.length),
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => resetQuiz()}
              >
                <X size={14} style={{ marginRight: 4 }} />
                {t('dashboard.discard')}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/quiz/${currentQuiz.id}`)}
              >
                <Play size={14} style={{ marginRight: 4 }} />
                {t('dashboard.continueQuiz')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-end))',
                color: '#FFFFFF',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {stats.totalSolved}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{t('dashboard.solved')}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                color: 'var(--success)',
              }}
            >
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {Math.round(stats.averageScore)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{t('dashboard.avgScore')}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                color: 'var(--warning)',
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {stats.currentStreak}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-sub)' }}>
                  d
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{t('dashboard.streak')}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {Object.keys(stats.byLanguage).length}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{t('dashboard.languages')}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button onClick={() => navigate('/explore')}>{t('dashboard.exploreBtn')}</Button>
        <Button variant="secondary" onClick={() => navigate('/my-repos')}>
          {t('dashboard.myReposBtn')}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Language breakdown */}
        <Card>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text)',
              margin: '0 0 16px 0',
            }}
          >
            {t('dashboard.byLanguage')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {languageEntries.map(([lang, count]) => {
              const pct = stats.totalSolved > 0 ? (count / stats.totalSolved) * 100 : 0
              return (
                <div key={lang}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                      {lang}
                    </span>
                    <span style={{ color: 'var(--text-sub)' }}>
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'var(--surface)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 4,
                        background:
                          'linear-gradient(90deg, var(--primary), var(--primary-end))',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent quizzes */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {t('dashboard.recent')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/history')}
            >
              {t('dashboard.viewAll')}
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentQuizzes.map((q) => (
              <div
                key={q.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: 'var(--surface)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {q.type} - {q.language}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-sub)',
                      marginTop: 2,
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {q.sourceFile}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: getScoreColor(q.score),
                  }}
                >
                  {q.score}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
