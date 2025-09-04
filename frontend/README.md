# MIN-5-TIME-300 프론트엔드

이 프로젝트는 Next.js(App Router) + TypeScript + TailwindCSS 기반의 프론트엔드입니다.

- **백엔드**: NestJS + Prisma + PostgreSQL
- **주요 메뉴**: 로그인, 회원가입, 대시보드, 프로필, 일기, 커뮤니티, 채팅, 통계, 알림 등
- **API 연동**: axios 등 HTTP 클라이언트 사용, .env.local에 API 주소 설정
- **스타일링**: TailwindCSS

## 개발 시작

```sh
npm run dev
```

### 질문 생성 API 스키마 변경 (2025-09)

백엔드 AI 질문 생성 응답이 단일 `question` 문자열에서 아래 JSON 구조로 변경되었습니다:

```
{
	"questions": [
		{ "domain": "emotion", "text": "..." },
		{ "domain": "action", "text": "..." },
		{ "domain": "relationship", "text": "..." },
		{ "domain": "recovery", "text": "..." },
		{ "domain": "goal", "text": "..." }
	]
}
```

프론트에서는 `AIQuestionWriter` 컴포넌트가 이 배열을 렌더링하며, 사용자가 일부 혹은 전부에 답변 후 일기를 생성할 수 있습니다. 기존 `getTodayQuestion` 사용처는 `getTodayQuestions`로 점진적 교체 예정입니다.
## 환경 변수 예시 (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## 주요 폴더 구조
- `/src/app` : 페이지 라우팅(App Router)
- `/src/components` : 공통/개별 컴포넌트
- `/src/hooks` : 커스텀 훅
- `/src/utils` : 유틸 함수

## 참고
- 백엔드 API 스펙은 `/api/v1` 기준 NestJS 설계서와 일치
- JWT 인증, 반응형 UI, 모던 컴포넌트 설계 권장
