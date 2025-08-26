// 공용 타입 정의 (관심사 & 라이프스타일 선택)
export interface InterestSelectionItem {
  category: string;
  item: string;
}

export interface LifestyleSelectionItem {
  category: string;
  item: string;
}

export type Interest = InterestSelectionItem; // 기존 페이지에서 사용할 호환 alias
export type LifestyleData = Record<string, string | string[] | undefined> | any; // 기존 edit 페이지 구조 호환을 위해 느슨하게 유지, 추후 정교화 가능

export interface CategoryItems {
  name: string;
  items: string[];
}

export interface InterestSelectorProps {
  categories?: CategoryItems[]; // 기본값: INTEREST_CATEGORIES
  iconsMap?: Record<string, string>; // 기본값: CATEGORY_ICONS
  selectedItems: InterestSelectionItem[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onToggleItem: (category: string, item: string) => void;
  onSkipToNextPhase?: () => void; // 이미 선택한 경우 다음 단계로 스킵
  minCategoryRequired?: number; // 기본 1
  minItemRequired?: number; // 기본 1
  showSkipHint?: boolean;
  title?: string;
  colorTheme?: 'blue' | 'orange';
  className?: string;
}

export interface LifestyleSelectorProps extends InterestSelectorProps {
  // 라이프스타일 전용 추가 prop 필요 시 확장
}