import { useSettingsStore } from '@/stores/useSettingsStore'
import en from './translations/en'
import ko from './translations/ko'

const translations = { en, ko } as const

type TranslationKeys = typeof en

// Get nested value by dot path
function getByPath(obj: Record<string, unknown>, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return typeof result === 'string' ? result : path
}

export function useTranslation() {
  const language = useSettingsStore((s) => s.language)
  const t = translations[language] || translations.ko

  function translate(key: string, params?: Record<string, string | number>): string {
    let text = getByPath(t as unknown as Record<string, unknown>, key)
    if (typeof text !== 'string') return key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return text
  }

  return { t: translate, language }
}

export type { TranslationKeys }
