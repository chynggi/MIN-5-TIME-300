'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../profile.module.css';
import { profileApi } from '../../../../services/profile-api';
import apiRequest from '../../../../lib/api';

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
      // apiRequest 사용하여 기본 정보 API 호출
      const basicInfo = await apiRequest('/profile/edit/basic-info');
      
      // birthDate 처리
      let formattedBirthDate = '';
      if (basicInfo.birthDate) {
        // 다양한 날짜 형식 처리
        if (typeof basicInfo.birthDate === 'string') {
          if (basicInfo.birthDate.includes('T')) {
            // ISO 형식 (2024-01-01T00:00:00.000Z)
            formattedBirthDate = basicInfo.birthDate.split('T')[0];
          } else if (basicInfo.birthDate.includes('-')) {
            // 이미 YYYY-MM-DD 형식
            formattedBirthDate = basicInfo.birthDate;
          } else {
            // 다른 형식일 경우 Date 객체로 변환 시도
            const date = new Date(basicInfo.birthDate);
            if (!isNaN(date.getTime())) {
              formattedBirthDate = date.toISOString().split('T')[0];
            }
          }
        } else if (basicInfo.birthDate instanceof Date) {
          formattedBirthDate = basicInfo.birthDate.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        name: basicInfo.username || '',
        birthDate: formattedBirthDate || '', // 빈 값으로 설정하여 사용자가 직접 입력하도록 함
        gender: 'male', // TODO: 백엔드에서 성별 필드 추가 필요
        mbti: basicInfo.mbti || '',
        bio: basicInfo.bio || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('프로필 데이터 로드 실패:', err);
      // 실패 시 기본값으로 설정
      setFormData({
        name: '',
        birthDate: '',
        gender: 'male',
        mbti: '',
        bio: ''
      });
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
      await apiRequest('/profile/basic', {
        method: 'PUT',
        body: JSON.stringify({
          username: formData.name,
          mbti: formData.mbti,
          bio: formData.bio,
          birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined
        })
      });

      alert('프로필이 저장되었습니다.');
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
      <div className={styles.container}>
        <div className={styles.panel}>
          <div className={styles.loadingContainer}>프로필 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <header className={styles.subPageHeader}>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
            onClick={() => router.back()}
            style={{ flex: '0 0 auto', minWidth: 'auto', padding: '.55rem .9rem' }}
            aria-label="이전 페이지로 돌아가기"
          >
            ←
          </button>
          <h1 className={styles.subPageTitle}>기본 정보</h1>
        </header>

        <form className={styles.editForm} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              className={styles.formInput}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="이름을 입력하세요"
              autoComplete="name"
            />
          </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="birthDate">생년월일</label>
              <input
                id="birthDate"
                type="date"
                className={styles.formInput}
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>성별</span>
            <div className={styles.radioGroup} role="radiogroup" aria-label="성별 선택">
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
            <small style={{ color: '#666', fontSize: '12px' }}>* 성별은 아직 백엔드 구현 대기 중입니다.</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="mbti">MBTI</label>
            <select
              id="mbti"
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
            <label className={styles.formLabel} htmlFor="bio">자기소개</label>
            <textarea
              id="bio"
              className={styles.formTextarea}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="자신을 소개해보세요"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
              onClick={() => router.back()}
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
