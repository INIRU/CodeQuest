import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LearningPlan } from '@/services/learning'

interface LearningState {
  plans: LearningPlan[]
  activePlanId: string | null

  addPlan: (plan: LearningPlan) => void
  deletePlan: (id: string) => void
  setActivePlan: (id: string | null) => void
  completeStep: (planId: string, stepId: string) => void
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      plans: [],
      activePlanId: null,

      addPlan: (plan) =>
        set((state) => ({
          plans: [plan, ...state.plans],
          activePlanId: plan.id,
        })),

      deletePlan: (id) =>
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
          activePlanId: state.activePlanId === id ? null : state.activePlanId,
        })),

      setActivePlan: (id) => set({ activePlanId: id }),

      completeStep: (planId, stepId) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  steps: plan.steps.map((step) =>
                    step.id === stepId ? { ...step, completed: true } : step,
                  ),
                }
              : plan,
          ),
        })),
    }),
    {
      name: 'codetraining-learning',
      version: 1,
    },
  ),
)
