'use client';

import React, { useState, useEffect } from 'react';

export interface Interest {
  id?: string;
  interest: string;
  priority: number;
}

export interface InterestSelectorProps {
  // 선택 가능한 모든 관심사 목록
  availableInterests?: string[];
  // 이미 선택된 관심사들 (프로필 편집 시 사용)
  preSelectedInterests?: Interest[];
  // 선택된 관심사가 변경될 때 호출되는 콜백
  onInterestsChange: (interests: Interest[]) => void;
  // 최대 선택 가능한 개수
  maxSelections?: number;
  // 최소 선택해야 하는 개수
  minSelections?: number;
  // 컴포넌트 모드 ('signup' | 'edit')
  mode?: 'signup' | 'edit';
  // 제목
  title?: string;
  // 설명
  description?: string;
}

const DEFAULT_INTERESTS = [
  '독서', '영화감상', '음악', '게임', '운동', '요리', '여행', '사진촬영',
  '그림그리기', '글쓰기', '외국어학습', '코딩', '디자인', '패션', '뷰티',
  '반려동물', '원예', '악기연주', '댄스', '보드게임', '카페투어', '맛집탐방',
  '등산', '캠핑', '낚시', '자전거', '요가', '헬스', '수영', '테니스',
  '골프', '축구', '농구', '야구', '볼링', '당구', '스키', '서핑'
];

export default function InterestSelector({
  availableInterests = DEFAULT_INTERESTS,
  preSelectedInterests = [],
  onInterestsChange,
  maxSelections = 10,
  minSelections = 3,
  mode = 'signup',
  title = '관심사를 선택해주세요',
  description = '나와 비슷한 관심사를 가진 사람들과 연결될 수 있어요'
}: InterestSelectorProps) {
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);

  // 컴포넌트 마운트 시 미리 선택된 관심사들 설정
  useEffect(() => {
    if (preSelectedInterests.length > 0) {
      setSelectedInterests(preSelectedInterests);
    }
  }, [preSelectedInterests]);

  // 선택된 관심사가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    onInterestsChange(selectedInterests);
  }, [selectedInterests, onInterestsChange]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => {
      const isAlreadySelected = prev.some(item => item.interest === interest);
      
      if (isAlreadySelected) {
        // 이미 선택된 경우 제거
        const newInterests = prev.filter(item => item.interest !== interest);
        // priority 재정렬
        return newInterests.map((item, index) => ({
          ...item,
          priority: index + 1
        }));
      } else {
        // 최대 선택 개수 체크
        if (prev.length >= maxSelections) {
          alert(`최대 ${maxSelections}개까지 선택할 수 있습니다.`);
          return prev;
        }
        
        // 새로 추가
        const newInterest: Interest = {
          id: mode === 'edit' ? undefined : undefined, // 새 항목은 id가 없음
          interest,
          priority: prev.length + 1
        };
        return [...prev, newInterest];
      }
    });
  };

  const isInterestSelected = (interest: string) => {
    return selectedInterests.some(item => item.interest === interest);
  };

  const canSubmit = selectedInterests.length >= minSelections;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
        <div className="mt-4">
          <span className={`text-sm ${canSubmit ? 'text-green-600' : 'text-orange-600'}`}>
            {selectedInterests.length}/{minSelections}개 이상 선택 
            {maxSelections && ` (최대 ${maxSelections}개)`}
          </span>
        </div>
      </div>

      {/* 선택된 관심사 표시 */}
      {selectedInterests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">선택된 관심사</h3>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((item) => (
              <div
                key={item.interest}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                <span className="mr-1 text-xs bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center">
                  {item.priority}
                </span>
                {item.interest}
                <button
                  onClick={() => handleInterestToggle(item.interest)}
                  className="ml-2 hover:text-blue-900"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 관심사 선택 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {availableInterests.map((interest) => {
          const isSelected = isInterestSelected(interest);
          return (
            <button
              key={interest}
              onClick={() => handleInterestToggle(interest)}
              className={`
                p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              disabled={!isSelected && selectedInterests.length >= maxSelections}
            >
              {interest}
            </button>
          );
        })}
      </div>

      {/* 하단 안내 */}
      <div className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          {mode === 'signup' && (
            <p>선택한 관심사는 나중에 프로필에서 수정할 수 있습니다.</p>
          )}
          {mode === 'edit' && (
            <p>변경사항은 저장 버튼을 눌러야 적용됩니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}