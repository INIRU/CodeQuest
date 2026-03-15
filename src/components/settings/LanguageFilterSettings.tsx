import { Badge } from '@/components/ui'
import { useSettingsStore } from '@/stores/useSettingsStore'

const LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'java',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'swift',
  'kotlin',
  'php',
]

export default function LanguageFilterSettings() {
  const languageFilter = useSettingsStore((s) => s.languageFilter)
  const setLanguageFilter = useSettingsStore((s) => s.setLanguageFilter)

  function toggleLanguage(lang: string) {
    if (languageFilter.includes(lang)) {
      setLanguageFilter(languageFilter.filter((l) => l !== lang))
    } else {
      setLanguageFilter([...languageFilter, lang])
    }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
        Language Filter
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
        Select languages to filter repositories in Explore. Leave empty to show all.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8,
        }}
      >
        {LANGUAGES.map((lang) => (
          <Badge
            key={lang}
            active={languageFilter.includes(lang)}
            onClick={() => toggleLanguage(lang)}
            style={{
              justifyContent: 'center',
              textTransform: 'capitalize',
              padding: '8px 12px',
            }}
          >
            {lang}
          </Badge>
        ))}
      </div>
    </section>
  )
}
