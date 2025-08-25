'use client';

import React, { useState } from 'react';
import { InterestSelector, LifestyleSelector, Interest, LifestyleData } from '@/components/profile';

export default function SignupInterestsPage() {
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<LifestyleData>({});
  const [currentStep, setCurrentStep] = useState<'interests' | 'lifestyle'>('interests');

  const handleInterestsChange = (interests: Interest[]) => {
    setSelectedInterests(interests);
  };

  const handleLifestyleChange = (lifestyle: LifestyleData) => {
    setSelectedLifestyle(lifestyle);
  };

  const handleNext = () => {
    if (currentStep === 'interests') {
      if (selectedInterests.length >= 3) {
        setCurrentStep('lifestyle');
      } else {
        alert('최소 3개 이상의 관심사를 선택해주세요.');
      }
    } else {
      // 회원가입 완료 처리
      handleSignupComplete();
    }
  };

  const handleBack = () => {
    if (currentStep === 'lifestyle') {
      setCurrentStep('interests');
    }
    // interests에서 뒤로가기는 이전 회원가입 스텝으로
  };

  const handleSignupComplete = async () => {
    try {
      // 회원가입 API 호출
      const signupData = {
        // ... 기본 정보 (이전 스텝에서 수집)
        interests: selectedInterests.map(item => item.interest),
        ...selectedLifestyle
      };
      
      // API 호출 로직
      console.log('회원가입 데이터:', signupData);
      
      // 성공 시 대시보드로 이동
      // router.push('/dashboard');
      
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  const canProceed = () => {
    if (currentStep === 'interests') {
      return selectedInterests.length >= 3;
    }
    return true; // 라이프스타일은 모두 선택사항
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 진행 표시바 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-800"
              >
                ← 이전
              </button>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div className={`w-3 h-3 rounded-full ${currentStep === 'interests' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${currentStep === 'lifestyle' ? 'bg-blue-500' : 'bg-gray-300'}`} />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {currentStep === 'interests' ? '3/4' : '4/4'} 단계
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="py-8">
        {currentStep === 'interests' && (
          <InterestSelector
            onInterestsChange={handleInterestsChange}
            mode="signup"
            title="관심사를 선택해주세요"
            description="나와 비슷한 관심사를 가진 사람들과 연결될 수 있어요"
            minSelections={3}
            maxSelections={10}
          />
        )}

        {currentStep === 'lifestyle' && (
          <LifestyleSelector
            onLifestyleChange={handleLifestyleChange}
            mode="signup"
            title="라이프스타일을 알려주세요"
            description="더 나은 추천과 매칭을 위해 라이프스타일을 선택해주세요"
          />
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-800"
          >
            이전 단계
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all
              ${canProceed()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {currentStep === 'interests' ? '다음 단계' : '회원가입 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}