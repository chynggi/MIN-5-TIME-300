"use client";
import React, { useState } from 'react';
import { CATEGORY_ICONS, INTEREST_CATEGORIES } from './interest-lifestyle-data';
import { InterestSelectorProps } from './types';

// 재사용 가능한 2단계 관심사 선택 컴포넌트
export const InterestSelector: React.FC<InterestSelectorProps> = ({
  categories = INTEREST_CATEGORIES,
  iconsMap = CATEGORY_ICONS,
  selectedItems,
  selectedCategories,
  onToggleCategory,
  onToggleItem,
  onSkipToNextPhase,
  minCategoryRequired = 1,
  minItemRequired = 1,
  showSkipHint = true,
  title = '관심사 선택',
  colorTheme = 'blue',
  className = ''
}) => {
  const [phase, setPhase] = useState<'category' | 'items'>('category');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const accent = colorTheme === 'blue' ? 'blue' : 'orange';
  const accentText = colorTheme === 'blue' ? 'text-blue-700' : 'text-orange-700';
  const accentBg = colorTheme === 'blue' ? 'bg-blue-500' : 'bg-orange-500';
  const accentBgHover = colorTheme === 'blue' ? 'hover:bg-blue-600' : 'hover:bg-orange-600';
  const accentBorder = colorTheme === 'blue' ? 'border-blue-700' : 'border-orange-700';
  const accentBorderLight = colorTheme === 'blue' ? 'border-blue-200' : 'border-orange-200';
  const accentTextColor = colorTheme === 'blue' ? 'text-blue-700' : 'text-orange-700';
  const accentSoftBg = colorTheme === 'blue' ? 'bg-blue-50' : 'bg-orange-50';

  const activeCategory = categories[activeCategoryIndex];
  const isCategorySelected = (name: string) => selectedCategories.includes(name);
  const isItemSelected = (category: string, item: string) => selectedItems.some(i => i.category === category && i.item === item);

  const handleCategoryClick = (name: string, index: number) => {
    onToggleCategory(name);
    // 선택 즉시 아이템 단계로 이동
    setActiveCategoryIndex(index);
    setPhase('items');
  };

  const totalItemsCount = selectedItems.length;

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="mb-5 text-center">
        <h2 className={`text-xl font-bold ${accentText}`}>{title}</h2>
        <p className="text-gray-600 text-sm mt-2">
          {phase === 'category' && '관심 있는 카테고리를 선택하면 바로 세부 항목을 설정할 수 있습니다.'}
          {phase === 'items' && `${activeCategory.name} 카테고리의 세부 관심사를 선택하세요.`}
        </p>
        {showSkipHint && phase === 'category' && totalItemsCount > 0 && (
          <div className="mt-3 p-3 bg-green-50 text-green-700 rounded text-sm">
            ✅ {totalItemsCount}개의 관심사가 선택되었습니다. 이미 선택했다면 다음 단계로 이동할 수 있습니다.
            {onSkipToNextPhase && (
              <button
                type="button"
                className="ml-2 underline font-medium"
                onClick={() => onSkipToNextPhase()}
              >
                바로 이동
              </button>
            )}
          </div>
        )}
      </div>

      {phase === 'category' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
            {categories.map((cat, idx) => {
              const selected = isCategorySelected(cat.name);
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name, idx)}
                  className={`px-2.5 py-3 rounded-xl font-medium border-2 transition hover:scale-[1.04] ${
                    selected
                      ? `${accentBg} text-white ${accentBorder} shadow-lg`
                      : `bg-white ${accentTextColor} ${accentBorderLight} hover:bg-opacity-90`
                  }`}
                >
                  <div className="text-lg mb-1">{iconsMap[cat.name] || '⭐'}</div>
                  <div className="text-sm font-bold leading-snug">{cat.name}</div>
                </button>
              );
            })}
          </div>
          <div className="text-sm text-gray-500 text-center mb-4">
            선택된 카테고리: {selectedCategories.length}개 / 최소 {minCategoryRequired}개
          </div>
        </div>
      )}

      {phase === 'items' && (
        <div className="flex flex-col items-center gap-4">
          {/* 카테고리 네비게이션 */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
              disabled={activeCategoryIndex === 0}
              onClick={() => setActiveCategoryIndex(i => Math.max(0, i - 1))}
            >
              이전
            </button>
            <span className={`font-bold text-lg ${accentTextColor}`}>{activeCategory.name}</span>
            <button
              type="button"
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
              disabled={activeCategoryIndex === categories.length - 1}
              onClick={() => setActiveCategoryIndex(i => Math.min(categories.length - 1, i + 1))}
            >
              다음
            </button>
          </div>
          <div className="text-sm text-gray-600 -mt-2">
            {isCategorySelected(activeCategory.name) ? '✅ 선택된 카테고리' : '❌ 미선택 카테고리'}
          </div>
          <button
            type="button"
            onClick={() => onToggleCategory(activeCategory.name)}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${
              isCategorySelected(activeCategory.name)
                ? 'bg-red-500 text-white hover:bg-red-600'
                : `${accentBg} text-white ${accentBgHover}`
            }`}
          >
            {isCategorySelected(activeCategory.name) ? '카테고리 선택 해제' : '카테고리 선택하기'}
          </button>
          {isCategorySelected(activeCategory.name) && (
            <div className={`${accentSoftBg} rounded-xl p-3 w-full max-w-lg`}>
              <div className={`font-bold mb-2 text-sm ${accentTextColor}`}>{activeCategory.name}</div>
              <div className="grid grid-cols-2 gap-2">
                {activeCategory.items.map(item => {
                  const selected = isItemSelected(activeCategory.name, item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onToggleItem(activeCategory.name, item)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        selected
                          ? `${accentBg} text-white ${accentBorder}`
                          : `bg-white ${accentTextColor} ${accentBorderLight} hover:bg-opacity-90`
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="text-[10px] text-gray-500 mt-1">
            선택된 카테고리: {selectedCategories.length}개 | 선택된 항목: {selectedItems.length}개
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-500 text-white text-sm hover:bg-gray-600 transition"
            onClick={() => setPhase('category')}
          >
            카테고리 목록으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};

export default InterestSelector;
