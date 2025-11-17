# 활동지수(Activity Score) 설계

## 개요
사용자의 플랫폼 내 활동을 0% ~ 100% 범위의 점수로 표현하고 12등급(Level 1~12)으로 분류합니다. 등급 산정은 99.5%를 최고 임계값으로 삼지만 데이터는 100%까지 저장합니다.

## 증가 규칙
- 일기 작성 (질문 받고 작성): +0.25%  
- 일기 작성 (자유롭게 작성): +0.27%  
- 좋아요(커뮤니티 활동) 1회: +0.005%  

## 감소 규칙
- 하루 경과마다 -0.3% (스케줄러/CRON에서 `ActivityService.dailyDecay` 호출 예상). 현재 CRON은 미구현.

## 초기값 산정 (가입 시)
`ActivityService.assignInitialScore` 는 새 사용자에게 즉시 100% 활동지수와 최고 등급(Level 12)을 부여하고 `lastActivityDecayAt` 를 현재 시각으로 초기화합니다. 가입 직후부터 하루 -0.3% decay가 곧바로 적용될 수 있도록 타임스탬프를 남깁니다.

## 등급(Threshold)
커스텀 임계값 (포함 이상):
```
L1: 0
L2: 5
L3: 10
L4: 17
L5: 25
L6: 35
L7: 47
L8: 60
L9: 72
L10: 82
L11: 91
L12: 96 (99.5% 캡)
```

## 필드
`prisma/schema.prisma` User 모델:
- `activityScore Float @default(100)`
- `activityLevel Int @default(1)`
- `lastActivityDecayAt DateTime?`

## 확장 아이디어
- 활동 이벤트 상세 로그 테이블 추가 (audit)
- decay를 주기적으로 실행하는 Nest Schedule 모듈 도입
- LLM 기반 초기 점수/가중치 동적 조정
- 활동지수 변화 웹소켓 브로드캐스트

## 주입 위치
- 회원가입: `AuthService.signup` -> 초기 점수 비동기 할당
- 일기 작성: `DiaryService.createDiary`
- 좋아요 토글: `DiaryService.toggleLike` (like 추가 시만 가점)

## 주의
 - Prisma 클라이언트 재생성 필요: `npx prisma generate` (CI 또는 개발 환경에서 자동 실행 가정)
 - 다중 업데이트 race condition 최소화 위해 `$transaction` 사용

## REST 엔드포인트
GET /activity
응답:
```
{
	activityScore: number,
	activityLevel: number,
	updatedAt: string
}
```

## WebSocket 이벤트
네임스페이스: /realtime
- 수신 이벤트: `activity.update` { userId, activityScore, activityLevel }
- 구독 방식: JWT 토큰으로 연결 후 자동으로 자신의 룸(`user:{userId}`) 구독. 다른 사용자 활동지수는 별도 구독 로직 필요시 확장.

## 스케줄러
Nest Schedule 이용. 매일 새벽 03:00(Asia/Seoul) 기준 `ActivityScheduler` 가 `dailyDecayAll()` 호출.
배치 최적화 필요 시: 페이지네이션, 큐(예: Bull), 최근 30일 활성 사용자 제한 등 추가 고려.
