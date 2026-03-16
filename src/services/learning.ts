import { useSettingsStore } from '@/stores/useSettingsStore'
import { callAI } from './ai'
import type { Message } from './ai'

export interface LearningStep {
  id: string
  title: string
  description: string
  topics: string[]
  homework: string
  estimatedMinutes: number
  completed: boolean
}

export interface LearningPlan {
  id: string
  title: string
  description: string
  goal: string
  steps: LearningStep[]
  createdAt: string
}

export interface HomeworkQuiz {
  question: string
  type: 'multiple-choice' | 'short-answer' | 'code'
  options?: string[]
  answer: string
  explanation: string
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

function extractJsonArray<T>(text: string): T[] {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()

  const startBracket = raw.indexOf('[')
  const endBracket = raw.lastIndexOf(']')
  if (startBracket !== -1 && endBracket > startBracket) {
    const arrayStr = raw.slice(startBracket, endBracket + 1)
    try {
      const parsed = JSON.parse(arrayStr)
      if (Array.isArray(parsed)) return parsed as T[]
    } catch {
      // fall through
    }
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as T[]
    return [parsed] as T[]
  } catch (err) {
    throw new Error(
      `Failed to parse JSON array from AI response: ${err instanceof Error ? err.message : String(err)}\n\nRaw response:\n${text}`,
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
      },
    ],
  },
  null,
  2,
)

const QUIZ_SCHEMA = JSON.stringify(
  [
    {
      question: 'Question text',
      type: 'multiple-choice',
      options: ['A', 'B', 'C', 'D'],
      answer: 'The correct answer',
      explanation: 'Why this is correct',
    },
  ],
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
    steps: parsed.steps.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
      completed: false,
    })),
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
    steps: parsed.steps.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
      completed: false,
    })),
    createdAt: new Date().toISOString(),
  }
}

export async function generateHomeworkQuiz(
  step: LearningStep,
  language: string,
): Promise<HomeworkQuiz[]> {
  const { presets, activePresetKey } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const langInstruction =
    language === 'ko'
      ? 'All text fields MUST be written in Korean.'
      : 'All text fields MUST be written in English.'

  const systemMessage: Message = {
    role: 'system',
    content: `You are an expert programming educator. You MUST respond with ONLY a valid JSON array. Do NOT include any text before or after the JSON. Do NOT wrap it in markdown code blocks.

${langInstruction}

Generate 3-5 quiz questions based on a learning step's topics and homework. Mix question types: multiple-choice, short-answer, and code challenges.

The JSON must match this exact schema (an array of quiz objects):
${QUIZ_SCHEMA}`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Generate quiz questions for this learning step:
Title: ${step.title}
Description: ${step.description}
Topics: ${step.topics.join(', ')}
Homework: ${step.homework}

Create 3-5 quiz questions. ${language === 'ko' ? 'All text must be in Korean.' : ''}`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  return extractJsonArray<HomeworkQuiz>(text)
}
