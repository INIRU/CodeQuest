import { NavLink, Outlet } from 'react-router-dom'
import { Home, Search, FolderGit2, History, Settings, Sun, Moon } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/my-repos', icon: FolderGit2, label: 'My Repos' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function MainLayout() {
  const theme = useSettingsStore((s) => s.theme)
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)

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
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={label}
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

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            marginTop: 'auto',
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
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
