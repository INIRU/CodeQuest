# CodeQuest

GitHub 코드 기반 AI 코딩 퀴즈 플랫폼

**Live Demo:** https://iniru.github.io/CodeQuest/

## Features

- **GitHub Trending 탐색** — 트렌딩 레포에서 코드를 가져와 퀴즈 생성
- **내 GitHub 레포** — 본인 레포 코드로 학습
- **GitHub URL 직접 입력** — URL만 붙여넣으면 바로 코드 로드
- **빠른 퀴즈** — GitHub 없이 AI가 직접 코드를 만들어 문제 생성
- **6가지 퀴즈 유형** — 코드 설명, 빈칸 채우기, 직접 코딩, 버그 찾기, 코드 리뷰, 출력 예측
- **프로젝트 단위 문제** — 여러 파일을 선택해서 프로젝트 전체 기반 퀴즈
- **멀티 퀴즈 시리즈** — 여러 문제를 이어서 풀기
- **AI 채점** — 제출 즉시 AI가 채점 + 피드백 + 정답 해설
- **힌트 시스템** — 3단계 힌트 (감점 적용)
- **범용 AI 커넥터** — OpenAI, Claude, Gemini, Ollama 등 어떤 AI API든 연결
- **CORS 프록시 지원** — 브라우저 CORS 제한 우회
- **다크/라이트 테마**
- **한국어/영어 i18n**
- **GitHub Gist 동기화** — 설정과 기록을 클라우드에 저장/복원
- **자동 동기화** — 30초마다 Gist에 자동 저장
- **풀이 기록 & 통계** — 언어별, 유형별, 연속 풀이 기록

## Tech Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** — 스타일링
- **Monaco Editor** — 구문 강조 코드 에디터
- **Zustand** — 상태 관리 (localStorage 퍼시스트)
- **Radix UI** — 접근성 높은 UI 프리미티브
- **Framer Motion** — 애니메이션
- **Lucide React** — 아이콘
- **GitHub Pages** — 배포

## Getting Started

```bash
# 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build
```

## Setup

1. **AI API 설정** — Settings에서 AI 프리셋 선택 또는 커스텀 API 설정
2. **GitHub Token** (선택) — Settings에서 PAT 입력하면 내 레포 탐색 + 높은 API 한도
3. **CORS Proxy** (필요시) — AI API가 CORS를 차단하면 프록시 URL 설정

## Deployment

GitHub Pages에 자동 배포됩니다. `main` 브랜치에 push하면 GitHub Actions가 빌드 후 배포합니다.

## License

MIT
