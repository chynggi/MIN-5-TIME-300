// 프로필 관련 컴포넌트들을 내보내는 index 파일
export { default as InterestSelector } from './InterestSelector';
export { default as LifestyleSelector } from './LifestyleSelector';

// 타입들도 함께 내보내기
export type { Interest, InterestSelectorProps } from './InterestSelector';
export type { LifestyleData, LifestyleOptions, LifestyleSelectorProps } from './LifestyleSelector';