import { useSettingsStore } from '@/stores/useSettingsStore'
import { callAI } from './ai'
import type { Message } from './ai'

export interface GlossaryTerm {
  term: string
  definition: string
}

export interface LearningStep {
  id: string
  title: string
  description: string
  topics: string[]
  homework: string
  estimatedMinutes: number
  completed: boolean
  glossary: GlossaryTerm[]
}

export interface LearningPlan {
  id: string
  title: string
  description: string
  goal: string
  steps: LearningStep[]
  createdAt: string
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) return text.slice(start, end + 1)

  return text.trim()
}

function parseJsonResponse<T>(text: string): T {
  const jsonString = extractJson(text)
  try {
    return JSON.parse(jsonString) as T
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from AI response: ${err instanceof Error ? err.message : String(err)}\n\nRaw response:\n${text}`,
    )
  }
}

const PLAN_SCHEMA = JSON.stringify(
  {
    title: 'Learning Plan Title',
    description: 'Brief description of the plan',
    steps: [
      {
        title: 'Step title',
        description: 'What the learner will study',
        topics: ['topic1', 'topic2'],
        homework: 'A practical assignment for this step',
        estimatedMinutes: 30,
        glossary: [
          { term: 'Technical term', definition: 'Simple explanation for beginners' },
        ],
      },
    ],
  },
  null,
  2,
)

export async function generateLearningPlanFromGoal(
  goal: string,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
): Promise<LearningPlan> {
  const { presets, activePresetKey, language: uiLang } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const langInstruction =
    uiLang === 'ko'
      ? 'All text fields MUST be written in Korean.'
      : 'All text fields MUST be written in English.'

  const systemMessage: Message = {
    role: 'system',
    content: `You are an expert programming educator and curriculum designer. You MUST respond with ONLY a valid JSON object. Do NOT include any text before or after the JSON. Do NOT wrap it in markdown code blocks.

${langInstruction}

Create a comprehensive, step-by-step learning plan for a student. The plan should be practical and actionable, with clear homework assignments at each step. Include 5-10 steps depending on the scope of the goal.

IMPORTANT: For each step, include a 'glossary' array with definitions of technical terms that beginners might not know. Explain each term in simple, plain language as if explaining to someone who has never programmed before. Include at least 3-5 terms per step.

The JSON must match this exact schema:
${PLAN_SCHEMA}`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Create a learning plan for the following goal:
Goal: "${goal}"
Current skill level: ${skillLevel}

Create a structured curriculum with practical steps, each with topics and homework. ${uiLang === 'ko' ? 'All text must be in Korean.' : ''}`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  const parsed = parseJsonResponse<{ title: string; description: string; steps: Array<{ title: string; description: string; topics: string[]; homework: string; estimatedMinutes: number }> }>(text)

  return {
    id: crypto.randomUUID(),
    title: parsed.title,
    description: parsed.description,
    goal,
    steps: parsed.steps.map((step: any) => ({
      ...step,
      id: crypto.randomUUID(),
      completed: false,
      glossary: Array.isArray(step.glossary) ? step.glossary : [],
    } as LearningStep)),
    createdAt: new Date().toISOString(),
  }
}

export async function generateLearningPlanFromUrl(
  url: string,
  context?: string,
): Promise<LearningPlan> {
  const { presets, activePresetKey, language: uiLang } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const langInstruction =
    uiLang === 'ko'
      ? 'All text fields MUST be written in Korean.'
      : 'All text fields MUST be written in English.'

  const systemMessage: Message = {
    role: 'system',
    content: `You are an expert programming educator and curriculum designer. You MUST respond with ONLY a valid JSON object. Do NOT include any text before or after the JSON. Do NOT wrap it in markdown code blocks.

${langInstruction}

Based on a documentation URL, create a comprehensive study plan. Infer the content from the URL path and domain. Create a structured learning path that covers the key concepts of the documentation.

Include 5-10 steps depending on the scope of the documentation. Each step should build on the previous one.

IMPORTANT: For each step, include a 'glossary' array with definitions of technical terms that beginners might not know. Explain each term in simple, plain language as if explaining to someone who has never programmed before. Include at least 3-5 terms per step.

The JSON must match this exact schema:
${PLAN_SCHEMA}`,
  }

  const contextLine = context ? `\nAdditional context: ${context}` : ''

  const userMessage: Message = {
    role: 'user',
    content: `Based on this documentation URL: ${url}${contextLine}

Create a study plan that covers the key topics from this documentation. Infer the content from the URL path and domain. ${uiLang === 'ko' ? 'All text must be in Korean.' : ''}`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  const parsed = parseJsonResponse<{ title: string; description: string; steps: Array<{ title: string; description: string; topics: string[]; homework: string; estimatedMinutes: number }> }>(text)

  return {
    id: crypto.randomUUID(),
    title: parsed.title,
    description: parsed.description,
    goal: url,
    steps: parsed.steps.map((step: any) => ({
      ...step,
      id: crypto.randomUUID(),
      completed: false,
      glossary: Array.isArray(step.glossary) ? step.glossary : [],
    } as LearningStep)),
    createdAt: new Date().toISOString(),
  }
}

