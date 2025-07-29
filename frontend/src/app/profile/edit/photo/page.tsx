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
        currentPhoto: profile.profileImage || null
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
        formData.append('profileImage', photoData.file);
        
        await profileApi.uploadProfileImage(formData);
        alert('프로필 사진이 업데이트되었습니다.');
      } else if (photoData.currentPhoto === null && !photoData.file) {
        // 사진 삭제
        await profileApi.deleteProfileImage();
        alert('프로필 사진이 삭제되었습니다.');
      }
      
      router.back();
    } catch (err) {
      console.error('프로필 사진 저장 실패:', err);
      alert('프로필 사진 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          프로필 사진을 불러오는 중...
        </div>
      </div>
    );
  }

  const displayPhoto = photoData.previewUrl || photoData.currentPhoto;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.editHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← 뒤로
        </button>
        <h1 className={styles.editTitle}>프로필 사진</h1>
      </div>

      <div className={styles.editForm}>
        <div className={styles.photoContainer}>
          <div className={styles.currentPhoto}>
            {displayPhoto ? (
              <img src={displayPhoto} alt="프로필 사진" />
            ) : (
              <div className={styles.photoPlaceholder}>
                👤
              </div>
            )}
          </div>

          <div className={styles.photoButtons}>
            <button 
              className={`${styles.photoButton} ${styles.primary}`}
              onClick={handlePhotoUpload}
            >
              📷 사진 선택
            </button>
            {displayPhoto && (
              <button 
                className={styles.photoButton}
                onClick={handlePhotoRemove}
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
          <small style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
            • 권장 크기: 400x400px 이상<br/>
            • 지원 형식: JPG, PNG, GIF<br/>
            • 최대 용량: 5MB<br/>
            * 프로필 사진 업로드는 백엔드 구현 대기 중입니다.
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
