import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIPreset } from '@/types'

interface SettingsState {
  theme: 'dark' | 'light'
  languageFilter: string[]
  githubPat: string
  activePresetKey: string
  presets: Record<string, AIPreset>

  setTheme: (theme: 'dark' | 'light') => void
  toggleTheme: () => void
  setLanguageFilter: (languages: string[]) => void
  setGithubPat: (pat: string) => void
  setActivePresetKey: (key: string) => void
  updatePreset: (key: string, preset: Partial<AIPreset>) => void
}

const defaultPresets: Record<string, AIPreset> = {
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: '{{prompt}}' }],
      temperature: 0.7,
    }),
    responsePath: 'choices.0.message.content',
  },
  claude: {
    name: 'Claude',
    url: 'https://api.anthropic.com/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    apiKey: '',
    bodyTemplate: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: '{{prompt}}' }],
    }),
    responsePath: 'content.0.text',
  },
  gemini: {
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: JSON.stringify({
      contents: [{ parts: [{ text: '{{prompt}}' }] }],
    }),
    responsePath: 'candidates.0.content.parts.0.text',
  },
  ollama: {
    name: 'Ollama (Local)',
    url: 'http://localhost:11434/api/generate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    apiKey: '',
    bodyTemplate: JSON.stringify({
      model: 'llama3',
      prompt: '{{prompt}}',
      stream: false,
    }),
    responsePath: 'response',
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      languageFilter: [],
      githubPat: '',
      activePresetKey: 'openai',
      presets: defaultPresets,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
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
    }),
    {
      name: 'codetraining-settings',
      version: 1,
    }
  )
)
