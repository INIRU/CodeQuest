import type { AIPreset } from '@/types'
import { useSettingsStore } from '@/stores/useSettingsStore'

export interface Message {
  role: string
  content: string
}

export interface BuiltRequest {
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

/**
 * Extract a nested value from an object by dot-bracket path.
 * E.g. "choices[0].message.content" -> obj.choices[0].message.content
 */
export function extractByPath(obj: unknown, path: string): unknown {
  // Convert bracket notation to dots: "choices[0].message" -> "choices.0.message"
  const normalized = path.replace(/\[(\d+)\]/g, '.$1')
  const keys = normalized.split('.')

  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Build a fetch-ready request from an AI preset and messages.
 */
export function buildRequest(
  preset: Omit<AIPreset, 'name'>,
  messages: Message[],
): BuiltRequest {
  // Replace {{KEY}} in URL
  const url = preset.url.replace(/\{\{KEY\}\}/g, preset.apiKey)

  // Replace {{KEY}} in all header values
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(preset.headers)) {
    headers[k] = v.replace(/\{\{KEY\}\}/g, preset.apiKey)
  }

  // Replace {{MESSAGES}} and {{PROMPT}} in body template
  const messagesJson = JSON.stringify(messages)
  const promptText = messages.map((m) => m.content).join('\n\n')

  // For {{MESSAGES}}: replace the JSON-stringified placeholder with actual JSON array
  // The template may have "{{MESSAGES}}" (with quotes) or {{MESSAGES}} (without)
  let body = preset.bodyTemplate.replace(/"?\{\{MESSAGES\}\}"?/g, messagesJson)

  // For {{PROMPT}}: replace with JSON-escaped string (keep surrounding quotes if present)
  const promptJsonString = JSON.stringify(promptText)
  // If the template has "{{PROMPT}}" (with quotes), replace with the JSON string (which includes quotes)
  // If it has {{PROMPT}} without quotes, replace with the raw string
  body = body.replace(/"\{\{PROMPT\}\}"/g, promptJsonString)
  body = body.replace(/\{\{PROMPT\}\}/g, promptText)

  return {
    url,
    method: preset.method,
    headers,
    body,
  }
}

/**
 * Call an AI API using a preset configuration.
 */
export async function callAI(
  preset: AIPreset,
  messages: Message[],
  timeout = 600_000,
): Promise<{ raw: unknown; text: string }> {
  const request = buildRequest(preset, messages)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    // Apply CORS proxy if configured
    const corsProxy = useSettingsStore.getState().corsProxyUrl
    const targetUrl = corsProxy
      ? `${corsProxy}${corsProxy.endsWith('?') || corsProxy.endsWith('=') ? '' : '/'}${request.url}`
      : request.url

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const raw: unknown = await response.json()
    const extracted = extractByPath(raw, preset.responsePath)

    if (typeof extracted !== 'string') {
      throw new Error(
        `Failed to extract text from AI response at path "${preset.responsePath}". Got: ${typeof extracted}`,
      )
    }

    return { raw, text: extracted }
  } finally {
    clearTimeout(timer)
  }
}

const KNOWN_PATHS = [
  'choices[0].message.content',
  'content[0].text',
  'message.content',
  'candidates[0].content.parts[0].text',
  'response',
  'output',
  'result',
  'text',
] as const

/**
 * Try known response paths and return the first that resolves to a non-empty string.
 */
export function autoDetectResponsePath(responseJson: unknown): string | null {
  for (const path of KNOWN_PATHS) {
    const value = extractByPath(responseJson, path)
    if (typeof value === 'string' && value.length > 0) {
      return path
    }
  }
  return null
}
