# AI 모델 API 오류 해결 가이드

이 문서는 AI 질문 생성 시스템에서 발생할 수 있는 오류들과 해결 방법을 설명합니다.

## 🔧 오류 해결 체크리스트

### 1. API 키 설정 확인
```bash
# .env 파일에서 API 키가 올바르게 설정되었는지 확인
GEMINI_API_KEY=your_gemini_key_here
CLAUDE_API_KEY=your_claude_key_here  
OPENAI_API_KEY=your_openai_key_here
```

### 2. 모델별 상태 확인

#### Gemini 2.5 Flash ✅ (권장)
- **안정성**: 9/10
- **일반적 오류**: API 키 누락, 할당량 초과
- **해결방법**: Google AI Studio에서 API 키 발급

#### Claude Sonnet 4 ⚠️
- **안정성**: 6/10 (과부하 발생 가능)
- **일반적 오류**: 529 Overload, API 키 오류
- **해결방법**: Anthropic Console에서 키 확인, 요청량 조절

#### GPT-5/4o 📊
- **안정성**: 7/10
- **일반적 오류**: 429 Rate Limit, 사용량 한도 초과
- **해결방법**: OpenAI Dashboard에서 사용량 확인

### 3. Pinecone 벡터 DB 오류

#### 404 Index Not Found
```bash
# 문제: mindiary-index 인덱스가 존재하지 않음
# 해결: Pinecone 콘솔에서 인덱스 생성 또는 기본 토픽 사용
```

## 🔄 자동 복구 시스템

시스템은 다음과 같은 자동 복구 메커니즘을 제공합니다:

### 1. 다단계 폴백 시스템
```
1차: 선택된 AI 모델 시도
2차: 안정성 순서로 다른 모델 시도 (Gemini → GPT → Claude)
3차: 응급 질문 제공
```

### 2. 벡터 DB 폴백
```
1차: Pinecone에서 트렌드 토픽 가져오기
2차: 하드코딩된 기본 토픽 사용
```

### 3. 모델 안정성 기반 선택
```typescript
// 자동으로 가장 안정적인 모델 우선 선택
const stabilityOrder = [
  { model: 'Gemini', stability: 9 },
  { model: 'GPT-5', stability: 7 },
  { model: 'Claude', stability: 6 }
];
```

## 🏥 응급 대응

### 모든 AI 모델이 실패할 경우
시스템은 요일별 응급 질문을 제공합니다:
- 월요일: "오늘 첫 감정은?"
- 화요일: "가장 행복했던 순간?"
- 수요일: "지금 가장 바라는 것?"
- 목요일: "오늘의 작은 성취는?"
- 금요일: "이번 주 배운 것은?"
- 토요일: "주말 계획이 뭐예요?"
- 일요일: "오늘 감사한 일은?"

## 📊 모니터링 로그

### 로그에서 확인할 수 있는 정보
```bash
# 성공적인 질문 생성
[INFO] 질문 생성 성공: Gemini 2.5 Flash 사용

# 모델 폴백 발생
[WARN] Gemini API 실패, GPT-5로 폴백 시도

# 완전 실패 시 응급 질문 사용
[ERROR] 모든 AI 모델 실패, 응급 질문 제공: "오늘 하루 어떠셨나요?"
```

## 🔍 디버깅 가이드

### 1. API 키 유효성 검사
```bash
# 백엔드 로그에서 확인
"API 키가 설정되지 않았습니다"
"API 키 길이가 너무 짧습니다"
```

### 2. 네트워크 연결 확인
```bash
# Pinecone 연결 오류
"Pinecone index 'mindiary-index' not found"

# AI API 연결 오류  
"Claude API가 과부하 상태입니다"
"OpenAI API 사용량 한도에 도달했습니다"
```

### 3. 모델별 특정 오류

#### Gemini
- 모델명 오류: `gemini-2.0-flash-exp` 사용 확인
- SDK 버전: `@google/generative-ai` 최신 버전

#### Claude
- 모델명: `claude-3-5-sonnet-20241022` 사용
- SDK: `@anthropic-ai/sdk` 설치 확인

#### OpenAI
- 모델명: `gpt-4o` (GPT-5 출시 전까지)
- SDK: `openai` 최신 버전

## 💡 최적화 권장사항

### 1. API 키 우선순위
1. **Gemini API 키** - 가장 안정적
2. GPT/OpenAI API 키 - 백업용
3. Claude API 키 - 추가 옵션

### 2. 모니터링
- 각 모델의 성공률 모니터링
- 응답 시간 측정
- 오류 패턴 분석

### 3. 비용 최적화
- Gemini 우선 사용 (비용 효율적)
- API 호출 캐싱 고려
- 배치 처리로 효율성 증대

## 🚨 긴급 상황 대응

### 모든 시스템 다운 시
1. `.env` 파일에서 모든 API 키 제거
2. 시스템이 자동으로 응급 질문만 제공
3. 사용자에게 임시 서비스 상태 안내

### 복구 순서
1. Gemini API 키 복구 (최우선)
2. Pinecone 인덱스 복구
3. 추가 AI 모델 복구
4. 정상 서비스 재개 확인