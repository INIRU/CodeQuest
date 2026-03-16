import { NavLink, Outlet } from 'react-router-dom'
import { Home, Search, FolderGit2, History, Settings, Sun, Moon, Globe, GraduationCap } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTranslation } from '@/i18n'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const navItems = [
  { to: '/', icon: Home, labelKey: 'nav.dashboard' },
  { to: '/explore', icon: Search, labelKey: 'nav.explore' },
  { to: '/my-repos', icon: FolderGit2, labelKey: 'nav.myRepos' },
  { to: '/history', icon: History, labelKey: 'nav.history' },
  { to: '/learn', icon: GraduationCap, labelKey: 'nav.learn' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export default function MainLayout() {
  const theme = useSettingsStore((s) => s.theme)
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main style={{ flex: 1, overflow: 'auto', paddingBottom: 64 }}>
          <Outlet />
        </main>

        {/* Bottom navigation bar */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            zIndex: 50,
          }}
        >
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
                width: 44,
                height: 44,
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
      </div>
    )
  }

  return (
    <div style={{ display: 'flex' }}>
      <aside
        style={{
          width: 64,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          paddingBottom: 16,
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          zIndex: 50,
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

      <main style={{ flex: 1, overflow: 'auto', marginLeft: 64, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
