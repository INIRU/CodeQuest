import type { Quiz, QuizType, Difficulty } from '@/types'
import type { LearningStep } from '@/services/learning'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { callAI } from './ai'
import type { Message } from './ai'

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

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()

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

function extractJsonArrayFromResponse(text: string): unknown[] {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()

  const startBracket = raw.indexOf('[')
  const endBracket = raw.lastIndexOf(']')
  if (startBracket !== -1 && endBracket > startBracket) {
    const arrayStr = raw.slice(startBracket, endBracket + 1)
    try {
      const parsed = JSON.parse(arrayStr)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // fall through
    }
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return [parsed]
  } catch (err) {
    throw new Error(
      `Failed to parse JSON array from AI response: ${err instanceof Error ? err.message : String(err)}\n\nRaw response:\n${text}`,
    )
  }
}

/**
 * Generate a quick quiz without GitHub code — AI creates the code snippet.
 */
export async function generateQuickQuiz(
  language: string,
  quizType: QuizType,
  difficulty: Difficulty,
  topic?: string,
): Promise<Quiz> {
  const { presets, activePresetKey, language: uiLang } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const schemaHint = SCHEMA_HINTS[quizType]
  const langInstruction = uiLang === 'ko'
    ? 'All text fields (question, hints, explanation, feedback) MUST be written in Korean.'
    : 'All text fields (question, hints, explanation, feedback) MUST be written in English.'

  const topicDesc = topic ? topic : 'a common programming concept'

  const systemMessage: Message = {
    role: 'system',
    content: `You are a coding quiz generator. Create a ${language} code snippet about ${topicDesc} and generate a ${quizType} quiz from it.
${langInstruction}
Difficulty: ${difficulty}
You MUST respond with ONLY a valid JSON object matching this schema:
${schemaHint}
The "code" field should contain the code snippet you created.`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Create a ${language} code snippet about ${topicDesc} and generate a ${quizType} quiz (${difficulty} difficulty) from it.

Respond with only the JSON quiz object. ${uiLang === 'ko' ? 'All text must be in Korean.' : ''}`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  const parsed = extractJsonFromResponse(text) as Record<string, unknown>

  return {
    ...parsed,
    id: crypto.randomUUID(),
    language,
    sourceRepo: 'AI Generated',
    sourceFile: topic ? `${language}/${topic}` : language,
  } as Quiz
}

/**
 * Generate multiple quick quizzes without GitHub code.
 */
export async function generateQuickMultipleQuizzes(
  language: string,
  quizType: QuizType,
  difficulty: Difficulty,
  count: number,
  topic?: string,
): Promise<Quiz[]> {
  if (count <= 1) {
    const quiz = await generateQuickQuiz(language, quizType, difficulty, topic)
    return [quiz]
  }

  const { presets, activePresetKey, language: uiLang } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const schemaHint = SCHEMA_HINTS[quizType]
  const langInstruction = uiLang === 'ko'
    ? 'All text fields (question, hints, explanation, feedback) MUST be written in Korean.'
    : 'All text fields (question, hints, explanation, feedback) MUST be written in English.'

  const topicDesc = topic ? topic : 'common programming concepts'

  const systemMessage: Message = {
    role: 'system',
    content: `You are a coding quiz generator. Create ${count} different ${language} code snippets about ${topicDesc} and generate a ${quizType} quiz from each.
${langInstruction}
Difficulty: ${difficulty}
Each question should use a different code snippet and cover a different aspect of the topic.
You MUST respond with ONLY a valid JSON array of ${count} quiz objects. Each object must match this schema:
${schemaHint}
The "code" field in each object should contain the code snippet you created for that question.`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Create ${count} different ${language} code snippets about ${topicDesc} and generate ${count} separate ${quizType} quiz questions (${difficulty} difficulty). Each should cover a different aspect.

Respond with only a JSON array of ${count} quiz objects. ${uiLang === 'ko' ? 'All text must be in Korean.' : ''}`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  const parsedArray = extractJsonArrayFromResponse(text)

  return parsedArray.map((parsed) => ({
    ...(parsed as Record<string, unknown>),
    id: crypto.randomUUID(),
    language,
    sourceRepo: 'AI Generated',
    sourceFile: topic ? `${language}/${topic}` : language,
  })) as Quiz[]
}

/**
 * Generate homework quizzes from a learning step using the main quiz system.
 * Creates coding quizzes (same 6 types) based on the step's topics and description.
 */
export async function generateHomeworkFromStep(
  step: LearningStep,
  quizType: QuizType,
  difficulty: Difficulty,
  count: number,
): Promise<Quiz[]> {
  const { presets, activePresetKey, language: uiLang } = useSettingsStore.getState()
  const preset = presets[activePresetKey]
  if (!preset) {
    throw new Error(`No AI preset found for key "${activePresetKey}"`)
  }

  const schemaHint = SCHEMA_HINTS[quizType]
  const langInstruction = uiLang === 'ko'
    ? 'All text fields (question, hints, explanation, feedback) MUST be written in Korean.'
    : 'All text fields (question, hints, explanation, feedback) MUST be written in English.'

  const topicList = step.topics.join(', ')
  const contextDesc = `Learning Step: "${step.title}"\nDescription: ${step.description}\nTopics: ${topicList}\nHomework: ${step.homework}`

  if (count <= 1) {
    const systemMessage: Message = {
      role: 'system',
      content: `You are a coding quiz generator for a learning platform. Based on a learning step's context, create a code snippet and generate a ${quizType} quiz that teaches the concepts described.
${langInstruction}
Difficulty: ${difficulty}
The quiz should help the student practice and understand the topics covered in their learning step.
You MUST respond with ONLY a valid JSON object matching this schema:
${schemaHint}
The "code" field should contain a relevant code snippet you created that demonstrates the concepts.`,
    }

    const userMessage: Message = {
      role: 'user',
      content: `Create a ${quizType} coding quiz (${difficulty} difficulty) based on this learning context:

${contextDesc}

Generate a code snippet that demonstrates these concepts and create a quiz from it.
Respond with only the JSON quiz object. ${uiLang === 'ko' ? 'All text must be in Korean.' : ''}`,
    }

    const { text } = await callAI(preset, [systemMessage, userMessage])
    const parsed = extractJsonFromResponse(text) as Record<string, unknown>

    return [{
      ...parsed,
      id: crypto.randomUUID(),
      language: detectLanguageFromTopics(step.topics),
      sourceRepo: 'Learning Mode',
      sourceFile: step.title,
    } as Quiz]
  }

  const systemMessage: Message = {
    role: 'system',
    content: `You are a coding quiz generator for a learning platform. Based on a learning step's context, create ${count} different code snippets and generate a ${quizType} quiz from each.
${langInstruction}
Difficulty: ${difficulty}
Each question should cover a different aspect of the topics and help the student practice the concepts.
You MUST respond with ONLY a valid JSON array of ${count} quiz objects. Each object must match this schema:
${schemaHint}
The "code" field in each object should contain a relevant code snippet you created.`,
  }

  const userMessage: Message = {
    role: 'user',
    content: `Create ${count} different ${quizType} coding quizzes (${difficulty} difficulty) based on this learning context:

${contextDesc}

Each quiz should cover a different aspect of these topics. Generate code snippets that demonstrate the concepts.
Respond with only a JSON array of ${count} quiz objects. ${uiLang === 'ko' ? 'All text must be in Korean.' : ''}`,
  }

  const { text } = await callAI(preset, [systemMessage, userMessage])
  const parsedArray = extractJsonArrayFromResponse(text)
  const language = detectLanguageFromTopics(step.topics)

  return parsedArray.map((parsed) => ({
    ...(parsed as Record<string, unknown>),
    id: crypto.randomUUID(),
    language,
    sourceRepo: 'Learning Mode',
    sourceFile: step.title,
  })) as Quiz[]
}

/**
 * Try to detect a programming language from topics.
 * Falls back to 'javascript' if none detected.
 */
function detectLanguageFromTopics(topics: string[]): string {
  const languageMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    'c++': 'cpp',
    cpp: 'cpp',
    'c#': 'csharp',
    csharp: 'csharp',
    go: 'go',
    golang: 'go',
    rust: 'rust',
    ruby: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    react: 'javascript',
    vue: 'javascript',
    angular: 'typescript',
    node: 'javascript',
    nodejs: 'javascript',
    deno: 'typescript',
    html: 'html',
    css: 'css',
    sql: 'sql',
  }

  const joined = topics.join(' ').toLowerCase()
  for (const [keyword, lang] of Object.entries(languageMap)) {
    if (joined.includes(keyword)) return lang
  }
  return 'javascript'
}
