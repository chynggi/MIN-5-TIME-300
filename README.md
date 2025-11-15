# MIN-5-TIME-300

2025학년도 캡스톤디자인 프로젝트 **MIN-5-TIME-300** 레포입니다. <br/>
백엔드(NestJS)와 프론트엔드(Next.js)가 하나의 모노레포로 구성되어 있습니다.

---

## 1. 전체 개요

- **백엔드**: NestJS + Prisma + PostgreSQL
- **프론트엔드**: Next.js(App Router) + TypeScript + TailwindCSS
- **주요 기능 도메인**
	- 인증: 회원가입, 로그인, 로그아웃, JWT 인증
	- 프로필: 기본 정보, 라이프스타일, 관심사 관리
	- 일기: 질문 기반/자유 형식 일기 작성, 감정 평가, 통계 연동
	- 친구·팔로우: 친구 요청/수락, 팔로우, 즐겨찾기
	- 커뮤니티: 공개 일기 피드, 피드백
	- 채팅: 실시간 채팅
	- 통계/피드백: 감정/활동 통계, 멘탈 어드바이스
	- 알림: 앱 내 알림, 일부 실시간 WebSocket 연동

---

## 2. 사전 설치 요구사항

- **Node.js**: `22.14.0` 권장 (LTS 계열 사용 시 최대한 근접 버전)
- **PostgreSQL**: `17.4` (로컬 개발 DB)

> Windows 기준 설치 후, PostgreSQL 포트/계정 정보를 `.env` 의 `DATABASE_URL`에 맞게 설정하세요.

---

## 3. 프로젝트 구조

```bash
MIN-5-TIME-300/
	backend/    # NestJS + Prisma 기반 API 서버
	frontend/   # Next.js(App Router) 기반 웹 클라이언트
	uploads/    # (백엔드) 프로필/일기 이미지 업로드 디렉토리
```

각 서브 프로젝트는 개별 `README.md` 를 가지며, 상세 기능/가이드는 하위 문서를 참고하세요.

- 백엔드: `backend/README.md`, `backend/README_ACTIVITY.md`, `backend/README_CHAT.md`, `backend/REALTIME_GUIDE.md`
- 프론트엔드: `frontend/README.md`

---

## 4. 환경 변수 설정

### 4-1. 백엔드 (`backend/.env`)

`backend/.env.example` 파일을 참고하여 `.env` 를 생성합니다.

필수 항목 예시:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/min5time300?schema=public"
JWT_SECRET=your_jwt_secret

# (선택) AI 관련
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

> `GEMINI_API_KEY` 가 없으면 질문 기반 일기 요약 시 LLM 호출 없이 원문이 저장될 수 있습니다. (경고 로그 출력)

### 4-2. 프론트엔드 (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

`NEXT_PUBLIC_API_URL` 은 백엔드 NestJS 서버의 주소(`/api/v1` 기준)를 가리킵니다.

---

## 5. 로컬 개발 실행 방법

### 5-1. 백엔드 (NestJS)

```bash
cd backend
npm install

# Prisma 마이그레이션 및 클라이언트 생성
npx prisma generate
npx prisma migrate dev --name init

# 개발 서버 실행 (watch)
npm run start:dev
```

서버 기본 포트는 `http://localhost:3000` 이며, 주요 REST API는 `/api/v1` 하위에 노출됩니다.

#### 테스트

```bash
cd backend
npm run test        # 단위 테스트
npm run test:e2e    # e2e 테스트
```

### 5-2. 프론트엔드 (Next.js)

```bash
cd frontend
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:3001` 또는 Next.js 기본 포트(3000)일 수 있으므로, 백엔드와 포트가 겹치지 않게 설정하거나 `package.json`/실행 옵션으로 조정합니다.

브라우저에서 프론트엔드 페이지를 열고, 로그인/일기 작성/커뮤니티/채팅/통계 화면을 통해 전체 플로우를 확인할 수 있습니다.

---

## 6. 핵심 기능 요약

### 6-1. 질문 기반 일기 & 요약 (AI)

- 프론트에서 `AIQuestionWriter` 컴포넌트를 통해 도메인별(감정, 행동, 관계, 회복, 목표 등) 질문 리스트를 받아 사용자가 답변합니다.
- 백엔드에서 Q&A 형식 답변을 받아 LLM(Gemini 등)을 호출해 1인칭 서술형 일기로 요약/저장합니다.
- 응답 스키마(예시):

	```json
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

- 백엔드의 AI 검증/테스트 시나리오는 `backend/docs/2025-10-11-ai-validation-plan.md` 에 정리되어 있습니다.

### 6-2. 실시간 기능 (WebSocket)

- `RealtimeGateway` 를 통해 `/realtime` 네임스페이스에서 Socket.IO 기반 실시간 이벤트를 제공합니다.
- 대표 이벤트: `profile.counters.update` (팔로워/팔로잉/일기 카운트 갱신 등)
- 룸 규칙 및 사용 방법은 `backend/REALTIME_GUIDE.md` 를 참고하세요.

### 6-3. 통계 및 멘탈 어드바이스

- 최근 일기 요약과 체크인 데이터를 바탕으로 멘탈 지표(수면, 스트레스, 에너지 등)를 분석합니다.
- 위험도에 따라 in-app 알림을 발송하며, LLM 기반 정성 피드백 기능 확장을 위한 설계가 포함되어 있습니다. (자세한 테스트 시나리오는 AI Validation 문서 참고)

---

## 7. 기타 문서

- `backend/min-5-time-300-데이터베이스-스키마.mermaid` : 주요 DB 스키마 구조
- `backend/min-5-time-300-시스템-아키텍처.mermaid` : 시스템 아키텍처 다이어그램
- `frontend/DIARY_REDESIGN.md` : 일기 UI/UX 리디자인 메모

프로젝트 구조나 기능을 변경할 경우, 관련 서브 README와 이 메인 `README.md` 를 함께 갱신해주세요.

---

## 8. 라이선스

이 레포의 라이선스는 루트 `LICENSE` 파일을 참고하세요.
