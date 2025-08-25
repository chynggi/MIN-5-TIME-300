# 프로필 관련 재사용 컴포넌트

관심사와 라이프스타일 선택을 위한 재사용 가능한 React 컴포넌트들입니다.

## 📁 파일 구조

```
src/components/profile/
├── InterestSelector.tsx    # 관심사 선택 컴포넌트
├── LifestyleSelector.tsx   # 라이프스타일 선택 컴포넌트
└── index.ts               # 컴포넌트 export 파일
```

## 🚀 사용 방법

### 1. InterestSelector (관심사 선택 컴포넌트)

```tsx
import { InterestSelector, Interest } from '@/components/profile';

function MyComponent() {
  const [interests, setInterests] = useState<Interest[]>([]);

  const handleInterestsChange = (selectedInterests: Interest[]) => {
    setInterests(selectedInterests);
  };

  return (
    <InterestSelector
      // 선택 가능한 관심사 목록 (선택사항)
      availableInterests={['독서', '영화감상', '음악', '게임']}
      
      // 미리 선택된 관심사들 (프로필 편집 시)
      preSelectedInterests={[
        { id: '1', interest: '독서', priority: 1 },
        { id: '2', interest: '음악', priority: 2 }
      ]}
      
      // 선택 변경 시 콜백
      onInterestsChange={handleInterestsChange}
      
      // 기타 옵션들
      mode="signup" // 'signup' | 'edit'
      maxSelections={10}
      minSelections={3}
      title="관심사를 선택해주세요"
      description="나와 비슷한 관심사를 가진 사람들과 연결될 수 있어요"
    />
  );
}
```

### 2. LifestyleSelector (라이프스타일 선택 컴포넌트)

```tsx
import { LifestyleSelector, LifestyleData } from '@/components/profile';

function MyComponent() {
  const [lifestyle, setLifestyle] = useState<LifestyleData>({});

  const handleLifestyleChange = (selectedLifestyle: LifestyleData) => {
    setLifestyle(selectedLifestyle);
  };

  return (
    <LifestyleSelector
      // 선택 가능한 옵션들 (선택사항, 기본값 제공)
      options={{
        workStyleOptions: ['재택근무', '사무실 근무', '하이브리드'],
        exerciseFrequencyOptions: ['매일', '주 3-4회', '주 1-2회'],
        sleepPatternOptions: ['일찍 자고 일찍 일어남', '늦게 자고 늦게 일어남'],
        socialActivityOptions: ['매우 활동적', '보통', '조용함']
      }}
      
      // 미리 선택된 값들 (프로필 편집 시)
      preSelectedValues={{
        workStyle: '재택근무',
        exerciseFrequency: '주 3-4회'
      }}
      
      // 선택 변경 시 콜백
      onLifestyleChange={handleLifestyleChange}
      
      // 기타 옵션들
      mode="edit" // 'signup' | 'edit'
      title="라이프스타일을 알려주세요"
      description="더 나은 추천과 매칭을 위해 라이프스타일을 선택해주세요"
    />
  );
}
```

## 📱 실제 사용 예시

### 회원가입 페이지에서 사용
- 파일: `src/app/signup/interests/page.tsx`
- 기본 옵션들 사용
- 신규 선택 (preSelected 없음)

### 프로필 편집 페이지에서 사용
- 파일: `src/app/profile/edit/interests-lifestyle/page.tsx`
- 백엔드 API에서 기존 선택사항 로드
- 기존 값들을 preSelected로 전달
- 변경사항 추적 및 저장

## 🎨 컴포넌트 특징

### InterestSelector
- ✅ 다중 선택 가능
- ✅ 우선순위 자동 설정
- ✅ 최소/최대 선택 개수 제한
- ✅ 선택된 항목 실시간 미리보기
- ✅ 드래그 앤 드롭 순서 변경 (추후 추가 가능)

### LifestyleSelector
- ✅ 카테고리별 단일 선택
- ✅ 아이콘과 설명이 있는 직관적 UI
- ✅ 선택 안함 옵션 제공
- ✅ 진행상황 표시
- ✅ 선택 결과 요약 표시

## 🔄 백엔드 API 연동

### 관심사 데이터 조회
```typescript
// GET /api/v1/profile/edit/interests
{
  "availableInterests": ["독서", "영화감상", "음악", ...],
  "selectedInterests": [
    { "id": "1", "interest": "독서", "priority": 1 }
  ]
}
```

### 라이프스타일 데이터 조회
```typescript
// GET /api/v1/profile/edit/lifestyle
{
  "workStyleOptions": ["재택근무", "사무실 근무", ...],
  "exerciseFrequencyOptions": ["매일", "주 3-4회", ...],
  "sleepPatternOptions": ["일찍 자고 일찍 일어남", ...],
  "socialActivityOptions": ["매우 활동적", "보통", ...],
  "currentSelections": {
    "workStyle": "재택근무",
    "exerciseFrequency": "주 3-4회"
  }
}
```

### 저장 API
```typescript
// POST /api/v1/profile/interests
{
  "interests": [
    { "interest": "독서", "priority": 1 },
    { "interest": "음악", "priority": 2 }
  ]
}

// PUT /api/v1/profile/lifestyle
{
  "workStyle": "재택근무",
  "exerciseFrequency": "주 3-4회",
  "sleepPattern": "일찍 자고 일찍 일어남",
  "socialActivity": "보통"
}
```

## 🎯 장점

1. **재사용성**: 회원가입과 프로필 편집에서 동일한 컴포넌트 사용
2. **일관성**: 동일한 UI/UX 제공
3. **유지보수성**: 한 곳에서 수정하면 모든 곳에 적용
4. **확장성**: 새로운 기능 추가 시 props로 쉽게 확장 가능
5. **타입 안전성**: TypeScript로 타입 안전성 보장

## 🔧 커스터마이징

컴포넌트의 스타일이나 동작을 변경하려면:

1. props를 통한 설정 변경
2. CSS 클래스 수정
3. 새로운 props 추가하여 기능 확장

이제 회원가입과 프로필 편집에서 일관된 UI를 사용하면서도, 각각의 상황에 맞는 데이터를 표시할 수 있습니다!