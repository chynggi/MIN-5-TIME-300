# MIN-5-TIME-300 E2E 테스트 실행 스크립트

## 개요

이 문서는 백엔드와 프론트엔드의 E2E 테스트 실행 방법을 설명합니다.

## 백엔드 E2E 테스트

### 1. 전체 통합 테스트 실행

```powershell
cd backend
npm run test:e2e:full
```

### 2. 모든 E2E 테스트 실행

```powershell
cd backend
npm run test:e2e
```

### 3. 상세 로그와 함께 테스트 실행

```powershell
cd backend
npm run test:e2e:verbose
```

### 4. 특정 테스트 파일만 실행

```powershell
cd backend
npm run test:e2e -- --testPathPattern=profile
npm run test:e2e -- --testPathPattern=diary
npm run test:e2e -- --testPathPattern=chat
npm run test:e2e -- --testPathPattern=follow
```

### 5. 테스트 파일 목록

- `full-integration.e2e-spec.ts` - 전체 통합 테스트 (인증, 일기, 팔로우, 채팅, 통계 등)
- `api-modules.e2e-spec.ts` - API 모듈별 상세 테스트
- `app.e2e-spec.ts` - 기본 앱 테스트
- `chat.e2e-spec.ts` - 채팅 API 테스트
- `profile.e2e-spec.ts` - 프로필 API 테스트
- `statistics.e2e-spec.ts` - 통계 API 테스트
- `friend.e2e-spec.ts` - 친구 API 테스트
- `follow.e2e-spec.ts` - 팔로우 시스템 테스트
- `diary-save-answers.e2e-spec.ts` - 일기 질문 답변 테스트
- `diary-location.e2e-spec.ts` - 일기 위치 저장 테스트
- `question.e2e-spec.ts` - 질문 생성 테스트
- `community.e2e-spec.ts` - 커뮤니티 API 테스트

## 프론트엔드 E2E 테스트

### 1. Playwright 설치

```powershell
cd frontend
npm install
npx playwright install
```

### 2. E2E 테스트 실행

```powershell
# 모든 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅에 유용)
npm run test:e2e:ui

# 브라우저 표시하며 실행
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug
```

### 3. 특정 브라우저만 테스트

```powershell
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
```

### 4. 테스트 리포트 확인

```powershell
npx playwright show-report
```

## 전체 테스트 실행 (백엔드 + 프론트엔드)

### Linux / macOS (Bash)

```bash
# 실행 권한 부여 (최초 1회)
chmod +x run-all-e2e-tests.sh run-backend-e2e.sh run-frontend-e2e.sh

# 전체 테스트 실행
./run-all-e2e-tests.sh

# 백엔드만 테스트
./run-all-e2e-tests.sh --backend-only

# 프론트엔드만 테스트
./run-all-e2e-tests.sh --frontend-only

# 상세 로그 출력
./run-all-e2e-tests.sh --verbose
```

#### 백엔드 전용 스크립트

```bash
./run-backend-e2e.sh                    # 전체 통합 테스트
./run-backend-e2e.sh --all              # 모든 E2E 테스트
./run-backend-e2e.sh --pattern profile  # 특정 패턴만 테스트
./run-backend-e2e.sh --verbose          # 상세 로그
```

#### 프론트엔드 전용 스크립트

```bash
./run-frontend-e2e.sh                       # 기본 테스트
./run-frontend-e2e.sh --ui                  # UI 모드 (디버깅)
./run-frontend-e2e.sh --headed              # 브라우저 표시
./run-frontend-e2e.sh --browser chromium    # 특정 브라우저만
./run-frontend-e2e.sh --debug               # 디버그 모드
```

### Windows PowerShell

```powershell
# 전체 테스트 실행
.\run-all-e2e-tests.ps1

# 백엔드만 테스트
.\run-all-e2e-tests.ps1 -BackendOnly

# 프론트엔드만 테스트
.\run-all-e2e-tests.ps1 -FrontendOnly

# 상세 로그 출력
.\run-all-e2e-tests.ps1 -Verbose
```

### 수동 실행

```bash
# 백엔드 테스트
cd backend
npm run test:e2e:full

# 프론트엔드 테스트 (별도 터미널에서)
cd frontend
npm run test:e2e
```

### 순차 실행 스크립트 (레거시)

```powershell
# run-all-tests.ps1
Write-Host "=== 백엔드 E2E 테스트 시작 ===" -ForegroundColor Cyan
Set-Location -Path ".\backend"
npm run test:e2e:full
$backendResult = $LASTEXITCODE

Write-Host "`n=== 프론트엔드 E2E 테스트 시작 ===" -ForegroundColor Cyan
Set-Location -Path "..\frontend"
npm run test:e2e
$frontendResult = $LASTEXITCODE

Write-Host "`n=== 테스트 결과 요약 ===" -ForegroundColor Cyan
if ($backendResult -eq 0) {
    Write-Host "백엔드 테스트: 성공" -ForegroundColor Green
} else {
    Write-Host "백엔드 테스트: 실패" -ForegroundColor Red
}

if ($frontendResult -eq 0) {
    Write-Host "프론트엔드 테스트: 성공" -ForegroundColor Green
} else {
    Write-Host "프론트엔드 테스트: 실패" -ForegroundColor Red
}
```

## 테스트 환경 요구사항

### 백엔드
- Node.js 18+
- PostgreSQL 데이터베이스 (테스트용)
- `.env` 파일에 데이터베이스 연결 정보 설정

### 프론트엔드
- Node.js 18+
- Playwright 브라우저 설치 (`npx playwright install`)

## 주의사항

1. **데이터베이스**: 테스트는 실제 데이터베이스에 데이터를 생성/삭제합니다. 테스트 전용 데이터베이스를 사용하세요.

2. **API 서버**: 백엔드 E2E 테스트는 내부적으로 서버를 시작합니다. 프론트엔드 테스트는 백엔드 서버가 실행 중이어야 합니다.

3. **환경 변수**: AI 관련 API (Gemini, OpenAI 등) 테스트는 해당 API 키가 필요합니다.

4. **타임아웃**: AI 관련 테스트는 시간이 오래 걸릴 수 있습니다. 필요시 타임아웃을 늘려주세요.

## 테스트 커버리지

### 백엔드 API 커버리지
- ✅ 인증 (회원가입, 로그인, 토큰 검증)
- ✅ 프로필 (조회, 수정, 관심사, 라이프스타일)
- ✅ 일기 (CRUD, 공개설정, 감정평가, 위치저장)
- ✅ 질문 기반 일기 (save-answers)
- ✅ 체크인 (조회, 생성)
- ✅ 팔로우 (팔로우/언팔로우, 요청승인/거절, 목록조회)
- ✅ 친구 (목록, 검색, 추천)
- ✅ 채팅 (대화목록, 메시지)
- ✅ 통계 (대시보드, LPG점수)
- ✅ 커뮤니티 (공개일기)
- ✅ 알림 (설정 조회/수정)
- ✅ 질문 생성

### 프론트엔드 UI 커버리지
- ✅ 기본 페이지 접근
- ✅ 로그인/회원가입 폼
- ✅ 네비게이션
- ✅ 반응형 디자인
- ✅ 접근성
- ✅ 에러 처리
- ✅ 성능 (페이지 로드 시간)
