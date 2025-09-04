'use client';

import { useRouter } from 'next/navigation';
import styles from '../profile.module.css';

const editOptions = [
  {
    id: 'basic',
    title: '기본 정보',
    description: '이름, 생년월일, 성별 등',
    icon: '👤',
    path: '/profile/edit/basic'
  },
  {
    id: 'photo',
    title: '프로필 사진',
    description: '프로필 이미지 변경',
    icon: '📷',
    path: '/profile/edit/photo'
  },
  {
    id: 'interests-lifestyle',
    title: '관심사 & 라이프스타일',
    description: '취미, 관심 분야, 생활 패턴 설정',
    icon: '❤️🌟',
    path: '/profile/edit/interests-lifestyle'
  }
];

export default function ProfileEditPage() {
  const router = useRouter();

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

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
          <h1 className={styles.subPageTitle}>프로필 편집</h1>
        </header>
        <div className={styles.editOptions} style={{ marginTop: '.25rem' }}>
          {editOptions.map((option) => (
            <div 
              key={option.id}
              className={styles.editOption}
              onClick={() => handleOptionClick(option.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOptionClick(option.path)}
              aria-label={`${option.title} 설정으로 이동`}
            >
              <div className={styles.editOptionIcon} aria-hidden="true">
                {option.icon}
              </div>
              <div className={styles.editOptionContent}>
                <div className={styles.editOptionTitle}>{option.title}</div>
                <div className={styles.editOptionDesc}>{option.description}</div>
              </div>
              <div className={styles.editOptionArrow} aria-hidden="true">›</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
