import { NavLink, Outlet } from 'react-router-dom'
import { Home, Search, FolderGit2, History, Settings, Sun, Moon, Globe } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTranslation } from '@/i18n'

const navItems = [
  { to: '/', icon: Home, labelKey: 'nav.dashboard' },
  { to: '/explore', icon: Search, labelKey: 'nav.explore' },
  { to: '/my-repos', icon: FolderGit2, labelKey: 'nav.myRepos' },
  { to: '/history', icon: History, labelKey: 'nav.history' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export default function MainLayout() {
  const theme = useSettingsStore((s) => s.theme)
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const { t } = useTranslation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 64,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          paddingBottom: 16,
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={t(labelKey)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 10,
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                background: isActive
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-end))'
                  : 'transparent',
                transition: 'all 0.2s',
                textDecoration: 'none',
              })}
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            title={language === 'ko' ? 'English' : '한국어'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.2s',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Globe size={20} />
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
