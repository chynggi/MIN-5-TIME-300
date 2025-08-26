// 타입과 데이터 파일에서 이름 충돌 위험이 있는 항목은 명시적으로 재수출
export type {
  InterestSelectionItem,
  LifestyleSelectionItem,
  Interest,
  LifestyleData,
  CategoryItems,
  InterestSelectorProps,
  LifestyleSelectorProps,
} from './types';

export {
	CATEGORY_ICONS,
	INTEREST_CATEGORIES,
	LIFESTYLE_CATEGORY_ICONS,
	LIFESTYLE_CATEGORIES,
} from './interest-lifestyle-data';

export { InterestSelector } from './InterestSelector';
export { LifestyleSelector } from './LifestyleSelector';
