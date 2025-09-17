'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../profile.module.css';
import { profileApi } from '../../../../services/profile-api';

interface PhotoData {
  currentPhoto: string | null;
  file: File | null;
  previewUrl: string | null;
}

export default function PhotoEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoData, setPhotoData] = useState<PhotoData>({
    currentPhoto: null,
    file: null,
    previewUrl: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentPhoto();
  }, []);

  const loadCurrentPhoto = async () => {
    try {
      const profile = await profileApi.getProfile();
      setPhotoData(prev => ({
        ...prev,
        currentPhoto: profile.profileImageUrl 
          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${profile.profileImageUrl}`
          : null
      }));
      setLoading(false);
    } catch (err) {
      console.error('현재 프로필 사진 로드 실패:', err);
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPhotoData(prev => ({
        ...prev,
        file,
        previewUrl
      }));
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoRemove = () => {
    setPhotoData({
      currentPhoto: null,
      file: null,
      previewUrl: null
    });
    
    // 파일 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (photoData.file) {
        // 새 사진 업로드
        const formData = new FormData();
        formData.append('file', photoData.file);
        
        await profileApi.uploadProfileImage(formData);
        alert('프로필 사진이 업데이트되었습니다.');
      } else if (photoData.currentPhoto === null && !photoData.file) {
        // 사진 삭제
        await profileApi.deleteProfileImage();
        alert('프로필 사진이 삭제되었습니다.');
      }
      
      // 프로필 페이지로 돌아가면서 새로고침
      router.push('/profile');
      router.refresh();
    } catch (err) {
      console.error('프로필 사진 저장 실패:', err);
      alert('프로필 사진 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.panel}>
          <div className={styles.loadingContainer}>프로필 사진을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  const displayPhoto = photoData.previewUrl || photoData.currentPhoto;

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
          <h1 className={styles.subPageTitle}>프로필 사진</h1>
        </header>

        <div className={styles.editForm}>
          <div className={styles.photoContainer}>
            <div className={styles.currentPhoto}>
              {displayPhoto ? (
                <img src={displayPhoto} alt="프로필 사진" />
              ) : (
                <div className={styles.photoPlaceholder} aria-label="기본 프로필 아이콘">
                  👤
                </div>
              )}
            </div>

            <div className={styles.photoButtons}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
                onClick={handlePhotoUpload}
                style={{ minWidth: '140px' }}
              >
                📷 사진 선택
              </button>
              {displayPhoto && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
                  onClick={handlePhotoRemove}
                  style={{ minWidth: '140px' }}
                >
                  🗑️ 사진 제거
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.hiddenFileInput}
            />
          </div>

          <div className={styles.formGroup}>
            <small style={{ color: 'var(--c-text-soft)', fontSize: '12px', textAlign: 'center', display: 'block', lineHeight: 1.5 }}>
              • 권장 크기: 400x400px 이상<br />
              • 지원 형식: JPG, PNG, GIF<br />
              • 최대 용량: 5MB<br />
            </small>
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
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
