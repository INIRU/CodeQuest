export type QuizType = 'explain' | 'fill-blank' | 'code' | 'bug-hunt' | 'code-review' | 'output-prediction'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface QuizBase {
  id: string
  type: QuizType
  question: string
  code: string
  language: string
  difficulty: Difficulty
  hints: { variables: Record<string, string>; functions: Record<string, string> }
  hintLevels: { level2: string; level3: string }
  explanation: string
  sourceRepo: string
  sourceFile: string
}

export interface ExplainQuiz extends QuizBase {
  type: 'explain'
  answer: { referenceAnswer: string; keyPoints: string[] }
}

export interface FillBlankQuiz extends QuizBase {
  type: 'fill-blank'
  answer: { blanks: string[]; blankPositions: number[] }
}

export interface CodeQuiz extends QuizBase {
  type: 'code'
  answer: { referenceSolution: string; requirements: string[] }
}

export interface BugHuntQuiz extends QuizBase {
  type: 'bug-hunt'
  answer: { correctCode: string; bugs: Array<{ line: number; description: string }> }
}

export interface CodeReviewQuiz extends QuizBase {
  type: 'code-review'
  answer: {
    improvements: Array<{
      category: string
      description: string
      severity: 'low' | 'medium' | 'high'
    }>
  }
}

export interface OutputPredictionQuiz extends QuizBase {
  type: 'output-prediction'
  answer: { expectedOutput: string; acceptableVariations: string[] }
}

export type Quiz =
  | ExplainQuiz
  | FillBlankQuiz
  | CodeQuiz
  | BugHuntQuiz
  | CodeReviewQuiz
  | OutputPredictionQuiz

export interface GradingResult {
  score: number
  feedback: string
  details: Array<{ point: string; correct: boolean; comment: string }>
  correctAnswer: string
}

export interface QuizHistory {
  id: string
  date: string
  type: QuizType
  language: string
  difficulty: Difficulty
  score: number
  rawScore: number
  hintsUsed: number
  sourceRepo: string
  sourceFile: string
  timeSpent: number
}

export interface Stats {
  totalSolved: number
  byLanguage: Record<string, number>
  byType: Record<QuizType, number>
  averageScore: number
  currentStreak: number
  bestStreak: number
}

export interface AIPreset {
  name: string
  url: string
  method: string
  headers: Record<string, string>
  apiKey: string
  bodyTemplate: string
  responsePath: string
}

export interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
  updated_at: string
}

export interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  size?: number
}
