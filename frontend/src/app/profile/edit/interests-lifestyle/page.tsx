'use client';

import React, { useState, useEffect } from 'react';
import { InterestSelector, LifestyleSelector, Interest, LifestyleData } from '@/components/profile';

// API 타입 정의 (백엔드 API와 일치)
interface InterestEditData {
  availableInterests: string[];
  selectedInterests: Interest[];
}

interface LifestyleEditData {
  workStyleOptions: string[];
  exerciseFrequencyOptions: string[];
  sleepPatternOptions: string[];
  socialActivityOptions: string[];
  currentSelections: LifestyleData;
}

export default function ProfileEditInterestsLifestylePage() {
  const [currentTab, setCurrentTab] = useState<'interests' | 'lifestyle'>('interests');
  const [loading, setLoading] = useState(true);
  
  // 관심사 관련 상태
  const [interestData, setInterestData] = useState<InterestEditData>({
    availableInterests: [],
    selectedInterests: []
  });
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  
  // 라이프스타일 관련 상태
  const [lifestyleData, setLifestyleData] = useState<LifestyleEditData>({
    workStyleOptions: [],
    exerciseFrequencyOptions: [],
    sleepPatternOptions: [],
    socialActivityOptions: [],
    currentSelections: {}
  });
  const [selectedLifestyle, setSelectedLifestyle] = useState<LifestyleData>({});

  // 변경사항 추적
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // 데이터 로드
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // 관심사 데이터 로드
      const interestResponse = await fetch('/api/v1/profile/edit/interests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const interestResult = await interestResponse.json();
      setInterestData(interestResult);
      setSelectedInterests(interestResult.selectedInterests);

      // 라이프스타일 데이터 로드
      const lifestyleResponse = await fetch('/api/v1/profile/edit/lifestyle', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const lifestyleResult = await lifestyleResponse.json();
      setLifestyleData(lifestyleResult);
      setSelectedLifestyle(lifestyleResult.currentSelections);

    } catch (error) {
      console.error('프로필 데이터 로드 오류:', error);
      alert('프로필 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestsChange = (interests: Interest[]) => {
    setSelectedInterests(interests);
    setHasChanges(true);
  };

  const handleLifestyleChange = (lifestyle: LifestyleData) => {
    setSelectedLifestyle(lifestyle);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (currentTab === 'interests') {
        // 관심사 저장
        const response = await fetch('/api/v1/profile/interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            interests: selectedInterests.map((item, index) => ({
              interest: item.interest,
              priority: index + 1
            }))
          })
        });

        if (response.ok) {
          setHasChanges(false);
          alert('관심사가 저장되었습니다.');
        }
      } else {
        // 라이프스타일 저장
        const response = await fetch('/api/v1/profile/lifestyle', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(selectedLifestyle)
        });

        if (response.ok) {
          setHasChanges(false);
          alert('라이프스타일이 저장되었습니다.');
        }
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('변경사항이 있습니다. 정말 취소하시겠습니까?')) {
        // 원래 데이터로 복원
        setSelectedInterests(interestData.selectedInterests);
        setSelectedLifestyle(lifestyleData.currentSelections);
        setHasChanges(false);
      }
    }
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
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              ← 뒤로가기
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6">
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
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="py-8">
        {currentTab === 'interests' && (
          <InterestSelector
            availableInterests={interestData.availableInterests}
            preSelectedInterests={interestData.selectedInterests}
            onInterestsChange={handleInterestsChange}
            mode="edit"
            title="관심사 수정"
            description="변경하고 싶은 관심사를 선택해주세요"
            minSelections={1}
            maxSelections={15}
          />
        )}

        {currentTab === 'lifestyle' && (
          <LifestyleSelector
            options={{
              workStyleOptions: lifestyleData.workStyleOptions,
              exerciseFrequencyOptions: lifestyleData.exerciseFrequencyOptions,
              sleepPatternOptions: lifestyleData.sleepPatternOptions,
              socialActivityOptions: lifestyleData.socialActivityOptions
            }}
            preSelectedValues={lifestyleData.currentSelections}
            onLifestyleChange={handleLifestyleChange}
            mode="edit"
            title="라이프스타일 수정"
            description="변경하고 싶은 라이프스타일을 선택해주세요"
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
    </div>
  );
}