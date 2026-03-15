import { motion } from 'framer-motion'
import AISettings from '@/components/settings/AISettings'
import GitHubSettings from '@/components/settings/GitHubSettings'
import LanguageFilterSettings from '@/components/settings/LanguageFilterSettings'

export default function SettingsPage() {
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
        Settings
      </h1>

      <AISettings />

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      <GitHubSettings />

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

      <LanguageFilterSettings />
    </motion.div>
  )
}
