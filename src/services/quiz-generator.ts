import type { Quiz, QuizType, Difficulty, GradingResult } from '@/types'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { callAI } from './ai'
import type { Message } from './ai'

const MAX_LINES = 500
const MAX_CHARS = 15_000

const SCHEMA_HINTS: Record<QuizType, string> = {
  explain: JSON.stringify(
    {
      type: 'explain',
      question: 'Explain what this code does',
      code: '...',
      difficulty: 'intermediate',
      hints: { variables: { varName: 'description' }, functions: { fnName: 'description' } },
      hintLevels: { level2: 'A medium hint', level3: 'A strong hint' },
      explanation: 'Detailed explanation of the code',
      answer: { referenceAnswer: 'The code does...', keyPoints: ['point1', 'point2'] },
    },
    null,
    2,
  ),
  'fill-blank': JSON.stringify(
    {
      type: 'fill-blank',
      question: 'Fill in the blanks in this code',
      code: 'code with ___ blanks',
      difficulty: 'beginner',
      hints: { variables: {}, functions: {} },
      hintLevels: { level2: 'A medium hint', level3: 'A strong hint' },
      explanation: 'Explanation of the blanks',
      answer: { blanks: ['answer1', 'answer2'], blankPositions: [3, 7] },
    },
    null,
    2,
  ),
  code: JSON.stringify(
    {
      type: 'code',
      question: 'Write a function that...',
      code: 'starter code or context',
      difficulty: 'advanced',
      hints: { variables: {}, functions: {} },
      hintLevels: { level2: 'A medium hint', level3: 'A strong hint' },
      explanation: 'Explanation of the solution',
      answer: { referenceSolution: 'function solution() {...}', requirements: ['req1', 'req2'] },
    },
    null,
    2,
  ),
  'bug-hunt': JSON.stringify(
    {
      type: 'bug-hunt',
      question: 'Find and fix the bugs in this code',
      code: 'code with bugs',
      difficulty: 'intermediate',
      hints: { variables: {}, functions: {} },
      hintLevels: { level2: 'A medium hint', level3: 'A strong hint' },
      explanation: 'Explanation of the bugs',
      answer: {
        correctCode: 'fixed code',
        bugs: [{ line: 3, description: 'Off-by-one error' }],
      },
    },
    null,
    2,
  ),
  'code-review': JSON.stringify(
    {
      type: 'code-review',
      question: 'Review this code and suggest improvements',
      code: 'code to review',
      difficulty: 'advanced',
      hints: { variables: {}, functions: {} },
      hintLevels: { level2: 'A medium hint', level3: 'A strong hint' },
      explanation: 'Explanation of improvements',
      answer: {
        improvements: [
          { category: 'performance', description: 'Use a Set instead of array', severity: 'medium' },
        ],
      },
    },
    null,
    2,
  ),
  'output-prediction': JSON.stringify(
    {
      type: 'output-prediction',
      question: 'What will this code output?',
      code: 'console.log("hello")',
      difficulty: 'beginner',
      hints: { variables: {}, functions: {} },
      hintLevels: { level2: 'A medium hint', level3: 'A strong hint' },
      explanation: 'Explanation of the output',
      answer: { expectedOutput: 'hello', acceptableVariations: ['hello\n'] },
    },
    null,
    2,
  ),
}

function truncateCode(code: string): string {
  const lines = code.split('\n')
  const truncatedLines = lines.slice(0, MAX_LINES)
  const joined = truncatedLines.join('\n')
  return joined.length > MAX_CHARS ? joined.slice(0, MAX_CHARS) : joined
}

function extractJson(text: string): string {
  // Try to find JSON in markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()

  // Try to find first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) return text.slice(start, end + 1)

  return text.trim()
}

function extractJsonFromResponse(text: string): unknown {
  const jsonString = extractJson(text)
  try {
    return JSON.parse(jsonString)
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from AI response: ${err instanceof Error ? err.message : String(err)}\n\nRaw response:\n${text}`,
    )
  }
}

/**
 * Generate a quiz from source code using the active AI preset.
 */
export async function generateQuiz(
  code: string,
  language: string,
  quizType: QuizType,
  difficulty: Difficulty,
  sourceRepo: string,
  sourceFile: string,
): Promise<Quiz> {
  const { presets, activePresetKey } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const truncatedCode = truncateCode(code)
  const schemaHint = SCHEMA_HINTS[quizType]

  const systemMessage: Message = {
    role: 'system',
    content: `You are a coding quiz generator. You MUST respond with ONLY a valid JSON object. Do NOT include any text before or after the JSON. Do NOT wrap it in markdown code blocks.

Generate a ${quizType} quiz at ${difficulty} difficulty level for ${language} code.

The JSON must match this exact schema:
${schemaHint}`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Generate a ${quizType} quiz (${difficulty} difficulty) for the following ${language} code:

\`\`\`${language}
${truncatedCode}
\`\`\`

Respond with only the JSON quiz object.`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  const parsed = extractJsonFromResponse(text) as Record<string, unknown>

  return {
    ...parsed,
    id: crypto.randomUUID(),
    language,
    sourceRepo,
    sourceFile,
  } as Quiz
}

/**
 * Grade a quiz answer using AI.
 */
export async function gradeQuiz(
  quiz: Quiz,
  userAnswer: string,
): Promise<GradingResult> {
  const { presets, activePresetKey } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const systemMessage: Message = {
    role: 'system',
    content: `You are a coding quiz grader. Grade the user's answer to a ${quiz.type} quiz.

You MUST respond with ONLY a valid JSON object matching this schema:
{
  "score": <number 0-100>,
  "feedback": "<overall feedback string>",
  "details": [{"point": "<criterion>", "correct": <boolean>, "comment": "<explanation>"}],
  "correctAnswer": "<the correct answer as a string>"
}

Do not include any explanation outside the JSON.`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Quiz type: ${quiz.type}
Difficulty: ${quiz.difficulty}
Language: ${quiz.language}

Question: ${quiz.question}

Code:
\`\`\`${quiz.language}
${quiz.code}
\`\`\`

Expected answer: ${JSON.stringify(quiz.answer)}

User's answer:
${userAnswer}

Grade the answer and respond with only the JSON grading result.`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  return extractJsonFromResponse(text) as GradingResult
}

/**
 * Calculate final score with hint penalties.
 * 0 hints = 1.0x, 1 hint = 0.8x, 2 hints = 0.5x
 */
export function calculateFinalScore(rawScore: number, hintsUsed: number): number {
  const penalties: Record<number, number> = { 0: 1.0, 1: 0.8, 2: 0.5 }
  const penalty = penalties[hintsUsed] ?? 0.5
  return Math.round(rawScore * penalty)
}
