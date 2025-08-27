'use client';

import React, { useState, useEffect } from 'react';

type VisibilityLevel = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

interface FollowPrivacySettings {
  followersVisibility: VisibilityLevel;
  followingVisibility: VisibilityLevel;
}

interface FollowPrivacySettingsProps {
  initialSettings?: FollowPrivacySettings;
  onSettingsChange?: (settings: FollowPrivacySettings) => void;
  isLoading?: boolean;
  className?: string;
}

const FollowPrivacySettings: React.FC<FollowPrivacySettingsProps> = ({
  initialSettings,
  onSettingsChange,
  isLoading = false,
  className = '',
}) => {
  const [settings, setSettings] = useState<FollowPrivacySettings>({
    followersVisibility: 'PUBLIC',
    followingVisibility: 'PUBLIC',
    ...initialSettings,
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({ ...prev, ...initialSettings }));
    }
  }, [initialSettings]);

  const handleVisibilityChange = (
    type: 'followersVisibility' | 'followingVisibility',
    value: VisibilityLevel
  ) => {
    const newSettings = { ...settings, [type]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const getVisibilityLabel = (level: VisibilityLevel): string => {
    switch (level) {
      case 'PUBLIC':
        return '전체 공개';
      case 'FRIENDS':
        return '친구만';
      case 'PRIVATE':
        return '비공개';
      default:
        return '전체 공개';
    }
  };

  const getVisibilityDescription = (level: VisibilityLevel): string => {
    switch (level) {
      case 'PUBLIC':
        return '누구나 볼 수 있습니다';
      case 'FRIENDS':
        return '나를 팔로우하는 사람들만 볼 수 있습니다';
      case 'PRIVATE':
        return '아무도 볼 수 없습니다';
      default:
        return '';
    }
  };

  const renderVisibilitySelector = (
    title: string,
    description: string,
    type: 'followersVisibility' | 'followingVisibility',
    currentValue: VisibilityLevel
  ) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="mb-3">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      
      <div className="space-y-2">
        {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as VisibilityLevel[]).map((level) => (
          <label
            key={level}
            className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
              currentValue === level
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name={type}
              value={level}
              checked={currentValue === level}
              onChange={(e) => handleVisibilityChange(type, e.target.value as VisibilityLevel)}
              disabled={isLoading}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {getVisibilityLabel(level)}
              </div>
              <div className="text-xs text-gray-500">
                {getVisibilityDescription(level)}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          팔로우 목록 공개 설정
        </h2>
        <p className="text-sm text-gray-600">
          팔로워와 팔로잉 목록을 누구에게 공개할지 설정할 수 있습니다.
        </p>
      </div>

      {renderVisibilitySelector(
        '팔로워 목록 공개 범위',
        '나를 팔로우하는 사람들의 목록을 누구에게 보여줄지 설정합니다.',
        'followersVisibility',
        settings.followersVisibility
      )}

      {renderVisibilitySelector(
        '팔로잉 목록 공개 범위',
        '내가 팔로우하는 사람들의 목록을 누구에게 보여줄지 설정합니다.',
        'followingVisibility',
        settings.followingVisibility
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">설정을 저장하는 중...</span>
        </div>
      )}
    </div>
  );
};

export default FollowPrivacySettings;