import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIPreset } from '@/types'

interface SettingsState {
  theme: 'dark' | 'light'
  language: 'ko' | 'en'
  languageFilter: string[]
  githubPat: string
  activePresetKey: string
  presets: Record<string, AIPreset>

  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setLanguage: (lang: 'ko' | 'en') => void
  setLanguageFilter: (languages: string[]) => void
  setGithubPat: (pat: string) => void
  setActivePresetKey: (key: string) => void
  updatePreset: (key: string, preset: Partial<AIPreset>) => void
  addPreset: (key: string, preset: AIPreset) => void
  deletePreset: (key: string) => void
}

const defaultPresets: Record<string, AIPreset> = {
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer {{KEY}}' },
    apiKey: '',
    bodyTemplate: '{"model":"gpt-4o-mini","messages":{{MESSAGES}},"temperature":0.7}',
    responsePath: 'choices[0].message.content',
  },
  claude: {
    name: 'Claude (Proxy required)',
    url: 'https://api.anthropic.com/v1/messages',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': '{{KEY}}', 'anthropic-version': '2023-06-01' },
    apiKey: '',
    bodyTemplate: '{"model":"claude-sonnet-4-20250514","max_tokens":4096,"messages":{{MESSAGES}}}',
    responsePath: 'content[0].text',
  },
  gemini: {
    name: 'Gemini (Proxy required)',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={{KEY}}',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: '{"contents":[{"parts":[{"text":{{PROMPT}}}]}]}',
    responsePath: 'candidates[0].content.parts[0].text',
  },
  ollama: {
    name: 'Ollama (Local)',
    url: 'http://localhost:11434/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: '{"model":"llama3","messages":{{MESSAGES}}}',
    responsePath: 'message.content',
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'ko',
      languageFilter: [],
      githubPat: '',
      activePresetKey: 'openai',
      presets: defaultPresets,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setLanguage: (lang) => set({ language: lang }),
      setLanguageFilter: (languages) => set({ languageFilter: languages }),
      setGithubPat: (pat) => set({ githubPat: pat }),
      setActivePresetKey: (key) => set({ activePresetKey: key }),
      updatePreset: (key, preset) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [key]: { ...state.presets[key], ...preset },
          },
        })),
      addPreset: (key, preset) =>
        set((state) => ({
          presets: { ...state.presets, [key]: preset },
          activePresetKey: key,
        })),
      deletePreset: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.presets
          return {
            presets: rest,
            activePresetKey: state.activePresetKey === key ? 'openai' : state.activePresetKey,
          }
        }),
    }),
    {
      name: 'codetraining-settings',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          return { ...(persisted as Record<string, unknown>), presets: defaultPresets }
        }
        return persisted as Record<string, unknown>
      },
    }
  )
)
