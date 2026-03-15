# CodeTraining Platform — Design Spec

## Overview

GitHub의 트렌딩 코드와 사용자 본인의 레포 코드를 기반으로 AI가 다양한 코딩 문제를 생성하고 채점하는 웹 애플리케이션.

## Tech Stack

- **Vite + React 18** (TypeScript)
- **React Router** (Hash Router) — 클라이언트 라우팅 (GitHub Pages 호환)
- **Tailwind CSS** — 스타일링
- **Monaco Editor** (`@monaco-editor/react`) — 코드 에디터
- **Zustand** (persist middleware with version + migrate) — 상태 관리 + localStorage 자동 동기화
- **Framer Motion** — 애니메이션
- **Radix UI** — 접근성 좋은 Dialog, Dropdown, Tabs, Toast 등
- **Lucide React** — 아이콘 (이모지 사용 금지)
- **GitHub Pages** — 배포

## Target Users

모든 레벨: 코딩 초보자, 취준생, 실무 개발자

## Project Structure

```
src/
├── components/
│   ├── editor/          # Monaco 에디터 래퍼
│   ├── quiz/            # 문제 유형별 컴포넌트 (6가지)
│   ├── github/          # GitHub 트렌딩/레포 브라우저
│   ├── settings/        # AI API 설정, GitHub PAT 설정
│   └── ui/              # 공통 UI (버튼, 카드, 모달 등)
├── stores/              # Zustand 스토어 (설정, 진행도, 문제)
├── services/
│   ├── github.ts        # GitHub API 클라이언트
│   ├── ai.ts            # 범용 AI API 클라이언트
│   └── quiz-generator.ts # AI에게 문제 생성 요청 + 파싱
├── types/               # TypeScript 타입 정의
├── hooks/               # 커스텀 훅
├── pages/               # 라우트별 페이지
└── utils/               # 유틸리티 함수
```

## Pages & Routes

Hash Router 사용 (GitHub Pages에서 새로고침 시 404 방지).

```
#/                   → 대시보드 (홈)
#/explore            → GitHub 트렌딩 코드 탐색
#/my-repos           → 내 GitHub 레포 목록/코드 탐색
#/quiz/:id           → 문제 풀기 화면
#/history            → 풀이 기록 & 통계
#/settings           → AI API 설정, GitHub PAT, 언어 필터
```

## Screen Flow

```
[대시보드]
  ├─ 오늘의 추천 문제 (최근 트렌딩 레포에서 랜덤 선택, 24시간 캐시)
  ├─ 최근 풀이 이어하기
  └─ 언어별 진행률 요약

[탐색 (Explore)]
  ├─ 언어 필터 (Python, JS, Go 등) — 다중 선택
  ├─ 트렌딩 레포 카드 목록
  └─ 레포 클릭 → 파일 트리 → 코드 선택 → "문제 생성" 버튼

[문제 풀기 (Quiz)]
  ├─ 좌: 문제 설명 + 변수/함수 힌트 패널
  ├─ 우: Monaco 에디터 (답안 작성)
  ├─ 하단: 제출 → AI 채점 → 결과 & 해설
  └─ 문제 유형 탭 (6가지)

[내 레포 (My Repos)]
  ├─ PAT으로 내 레포 목록 불러오기
  └─ 코드 선택 → 문제 생성 (Explore와 동일 흐름)
```

## AI Universal API Connector

사용자가 직접 API 요청을 설정하는 범용 AI 커넥터.

### CORS 주의사항

GitHub Pages는 정적 호스팅이므로 서버 프록시가 없다.
- OpenAI API: 브라우저 CORS 허용 (직접 호출 가능)
- Anthropic API: 브라우저 CORS 차단 (프록시 필요)
- Gemini API: 브라우저 CORS 차단 (프록시 필요)
- Ollama (localhost): CORS 설정 가능 (`OLLAMA_ORIGINS=*`)
- 사용자 개인 프록시 API: CORS 설정은 사용자 책임

Settings UI에 CORS 관련 안내 문구 표시:
> "일부 AI API는 브라우저에서 직접 호출이 차단될 수 있습니다. 이 경우 CORS를 허용하는 프록시 서버를 사용하세요."

### Settings

- **URL**: API 엔드포인트
- **Method**: POST (기본)
- **Headers**: Key-Value 쌍 목록, 동적 추가/삭제 가능. `{{KEY}}` 플레이스홀더 지원
- **API Key**: 별도 필드, `{{KEY}}`로 헤더/바디에 치환 주입
- **Body Template**: Monaco Editor로 편집하는 JSON 템플릿
  - `{{MESSAGES}}`: JSON 배열로 치환 — `[{"role":"system","content":"..."},{"role":"user","content":"..."}]`
  - `{{PROMPT}}`: 모든 메시지를 단일 문자열로 합쳐서 치환 (단일 prompt 필드를 쓰는 API용)
  - 치환은 JSON-aware: 템플릿을 파싱 → 플레이스홀더 노드를 실제 값으로 교체 → 재직렬화
- **Response Path**: 응답 JSON에서 텍스트 추출 경로 (예: `choices[0].message.content`)

### Presets

| 프리셋 | URL | Header | Body | Response Path |
|--------|-----|--------|------|---------------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | `Authorization: Bearer {{KEY}}` | `{"model":"gpt-4o","messages":{{MESSAGES}}}` | `choices[0].message.content` |
| Claude (프록시 필요) | `https://api.anthropic.com/v1/messages` | `x-api-key: {{KEY}}`, `anthropic-version: 2023-06-01` | `{"model":"claude-sonnet-4-20250514","max_tokens":4096,"messages":{{MESSAGES}}}` | `content[0].text` |
| Gemini (프록시 필요) | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={{KEY}}` | — | `{"contents":{{MESSAGES}}}` | `candidates[0].content.parts[0].text` |
| Ollama | `http://localhost:11434/api/chat` | — | `{"model":"llama3","messages":{{MESSAGES}}}` | `message.content` |

### Test Feature

- "테스트 연결" 버튼으로 `{"role":"user","content":"Hello, respond with 'OK'"}` 전송
- Request 전문 표시 (URL, Headers, Body)
- Response raw JSON 전문 표시 (Monaco Editor, 읽기 전용)
- 응답 경로 자동감지: 자주 쓰는 경로(`choices[0].message.content`, `content[0].text`, `message.content`, `candidates[0].content.parts[0].text`)를 순회하여 문자열이 있는 경로 추천
- 수동 경로 입력 지원
- 파싱 결과 미리보기 패널
- HTTP 상태, 응답 시간 표시
- 에러 시 CORS 관련 도움말 자동 표시

## Quiz Types (6 Types)

### 난이도 시스템

3단계: **초급** / **중급** / **고급**
- 사용자가 문제 생성 시 선택
- AI 프롬프트에 난이도 포함 → 문제 복잡도 조절

### 1. 코드 설명하기 (explain)
- 주어진 코드가 무엇을 하는지 서술형으로 답변
- AI가 서술형 답안 평가 (0~100점)

### 2. 빈칸 맞추기 (fill-blank)
- 코드 일부를 `___`로 가리고 채우기
- 정확히 일치 비교 (클라이언트) + AI 부분점수

### 3. 직접 코딩하기 (code)
- 요구사항을 보고 코드 작성
- AI가 코드 리뷰 + 정답 코드와 로직 비교

### 4. 버그 찾기 (bug-hunt)
- 의도적으로 버그가 있는 코드에서 찾아 수정
- 수정한 코드를 AI가 원본과 비교 평가

### 5. 코드 리뷰 (code-review)
- 주어진 코드의 개선점 찾기
- AI가 사용자 리뷰 포인트 vs 실제 개선점 비교

### 6. 출력 예측 (output-prediction)
- 코드의 실행 결과를 예측
- AI가 생성 시 정답 출력을 포함, 클라이언트에서 문자열 비교 + AI 부분점수 (유사 답변 허용)

## AI Response Schema (유형별)

모든 유형 공통 필드:

```typescript
interface QuizBase {
  type: QuizType;
  question: string;
  code: string;
  hints: {
    variables: Record<string, string>;    // 변수명 → 설명
    functions: Record<string, string>;    // 함수명 → "시그니처 — 설명"
  };
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}
```

유형별 추가 필드 (discriminated union):

```typescript
// 1. 코드 설명하기
interface ExplainQuiz extends QuizBase {
  type: "explain";
  answer: {
    referenceAnswer: string;       // AI가 만든 모범 답안
    keyPoints: string[];           // 반드시 포함해야 할 핵심 포인트
  };
}

// 2. 빈칸 맞추기
interface FillBlankQuiz extends QuizBase {
  type: "fill-blank";
  answer: {
    blanks: string[];              // 각 빈칸의 정답
    blankPositions: number[];      // 코드에서 ___ 위치 (0-indexed)
  };
}

// 3. 직접 코딩하기
interface CodeQuiz extends QuizBase {
  type: "code";
  answer: {
    referenceSolution: string;     // AI가 만든 모범 답안 코드
    requirements: string[];        // 충족해야 할 요구사항 목록
  };
}

// 4. 버그 찾기
interface BugHuntQuiz extends QuizBase {
  type: "bug-hunt";
  answer: {
    correctCode: string;           // 버그가 수정된 올바른 코드
    bugs: Array<{
      line: number;
      description: string;
    }>;
  };
}

// 5. 코드 리뷰
interface CodeReviewQuiz extends QuizBase {
  type: "code-review";
  answer: {
    improvements: Array<{
      category: string;            // "성능" | "가독성" | "보안" | "버그" 등
      description: string;
      severity: "low" | "medium" | "high";
    }>;
  };
}

// 6. 출력 예측
interface OutputPredictionQuiz extends QuizBase {
  type: "output-prediction";
  answer: {
    expectedOutput: string;        // 정확한 출력 결과
    acceptableVariations: string[]; // 허용 가능한 변형 (공백 차이 등)
  };
}

type Quiz = ExplainQuiz | FillBlankQuiz | CodeQuiz | BugHuntQuiz | CodeReviewQuiz | OutputPredictionQuiz;
```

## AI Prompt Structure

### Quiz Generation Prompt

```
System: 너는 코딩 문제 출제자야. 다음 코드를 기반으로 {quizType} 유형의 문제를 JSON으로 생성해.
난이도: {difficulty}
반드시 포함: 변수 설명, 함수 시그니처 힌트, 정답, 해설.
응답은 반드시 아래 JSON 스키마를 따라야 해:
{해당 유형의 JSON 스키마}

User: 다음 코드를 분석하고 문제를 생성해:
```{language}
{selectedCode}
```
```

### Grading Prompt (채점)

```
System: 너는 코딩 문제 채점자야. 사용자의 답안을 평가하고 JSON으로 결과를 반환해.
평가 기준: 정확성, 완성도, 코드 품질 (해당되는 경우).
힌트 사용 횟수에 따른 감점은 클라이언트에서 처리하니 순수 답안 품질만 평가해.

User:
문제: {quiz.question}
원본 코드: {quiz.code}
문제 유형: {quiz.type}
모범 답안: {quiz.answer}
사용자 답안: {userAnswer}
```

### Grading Response Schema

```typescript
interface GradingResult {
  score: number;              // 0~100 (힌트 감점 전 순수 점수)
  feedback: string;           // 전반적인 피드백
  details: Array<{
    point: string;            // 평가 항목
    correct: boolean;         // 맞음/틀림
    comment: string;          // 항목별 코멘트
  }>;
  correctAnswer: string;      // 정답 공개 (제출 후)
}
```

### 최종 점수 계산 (클라이언트)

```
finalScore = gradingResult.score * hintPenalty
hintPenalty: 힌트 0개 = 1.0, 힌트 1개 = 0.8, 힌트 2개 = 0.5
```

## Hint System

- 1단계: 변수/함수 시그니처 (기본 제공, 감점 없음)
- 2단계: 로직 힌트 (버튼 클릭, penalty = 0.8)
- 3단계: 거의 정답 수준 (버튼 클릭, penalty = 0.5)

힌트 2, 3단계는 문제 생성 시 AI가 함께 생성하여 quiz 객체에 포함:

```typescript
interface QuizHints {
  level1: { variables: Record<string, string>; functions: Record<string, string> }; // 기본 제공
  level2: string;  // 로직 힌트
  level3: string;  // 거의 정답 수준 힌트
}
```

## Quiz Lifecycle

1. 사용자가 코드 선택 + 문제 유형/난이도 선택
2. `quiz-generator.ts`가 AI에게 생성 프롬프트 전송
3. AI 응답 JSON 파싱 → Quiz 객체 생성, UUID 할당
4. Quiz 객체를 `useQuizStore`에 저장
5. `#/quiz/{uuid}`로 이동
6. 사용자가 답안 작성 후 제출
7. AI에게 채점 프롬프트 전송 → GradingResult 수신
8. 힌트 감점 적용 → 최종 점수 계산
9. 결과 표시 + `useHistoryStore`에 기록 저장

## GitHub Integration

### Trending (Search API)

```
GET /search/repositories?q=stars:>100+created:>{1주전날짜}+language:{lang}&sort=stars&order=desc&per_page=20
```

- `stars:>100`과 `created:>` 필터를 함께 적용하여 최근 인기 레포 검색
- 언어 필터: 사용자 설정 기반

### My Repos

```
GET /user/repos?sort=updated&per_page=30 (PAT 필요)
```

### File Access

- 파일 트리: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- 파일 내용: `GET /repos/{owner}/{repo}/contents/{path}`
- 파일 크기 제한: 500줄 초과 시 경고, 1000줄 초과 시 상위 500줄만 표시 + 안내

### Language Filter

- 상단 필터바에서 다중 언어 선택 (토글 칩 형태)
- 트렌딩 검색, 내 레포 필터링 모두에 적용
- 선택 상태는 설정에 저장

### Code Selection UX

1. 레포 카드 클릭 → 파일 트리 사이드바 열림
2. 파일 클릭 → Monaco 읽기 전용 에디터에 코드 표시
3. 코드 선택 방법:
   - "전체 선택" 버튼 — 파일 전체 코드 사용
   - 마우스 드래그로 텍스트 선택 → 선택 영역 위에 플로팅 "이 코드로 문제 생성" 버튼 표시
4. 선택 후 → 문제 유형 + 난이도 선택 모달 → AI 문제 생성

### Rate Limiting

- GitHub Search API: 인증 없이 10req/min, PAT 있으면 30req/min
- 나머지 API: 인증 없이 60req/hr, PAT 있으면 5000req/hr
- 대응:
  - API 응답 헤더(`X-RateLimit-Remaining`)를 읽어서 잔여 횟수 UI에 표시
  - 잔여 0일 때 요청 차단 + "Rate limit 초과. {리셋 시간}에 다시 시도하세요" 안내
  - PAT 미설정 시 "GitHub Token을 설정하면 더 많은 요청이 가능합니다" 안내
  - 트렌딩 캐시를 6시간으로 늘려 API 호출 최소화

## Design

### Theme

- 다크 모드 + 라이트 모드 둘 다 지원
- 기본: 다크 모드
- Tailwind `dark:` 클래스 + CSS 변수로 테마 전환

### Dark Mode Palette

```
배경:       #0A0A0F
서피스:     #12121A
글래스:     rgba(255,255,255,0.05) + backdrop-blur-xl
Border:     rgba(255,255,255,0.08)
Primary:    #6366F1 → #8B5CF6 (인디고 → 바이올렛 그라디언트)
Success:    #10B981
Error:      #EF4444
Warning:    #F59E0B
텍스트:     #E2E8F0 (메인) / #94A3B8 (서브) / #64748B (비활성)
```

### Light Mode Palette

```
배경:       #F8FAFC
서피스:     #FFFFFF
글래스:     rgba(0,0,0,0.03) + backdrop-blur-xl
Border:     rgba(0,0,0,0.08)
Primary:    #6366F1 → #8B5CF6 (동일)
Success:    #059669
Error:      #DC2626
Warning:    #D97706
텍스트:     #0F172A (메인) / #475569 (서브) / #94A3B8 (비활성)
```

### Design Elements

- 글래스모피즘 카드 — 반투명 배경 + backdrop-blur-xl + 미세한 border
- 그라디언트 액센트 — 버튼, 프로그레스바, 활성 탭
- 부드러운 애니메이션 — Framer Motion
  - 페이지 전환: fade + slideY (200ms ease-out)
  - 카드 호버: scale(1.02) + shadow 증가
  - 결과 표시: fade-in + slideUp
  - 로딩: skeleton shimmer
- 코드 테마 — 다크: One Dark Pro / 라이트: GitHub Light
- 타이포그래피 — UI: Inter (CDN), 코드: JetBrains Mono (CDN)
- 아이콘 — Lucide React (이모지 사용 금지)
- 반응형: 데스크톱 우선, 태블릿은 사이드바 접기, 모바일은 탭 전환 (Quiz 좌우 패널 → 상하 스택)

### Design References

- GitHub Copilot 랜딩 페이지의 다크 톤
- Linear 앱의 미니멀하고 세련된 UI
- Raycast의 글래스모피즘

## Data Storage

### Zustand Stores

```
useSettingsStore.ts    # AI API 설정, GitHub PAT, 테마, 언어 필터
useQuizStore.ts        # 현재 문제, 답안, 채점 결과
useHistoryStore.ts     # 풀이 기록, 통계, 점수
useGithubStore.ts      # 트렌딩 캐시, 내 레포 목록 캐시
```

모든 스토어는 `persist` 미들웨어 사용, `version` 필드 + `migrate` 함수를 포함하여 스키마 변경 시 기존 데이터를 안전하게 마이그레이션.

### History Data Model

```typescript
interface QuizHistory {
  id: string;                // UUID
  date: string;              // ISO 8601
  type: QuizType;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  score: number;             // 최종 점수 (힌트 감점 포함)
  rawScore: number;          // AI 채점 원점수
  hintsUsed: number;
  sourceRepo: string;        // "owner/repo"
  sourceFile: string;        // "src/utils.py"
  timeSpent: number;         // 초 단위
}

interface Stats {
  totalSolved: number;
  byLanguage: Record<string, number>;
  byType: Record<QuizType, number>;
  averageScore: number;
  currentStreak: number;     // 연속 풀이 일수
  bestStreak: number;
}
```

### Caching Strategy

- GitHub 트렌딩: 6시간 캐시 (API 호출 절약)
- 내 레포 목록: 30분 캐시
- 문제 생성 결과: 풀이 완료 전까지 유지
- 캐시 타임스탬프 저장, 만료 시 자동 재요청

## Error & Loading States

### Loading

- 페이지 진입 시: 전체 skeleton shimmer
- API 호출 중: 해당 영역만 skeleton + 상단 progress bar
- AI 문제 생성 중: "문제를 생성하고 있습니다..." + 예상 소요 시간
- AI 채점 중: "답안을 평가하고 있습니다..." + spinner

### Error Handling

| 상황 | 표시 | 행동 |
|------|------|------|
| GitHub API 실패 | 에러 카드 + 재시도 버튼 | 3초 후 자동 재시도 1회 |
| GitHub Rate Limit | 잔여 횟수 0 안내 + 리셋 시간 | 요청 차단, PAT 설정 유도 |
| AI API 실패 | 에러 메시지 + 재시도 버튼 | CORS 에러 시 프록시 안내 표시 |
| AI API 타임아웃 | 30초 타임아웃 → 에러 | 재시도 버튼 |
| AI 응답 파싱 실패 | "AI 응답을 해석할 수 없습니다" | raw 응답 보기 버튼 + 재생성 버튼 |
| GitHub PAT 무효 | "토큰이 유효하지 않습니다" | Settings로 이동 유도 |
| 빈 상태 (기록 없음) | 일러스트 + "첫 문제를 풀어보세요" | Explore 페이지로 CTA |
| 빈 상태 (레포 없음) | "공개 레포가 없거나 PAT 확인" | Settings로 이동 유도 |

### AI 응답 코드 제한

- AI에게 보내는 코드는 최대 500줄 / 15000자로 제한
- 초과 시 "코드가 너무 깁니다. 일부를 선택해주세요" 안내

## Security Notes

- GitHub PAT과 AI API Key는 localStorage에 평문 저장 (개인 프로젝트 용도)
- Settings UI에 보안 안내 표시:
  - "API 키와 토큰은 이 브라우저에만 저장됩니다. 공용 컴퓨터에서는 사용을 피하세요."
  - "GitHub 토큰은 최소 권한으로 생성하세요. 권장: Fine-grained token, read-only, public repos only"
- PAT 입력 필드는 password type (마스킹), 토글로 보기 가능

## Deployment

- GitHub Pages (정적 배포)
- `vite.config.ts`에 `base: '/<repo-name>/'` 설정 (GitHub Pages 서브경로 대응)
- Hash Router 사용으로 새로고침 시 404 문제 없음
- GitHub Actions 워크플로우: push to main → `npm run build` → `dist/` 폴더를 gh-pages 브랜치에 배포
