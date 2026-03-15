import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import DashboardPage from '@/pages/DashboardPage'
import ExplorePage from '@/pages/ExplorePage'
import MyReposPage from '@/pages/MyReposPage'
import QuizPage from '@/pages/QuizPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'
import { useSettingsStore } from '@/stores/useSettingsStore'

function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/my-repos" element={<MyReposPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
