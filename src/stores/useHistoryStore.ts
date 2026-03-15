import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuizHistory, Stats, QuizType } from '@/types'

interface HistoryState {
  quizzes: QuizHistory[]

  addQuiz: (quiz: QuizHistory) => void
  deleteQuiz: (id: string) => void
  clearHistory: () => void
  getStats: () => Stats
}

function calculateStreak(quizzes: QuizHistory[]): { current: number; best: number } {
  if (quizzes.length === 0) return { current: 0, best: 0 }

  const sorted = [...quizzes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const uniqueDays = Array.from(
    new Set(sorted.map((q) => q.date.split('T')[0]))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let current = 1
  let best = 1
  let streak = 1

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      streak++
      best = Math.max(best, streak)
    } else {
      if (i === 1 || (i > 1 && streak === current)) {
        current = streak
      }
      streak = 1
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const lastDay = uniqueDays[0]

  if (lastDay === today || lastDay === yesterday) {
    current = streak >= current ? streak : current
  } else {
    current = 0
  }

  best = Math.max(best, streak)

  return { current, best }
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      quizzes: [],

      addQuiz: (quiz) =>
        set((state) => ({ quizzes: [quiz, ...state.quizzes] })),

      deleteQuiz: (id) =>
        set((state) => ({ quizzes: state.quizzes.filter((q) => q.id !== id) })),

      clearHistory: () => set({ quizzes: [] }),

      getStats: () => {
        const { quizzes } = get()

        const byLanguage: Record<string, number> = {}
        const byType: Record<QuizType, number> = {
          explain: 0,
          'fill-blank': 0,
          code: 0,
          'bug-hunt': 0,
          'code-review': 0,
          'output-prediction': 0,
        }

        let totalScore = 0

        for (const quiz of quizzes) {
          byLanguage[quiz.language] = (byLanguage[quiz.language] || 0) + 1
          byType[quiz.type] = (byType[quiz.type] || 0) + 1
          totalScore += quiz.score
        }

        const { current, best } = calculateStreak(quizzes)

        return {
          totalSolved: quizzes.length,
          byLanguage,
          byType,
          averageScore: quizzes.length > 0 ? totalScore / quizzes.length : 0,
          currentStreak: current,
          bestStreak: best,
        }
      },
    }),
    {
      name: 'codetraining-history',
      version: 1,
    }
  )
)
