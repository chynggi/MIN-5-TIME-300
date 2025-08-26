# Interest & Lifestyle Selectors Notes

## 구성
- InterestSelector: 2단계(카테고리 -> 아이템) 전환, 선택 즉시 아이템 단계 이동
- LifestyleSelector: InterestSelector 래핑 (카테고리/아이콘/테마만 변경)
- 데이터: `interest-lifestyle-data.ts`에 하드코딩 (향후 API 기반 교체 가능)

## TODO 제안
1. i18n 적용 (react-intl / next-intl)
2. 대용량 항목 가상 스크롤 (react-virtualized)
3. 접근성: role, aria-selected, 키보드 포커스 이동 로직 추가
4. 테스트: Jest + React Testing Library로 카테고리/아이템 토글 동작 테스트
5. 퍼포먼스: memoization (카테고리 카드, 아이템 리스트) + 분할 로딩
6. 라이프스타일 항목 텍스트 원본 재검수 (OCR/복사 중 깨진 표현 있음)
7. Drag & Drop을 통한 priority 재정렬 UI (현재 선택 순서 = priority)

## 사용 방법
```tsx
<InterestSelector
  selectedItems={interestSelections}
  selectedCategories={interestCategories}
  onToggleCategory={...}
  onToggleItem={...}
  onSkipToNextPhase={() => ...}
/>
```

## 저장 규칙
- 관심사: `"카테고리 - 아이템"` 문자열 + priority(현재 배열 순서)
- 라이프스타일: question: `"카테고리 - 아이템"`, answer: "선택" (백엔드 기존 구조 준수)
