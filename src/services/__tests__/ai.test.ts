import { describe, it, expect } from 'vitest'
import { extractByPath, buildRequest } from '../ai'
import type { AIPreset } from '@/types'

describe('extractByPath', () => {
  it('extracts nested value with dot-bracket notation', () => {
    const obj = {
      choices: [{ message: { content: 'hello world' } }],
    }
    expect(extractByPath(obj, 'choices[0].message.content')).toBe('hello world')
  })

  it('extracts from deeply nested arrays', () => {
    const obj = {
      candidates: [{ content: { parts: [{ text: 'gemini response' }] } }],
    }
    expect(
      extractByPath(obj, 'candidates[0].content.parts[0].text'),
    ).toBe('gemini response')
  })

  it('extracts top-level key', () => {
    const obj = { response: 'ollama says hi' }
    expect(extractByPath(obj, 'response')).toBe('ollama says hi')
  })

  it('returns undefined for invalid path', () => {
    const obj = { a: { b: 1 } }
    expect(extractByPath(obj, 'a.c.d')).toBeUndefined()
  })

  it('returns undefined for null object', () => {
    expect(extractByPath(null, 'a.b')).toBeUndefined()
  })

  it('returns undefined when traversing a primitive', () => {
    const obj = { a: 'string' }
    expect(extractByPath(obj, 'a.b')).toBeUndefined()
  })

  it('handles numeric dot-notation paths', () => {
    const obj = { content: [{ text: 'claude response' }] }
    expect(extractByPath(obj, 'content.0.text')).toBe('claude response')
  })
})

describe('buildRequest', () => {
  const basePreset: Omit<AIPreset, 'name'> = {
    url: 'https://api.example.com/v1/chat?key={{KEY}}',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {{KEY}}',
    },
    apiKey: 'test-api-key-123',
    bodyTemplate: JSON.stringify({
      model: 'test-model',
      messages: '{{MESSAGES}}',
      temperature: 0.7,
    }),
    responsePath: 'choices[0].message.content',
  }

  it('replaces {{KEY}} in URL', () => {
    const result = buildRequest(basePreset, [])
    expect(result.url).toBe(
      'https://api.example.com/v1/chat?key=test-api-key-123',
    )
  })

  it('replaces {{KEY}} in header values', () => {
    const result = buildRequest(basePreset, [])
    expect(result.headers['Authorization']).toBe('Bearer test-api-key-123')
    expect(result.headers['Content-Type']).toBe('application/json')
  })

  it('replaces {{MESSAGES}} with JSON array of messages', () => {
    const messages = [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hi there' },
    ]
    const result = buildRequest(basePreset, messages)
    const parsed = JSON.parse(result.body)
    expect(parsed.messages).toEqual(messages)
    expect(Array.isArray(parsed.messages)).toBe(true)
  })

  it('replaces {{PROMPT}} with concatenated message contents', () => {
    const preset: Omit<AIPreset, 'name'> = {
      url: 'https://api.example.com',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      apiKey: '',
      bodyTemplate: JSON.stringify({
        model: 'llama3',
        prompt: '{{PROMPT}}',
        stream: false,
      }),
      responsePath: 'response',
    }
    const messages = [
      { role: 'system', content: 'Be helpful' },
      { role: 'user', content: 'Explain code' },
    ]
    const result = buildRequest(preset, messages)
    const parsed = JSON.parse(result.body)
    expect(parsed.prompt).toBe('Be helpful\n\nExplain code')
  })

  it('preserves method from preset', () => {
    const result = buildRequest(basePreset, [])
    expect(result.method).toBe('POST')
  })

  it('handles preset with no {{KEY}} placeholders', () => {
    const preset: Omit<AIPreset, 'name'> = {
      url: 'http://localhost:11434/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      apiKey: '',
      bodyTemplate: JSON.stringify({ prompt: '{{PROMPT}}' }),
      responsePath: 'response',
    }
    const result = buildRequest(preset, [{ role: 'user', content: 'test' }])
    expect(result.url).toBe('http://localhost:11434/api/generate')
    const parsed = JSON.parse(result.body)
    expect(parsed.prompt).toBe('test')
  })
})
