'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InterestSelector, Interest } from '@/components/profile';
import apiRequest from '../../../../lib/api';

interface InterestEditData {
  availableInterests: string[];
  selectedInterests: Interest[];
}

export default function ProfileEditInterestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interestData, setInterestData] = useState<InterestEditData>({
    availableInterests: [],
    selectedInterests: []
  });
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInterestData();
  }, []);

  const loadInterestData = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/profile/edit/interests');
      setInterestData(data);
      setSelectedInterests(data.selectedInterests);
    } catch (error) {
      console.error('관심사 데이터 로드 오류:', error);
      alert('관심사 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestsChange = (interests: Interest[]) => {
    setSelectedInterests(interests);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiRequest('/profile/interests', {
        method: 'POST',
        body: JSON.stringify({
          interests: selectedInterests.map((item, index) => ({
            interest: item.interest,
            priority: index + 1
          }))
        })
      });

      setHasChanges(false);
      alert('관심사가 저장되었습니다.');
      router.back();
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
        router.back();
      }
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관심사 데이터를 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">관심사 편집</h1>
              <p className="text-gray-600">관심사를 수정하여 더 나은 추천을 받아보세요</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              ← 뒤로가기
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="py-8">
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
      </div>

      {/* 하단 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
            disabled={saving}
          >
            취소
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`
              px-8 py-2 rounded-lg font-medium transition-all
              ${saving || !hasChanges
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
  );
}
