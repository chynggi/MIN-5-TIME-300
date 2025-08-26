"use client";
import React from 'react';
import { LIFESTYLE_CATEGORIES, LIFESTYLE_CATEGORY_ICONS } from './interest-lifestyle-data';
import { LifestyleSelectorProps } from './types';
import { InterestSelector } from './InterestSelector';

// LifestyleSelector는 InterestSelector 래퍼로 재사용 (동일 UX)
export const LifestyleSelector: React.FC<LifestyleSelectorProps> = (props) => {
  return (
    <InterestSelector
      {...props}
      categories={props.categories || LIFESTYLE_CATEGORIES}
      iconsMap={props.iconsMap || LIFESTYLE_CATEGORY_ICONS}
      title={props.title || '라이프스타일 선택'}
      colorTheme={props.colorTheme || 'orange'}
    />
  );
};

export default LifestyleSelector;
