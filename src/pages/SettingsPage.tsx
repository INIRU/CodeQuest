import { motion } from 'framer-motion'
import AISettings from '@/components/settings/AISettings'
import GitHubSettings from '@/components/settings/GitHubSettings'
import SyncSettings from '@/components/settings/SyncSettings'
import LanguageFilterSettings from '@/components/settings/LanguageFilterSettings'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTranslation } from '@/i18n'

export default function SettingsPage() {
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        maxWidth: 672,
        margin: '0 auto',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
        {t('settings.title')}
      </h1>

      {/* Language Selector */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          Language / 언어
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setLanguage('ko')}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: `2px solid ${language === 'ko' ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: language === 'ko' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            한국어
          </button>
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: `2px solid ${language === 'en' ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: language === 'en' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            English
          </button>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      <AISettings />

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      <GitHubSettings />

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      <SyncSettings />

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      <LanguageFilterSettings />
    </motion.div>
  )
}
