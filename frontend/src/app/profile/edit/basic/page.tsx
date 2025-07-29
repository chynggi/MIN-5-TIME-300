'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../profile.module.css';
import { profileApi } from '../../../../services/profile-api';

interface BasicInfo {
  name: string;
  birthDate: string;
  gender: string;
  mbti: string;
  bio: string;
}

export default function BasicInfoEditPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BasicInfo>({
    name: '',
    birthDate: '',
    gender: '',
    mbti: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const profile = await profileApi.getProfile();
      setFormData({
        name: profile.username || '',
        birthDate: '1995-01-01', // TODO: 백엔드에서 생년월일 필드 추가 필요
        gender: 'male', // TODO: 백엔드에서 성별 필드 추가 필요
        mbti: profile.mbti || '',
        bio: 'Happy Day!! 😊' // TODO: 백엔드에서 자기소개 필드 추가 필요
      });
      setLoading(false);
    } catch (err) {
      console.error('프로필 데이터 로드 실패:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BasicInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({
        username: formData.name,
        mbti: formData.mbti,
      });
      router.back();
    } catch (err) {
      console.error('프로필 저장 실패:', err);
      alert('프로필 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const genderOptions = [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
    { value: 'other', label: '기타' }
  ];

  const mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          프로필 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.editHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← 뒤로
        </button>
        <h1 className={styles.editTitle}>기본 정보</h1>
      </div>

      <div className={styles.editForm}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>이름</label>
          <input
            type="text"
            className={styles.formInput}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>생년월일</label>
          <input
            type="date"
            className={styles.formInput}
            value={formData.birthDate}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            * 생년월일은 아직 백엔드 구현 대기 중입니다.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>성별</label>
          <div className={styles.radioGroup}>
            {genderOptions.map((option) => (
              <label key={option.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={formData.gender === option.value}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <small style={{ color: '#666', fontSize: '12px' }}>
            * 성별은 아직 백엔드 구현 대기 중입니다.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>MBTI</label>
          <select
            className={styles.formSelect}
            value={formData.mbti}
            onChange={(e) => handleInputChange('mbti', e.target.value)}
          >
            <option value="">선택하세요</option>
            {mbtiOptions.map((mbti) => (
              <option key={mbti} value={mbti}>{mbti}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>자기소개</label>
          <textarea
            className={styles.formTextarea}
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="자신을 소개해보세요"
            rows={3}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            * 자기소개는 아직 백엔드 구현 대기 중입니다.
          </small>
        </div>

        <button 
          className={styles.saveButton} 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
