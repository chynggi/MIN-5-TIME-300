'use client';

import React, { useState, useEffect } from 'react';

export interface LifestyleData {
  workStyle?: string;
  exerciseFrequency?: string;
  sleepPattern?: string;
  socialActivity?: string;
}

export interface LifestyleOptions {
  workStyleOptions: string[];
  exerciseFrequencyOptions: string[];
  sleepPatternOptions: string[];
  socialActivityOptions: string[];
}

export interface LifestyleSelectorProps {
  // 선택 가능한 옵션들
  options?: LifestyleOptions;
  // 이미 선택된 값들 (프로필 편집 시 사용)
  preSelectedValues?: LifestyleData;
  // 선택된 값이 변경될 때 호출되는 콜백
  onLifestyleChange: (lifestyle: LifestyleData) => void;
  // 컴포넌트 모드 ('signup' | 'edit')
  mode?: 'signup' | 'edit';
  // 제목
  title?: string;
  // 설명
  description?: string;
}

const DEFAULT_OPTIONS: LifestyleOptions = {
  workStyleOptions: [
    '재택근무', '사무실 근무', '하이브리드', '프리랜서', '학생', '기타'
  ],
  exerciseFrequencyOptions: [
    '매일', '주 3-4회', '주 1-2회', '월 1-2회', '거의 안함'
  ],
  sleepPatternOptions: [
    '일찍 자고 일찍 일어남', '늦게 자고 늦게 일어남', '불규칙함', '정해진 시간에 잠'
  ],
  socialActivityOptions: [
    '매우 활동적', '보통', '조용함', '집에 있는 것을 선호'
  ]
};

const CATEGORY_INFO = {
  workStyle: {
    title: '업무/학업 스타일',
    description: '평소 어떤 환경에서 일하거나 공부하시나요?',
    icon: '💼'
  },
  exerciseFrequency: {
    title: '운동 빈도',
    description: '얼마나 자주 운동하시나요?',
    icon: '🏃‍♂️'
  },
  sleepPattern: {
    title: '수면 패턴',
    description: '평소 수면 패턴은 어떠신가요?',
    icon: '😴'
  },
  socialActivity: {
    title: '사회적 활동',
    description: '사람들과의 만남이나 활동을 어느 정도 선호하시나요?',
    icon: '👥'
  }
};

export default function LifestyleSelector({
  options = DEFAULT_OPTIONS,
  preSelectedValues = {},
  onLifestyleChange,
  mode = 'signup',
  title = '라이프스타일을 알려주세요',
  description = '더 나은 추천과 매칭을 위해 라이프스타일을 선택해주세요'
}: LifestyleSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<LifestyleData>({});

  // 컴포넌트 마운트 시 미리 선택된 값들 설정
  useEffect(() => {
    if (Object.keys(preSelectedValues).length > 0) {
      setSelectedValues(preSelectedValues);
    }
  }, [preSelectedValues]);

  // 선택된 값이 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    onLifestyleChange(selectedValues);
  }, [selectedValues, onLifestyleChange]);

  const handleValueChange = (category: keyof LifestyleData, value: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [category]: prev[category] === value ? undefined : value // 같은 값 클릭 시 선택 해제
    }));
  };

  const renderCategory = (
    category: keyof LifestyleData,
    categoryOptions: string[]
  ) => {
    const categoryInfo = CATEGORY_INFO[category];
    const selectedValue = selectedValues[category];

    return (
      <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
        {/* 카테고리 헤더 */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{categoryInfo.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {categoryInfo.title}
            </h3>
            <p className="text-sm text-gray-600">
              {categoryInfo.description}
            </p>
          </div>
        </div>

        {/* 옵션 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoryOptions.map((option) => {
            const isSelected = selectedValue === option;
            return (
              <button
                key={option}
                onClick={() => handleValueChange(category, option)}
                className={`
                  p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isSelected && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택 안함 옵션 */}
        <button
          onClick={() => handleValueChange(category, '')}
          className={`
            w-full mt-3 p-2 rounded-lg border text-sm transition-all duration-200
            ${!selectedValue
              ? 'border-gray-400 bg-gray-100 text-gray-600'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }
          `}
        >
          나중에 선택하기
        </button>
      </div>
    );
  };

  // 완료된 카테고리 수 계산
  const completedCategories = Object.values(selectedValues).filter(value => value && value.trim() !== '').length;
  const totalCategories = Object.keys(CATEGORY_INFO).length;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="flex space-x-1">
            {Array.from({ length: totalCategories }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < completedCategories ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {completedCategories}/{totalCategories} 완료
          </span>
        </div>
      </div>

      {/* 라이프스타일 카테고리들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCategory('workStyle', options.workStyleOptions)}
        {renderCategory('exerciseFrequency', options.exerciseFrequencyOptions)}
        {renderCategory('sleepPattern', options.sleepPatternOptions)}
        {renderCategory('socialActivity', options.socialActivityOptions)}
      </div>

      {/* 선택된 값들 요약 */}
      {completedCategories > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-3">선택한 라이프스타일</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {Object.entries(selectedValues).map(([key, value]) => {
              if (!value) return null;
              const categoryInfo = CATEGORY_INFO[key as keyof LifestyleData];
              return (
                <div key={key} className="flex items-center">
                  <span className="mr-2">{categoryInfo.icon}</span>
                  <span className="font-medium text-blue-800">{categoryInfo.title}:</span>
                  <span className="ml-1 text-blue-700">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          {mode === 'signup' && (
            <p>모든 항목은 선택사항이며, 나중에 프로필에서 수정할 수 있습니다.</p>
          )}
          {mode === 'edit' && (
            <p>변경사항은 저장 버튼을 눌러야 적용됩니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}