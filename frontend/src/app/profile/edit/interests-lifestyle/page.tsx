"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { InterestSelector, LifestyleSelector, InterestSelectionItem } from '../../../../components/profile';
import apiRequest from '../../../../lib/api';

// 백엔드 기존 edit API 구조를 새 선택 컴포넌트가 요구하는 형태로 어댑트
interface InterestEditDataResponse {
  availableInterests: string[];
  selectedInterests: { interest: string; priority: number }[];
}

interface LifestyleEditDataResponse {
  workStyleOptions: string[];
  exerciseFrequencyOptions: string[];
  sleepPatternOptions: string[];
  socialActivityOptions: string[];
  currentSelections: Record<string, string>;
}

export default function ProfileEditInterestsLifestylePage() {
  const [currentTab, setCurrentTab] = useState<'interests' | 'lifestyle'>('interests');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 원본 데이터 보관 (취소 시 복원)
  const [interestRaw, setInterestRaw] = useState<InterestEditDataResponse | null>(null);
  const [lifestyleRaw, setLifestyleRaw] = useState<LifestyleEditDataResponse | null>(null);

  // 선택 상태 (새 컴포넌트 형식)
  const [interestSelections, setInterestSelections] = useState<InterestSelectionItem[]>([]); // {category - item} 파싱 필요
  const [interestCategoriesSelected, setInterestCategoriesSelected] = useState<string[]>([]);

  // 라이프스타일: 기존은 key/value 구조 -> category, item 구조로 flatten (카테고리 추정: key 앞 segment)
  const [lifestyleSelections, setLifestyleSelections] = useState<InterestSelectionItem[]>([]);
  const [lifestyleCategoriesSelected, setLifestyleCategoriesSelected] = useState<string[]>([]);

  // 데이터 로드
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [interestRes, lifestyleRes] = await Promise.all([
        apiRequest('/profile/edit/interests'),
        apiRequest('/profile/edit/lifestyle')
      ]) as [InterestEditDataResponse, LifestyleEditDataResponse];
      setInterestRaw(interestRes);
      setLifestyleRaw(lifestyleRes);

      // 관심사: "카테고리 - 아이템" 형태 기준 분리
      const parsedInterests: InterestSelectionItem[] = interestRes.selectedInterests.map(si => {
        const [category, item] = si.interest.split(' - ').map(s => s.trim());
        return { category, item };
      });
      setInterestSelections(parsedInterests);
      setInterestCategoriesSelected(Array.from(new Set(parsedInterests.map(p => p.category))));

      // 라이프스타일 currentSelections: key가 "카테고리 - 질문" 형태라고 가정
      const lifestylePairs: InterestSelectionItem[] = Object.keys(lifestyleRes.currentSelections || {}).filter(k => !!lifestyleRes.currentSelections[k]).map(key => {
        const [category, item] = key.split(' - ').map(s => s.trim());
        return { category, item };
      });
      setLifestyleSelections(lifestylePairs);
      setLifestyleCategoriesSelected(Array.from(new Set(lifestylePairs.map(p => p.category))));
    } catch (e) {
      console.error('편집 데이터 로드 실패', e);
      alert('편집 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 컴포넌트는 토글 기반으로 변경 상황을 직접 반영 -> 래퍼 핸들러 제공
  const toggleInterestCategory = (category: string) => {
    setInterestCategoriesSelected(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    setHasChanges(true);
  };
  const toggleInterestItem = (category: string, item: string) => {
    setInterestSelections(prev => {
      const exists = prev.some(p => p.category === category && p.item === item);
      if (exists) return prev.filter(p => !(p.category === category && p.item === item));
      return [...prev, { category, item }];
    });
    setHasChanges(true);
  };

  const toggleLifestyleCategory = (category: string) => {
    setLifestyleCategoriesSelected(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    setHasChanges(true);
  };
  const toggleLifestyleItem = (category: string, item: string) => {
    setLifestyleSelections(prev => {
      const exists = prev.some(p => p.category === category && p.item === item);
      if (exists) return prev.filter(p => !(p.category === category && p.item === item));
      return [...prev, { category, item }];
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (currentTab === 'interests') {
        // priority는 현재 배열 순서 기준
        const interestsPayload = interestSelections.map((sel, idx) => ({
          interest: `${sel.category} - ${sel.item}`,
          priority: idx + 1,
        }));
        await apiRequest('/profile/interests', { method: 'POST', body: JSON.stringify({ interests: interestsPayload }) });
        setHasChanges(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        // lifestyle: question: `${category} - ${item}` 형태, answer는 "선택" 고정 (signup과 동일 패턴)
        const lifestyleAnswers = lifestyleSelections.map(sel => ({ question: `${sel.category} - ${sel.item}`, answer: '선택' }));
        await apiRequest('/profile/lifestyle', { method: 'PUT', body: JSON.stringify({ answers: lifestyleAnswers }) });
        setHasChanges(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (e) {
      console.error('저장 실패', e);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges) return;
    if (!confirm('변경사항이 있습니다. 정말 취소하시겠습니까?')) return;
    // 원본 복원
    if (interestRaw) {
      const parsed = interestRaw.selectedInterests.map(si => {
        const [category, item] = si.interest.split(' - ').map(s => s.trim());
        return { category, item } as InterestSelectionItem;
      });
      setInterestSelections(parsed);
      setInterestCategoriesSelected(Array.from(new Set(parsed.map(p => p.category))));
    }
    if (lifestyleRaw) {
      const lifestylePairs: InterestSelectionItem[] = Object.keys(lifestyleRaw.currentSelections || {}).filter(k => !!lifestyleRaw.currentSelections[k]).map(key => {
        const [category, item] = key.split(' - ').map(s => s.trim());
        return { category, item };
      });
      setLifestyleSelections(lifestylePairs);
      setLifestyleCategoriesSelected(Array.from(new Set(lifestylePairs.map(p => p.category))));
    }
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">프로필 편집</h1>
              <p className="text-gray-600">관심사와 라이프스타일을 수정할 수 있습니다</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* 저장 버튼 - 변경사항이 있을 때만 표시 */}
              {hasChanges && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`
                      px-6 py-2 rounded-lg font-medium transition-all
                      ${saving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }
                    `}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                ← 뒤로가기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentTab('interests')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  currentTab === 'interests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                관심사
              </button>
              <button
                onClick={() => setCurrentTab('lifestyle')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  currentTab === 'lifestyle'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                라이프스타일
              </button>
            </div>
            
            {/* 탭별 저장 버튼 */}
            {hasChanges && (
              <div className="py-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${saving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : currentTab === 'interests'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }
                  `}
                >
                  {saving ? '저장 중...' : `${currentTab === 'interests' ? '관심사' : '라이프스타일'} 저장`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="py-8">
        {/* 변경사항 상태 알림 */}
        {hasChanges && (
          <div className="max-w-4xl mx-auto px-6 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-800 font-medium">
                    {currentTab === 'interests' ? '관심사' : '라이프스타일'}에 변경사항이 있습니다
                  </span>
                </div>
                <div className="text-sm text-yellow-700">
                  저장하지 않으면 변경사항이 사라집니다
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentTab === 'interests' && (
          <InterestSelector
            selectedItems={interestSelections}
            selectedCategories={interestCategoriesSelected}
            onToggleCategory={toggleInterestCategory}
            onToggleItem={toggleInterestItem}
            onSkipToNextPhase={() => setCurrentTab('lifestyle')}
            title="관심사 수정"
            colorTheme="blue"
          />
        )}
        {currentTab === 'lifestyle' && (
          <LifestyleSelector
            selectedItems={lifestyleSelections}
            selectedCategories={lifestyleCategoriesSelected}
            onToggleCategory={toggleLifestyleCategory}
            onToggleItem={toggleLifestyleItem}
            onSkipToNextPhase={() => {/* no-op */}}
            title="라이프스타일 수정"
            colorTheme="orange"
          />
        )}
      </div>

      {/* 변경사항이 있을 때만 표시되는 하단 버튼 */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="text-sm text-orange-600">
              변경사항이 있습니다. 저장하지 않으면 변경사항이 사라집니다.
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
                disabled={saving}
              >
                취소
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
                  px-8 py-2 rounded-lg font-medium transition-all
                  ${saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
              >
                {saving ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 성공 토스트 알림 */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">
              {currentTab === 'interests' ? '관심사' : '라이프스타일'}가 성공적으로 저장되었습니다!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}