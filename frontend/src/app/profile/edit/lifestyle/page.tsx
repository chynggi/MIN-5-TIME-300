'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifestyleSelector, LifestyleData } from '@/components/profile';

interface LifestyleEditData {
  workStyleOptions: string[];
  exerciseFrequencyOptions: string[];
  sleepPatternOptions: string[];
  socialActivityOptions: string[];
  currentSelections: LifestyleData;
}

export default function ProfileEditLifestylePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lifestyleData, setLifestyleData] = useState<LifestyleEditData>({
    workStyleOptions: [],
    exerciseFrequencyOptions: [],
    sleepPatternOptions: [],
    socialActivityOptions: [],
    currentSelections: {}
  });
  const [selectedLifestyle, setSelectedLifestyle] = useState<LifestyleData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLifestyleData();
  }, []);

  const loadLifestyleData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/profile/edit/lifestyle', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setLifestyleData(data);
      setSelectedLifestyle(data.currentSelections);
    } catch (error) {
      console.error('라이프스타일 데이터 로드 오류:', error);
      alert('라이프스타일 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLifestyleChange = (lifestyle: LifestyleData) => {
    setSelectedLifestyle(lifestyle);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
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
        router.back();
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
          <p className="text-gray-600">라이프스타일 데이터를 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">라이프스타일 편집</h1>
              <p className="text-gray-600">라이프스타일을 수정하여 더 나은 매칭을 받아보세요</p>
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
