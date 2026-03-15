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

  // Series support
  quizSeries: Quiz[]
  currentIndex: number
  seriesGradingResults: (GradingResult | null)[]

  setCurrentQuiz: (quiz: Quiz | null) => void
  setUserAnswer: (answer: string) => void
  setGradingResult: (result: GradingResult | null) => void
  useHint: () => void
  setIsGenerating: (generating: boolean) => void
  setIsGrading: (grading: boolean) => void
  startTimer: () => void
  getElapsedTime: () => number
  reset: () => void

  // Series actions
  setQuizSeries: (quizzes: Quiz[]) => void
  nextQuiz: () => void
  prevQuiz: () => void
  goToQuiz: (index: number) => void
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

      // Series support
      quizSeries: [],
      currentIndex: 0,
      seriesGradingResults: [],

      setCurrentQuiz: (quiz) => set({
        currentQuiz: quiz,
        userAnswer: '',
        gradingResult: null,
        hintsUsed: 0,
        isGrading: false,
        startTime: quiz ? Date.now() : null,
        // Clear series when setting a single quiz directly
        quizSeries: [],
        currentIndex: 0,
        seriesGradingResults: [],
      }),
      setUserAnswer: (answer) => set({ userAnswer: answer }),
      setGradingResult: (result) => {
        const { quizSeries, currentIndex, seriesGradingResults } = get()
        if (quizSeries.length > 1) {
          const updated = [...seriesGradingResults]
          updated[currentIndex] = result
          set({ gradingResult: result, seriesGradingResults: updated })
        } else {
          set({ gradingResult: result })
        }
      },
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
          quizSeries: [],
          currentIndex: 0,
          seriesGradingResults: [],
        }),

      // Series actions
      setQuizSeries: (quizzes) => set({
        quizSeries: quizzes,
        currentIndex: 0,
        currentQuiz: quizzes[0] ?? null,
        userAnswer: '',
        gradingResult: null,
        hintsUsed: 0,
        isGrading: false,
        startTime: quizzes.length > 0 ? Date.now() : null,
        seriesGradingResults: quizzes.map(() => null),
      }),

      nextQuiz: () => {
        const { quizSeries, currentIndex } = get()
        const nextIndex = currentIndex + 1
        if (nextIndex < quizSeries.length) {
          const nextGrading = get().seriesGradingResults[nextIndex] ?? null
          set({
            currentIndex: nextIndex,
            currentQuiz: quizSeries[nextIndex],
            userAnswer: '',
            gradingResult: nextGrading,
            hintsUsed: 0,
            isGrading: false,
            startTime: Date.now(),
          })
        }
      },

      prevQuiz: () => {
        const { quizSeries, currentIndex } = get()
        const prevIndex = currentIndex - 1
        if (prevIndex >= 0) {
          const prevGrading = get().seriesGradingResults[prevIndex] ?? null
          set({
            currentIndex: prevIndex,
            currentQuiz: quizSeries[prevIndex],
            userAnswer: '',
            gradingResult: prevGrading,
            hintsUsed: 0,
            isGrading: false,
            startTime: Date.now(),
          })
        }
      },

      goToQuiz: (index) => {
        const { quizSeries } = get()
        if (index >= 0 && index < quizSeries.length) {
          const targetGrading = get().seriesGradingResults[index] ?? null
          set({
            currentIndex: index,
            currentQuiz: quizSeries[index],
            userAnswer: '',
            gradingResult: targetGrading,
            hintsUsed: 0,
            isGrading: false,
            startTime: Date.now(),
          })
        }
      },
    }),
    {
      name: 'codetraining-quiz',
      version: 2,
      partialize: (state) => ({
        currentQuiz: state.currentQuiz,
        userAnswer: state.userAnswer,
        hintsUsed: state.hintsUsed,
        startTime: state.startTime,
        quizSeries: state.quizSeries,
        currentIndex: state.currentIndex,
        seriesGradingResults: state.seriesGradingResults,
      }),
    }
  )
)
