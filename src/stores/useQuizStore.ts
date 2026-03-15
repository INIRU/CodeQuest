import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Quiz, GradingResult } from '@/types'

interface QuizState {
  currentQuiz: Quiz | null
  userAnswer: string
  gradingResult: GradingResult | null
  hintsUsed: number
  isGenerating: boolean
  isGrading: boolean
  startTime: number | null

  setCurrentQuiz: (quiz: Quiz | null) => void
  setUserAnswer: (answer: string) => void
  setGradingResult: (result: GradingResult | null) => void
  useHint: () => void
  setIsGenerating: (generating: boolean) => void
  setIsGrading: (grading: boolean) => void
  startTimer: () => void
  getElapsedTime: () => number
  reset: () => void
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      currentQuiz: null,
      userAnswer: '',
      gradingResult: null,
      hintsUsed: 0,
      isGenerating: false,
      isGrading: false,
      startTime: null,

      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
      setUserAnswer: (answer) => set({ userAnswer: answer }),
      setGradingResult: (result) => set({ gradingResult: result }),
      useHint: () => set((state) => ({ hintsUsed: Math.min(state.hintsUsed + 1, 3) })),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setIsGrading: (grading) => set({ isGrading: grading }),
      startTimer: () => set({ startTime: Date.now() }),
      getElapsedTime: () => {
        const { startTime } = get()
        return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
      },
      reset: () =>
        set({
          currentQuiz: null,
          userAnswer: '',
          gradingResult: null,
          hintsUsed: 0,
          isGenerating: false,
          isGrading: false,
          startTime: null,
        }),
    }),
    {
      name: 'codetraining-quiz',
      version: 1,
      partialize: (state) => ({
        currentQuiz: state.currentQuiz,
        userAnswer: state.userAnswer,
        hintsUsed: state.hintsUsed,
        startTime: state.startTime,
      }),
    }
  )
)
