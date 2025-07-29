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
    id: 'interests',
    title: '관심사',
    description: '취미, 관심 분야 설정',
    icon: '❤️',
    path: '/profile/edit/interests'
  },
  {
    id: 'lifestyle',
    title: '라이프스타일',
    description: '생활 패턴, 선호도 등',
    icon: '🌟',
    path: '/profile/edit/lifestyle'
  }
];

export default function ProfileEditPage() {
  const router = useRouter();

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.editHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← 뒤로
        </button>
        <h1 className={styles.editTitle}>프로필 편집</h1>
      </div>
      
      <div className={styles.editOptions}>
        {editOptions.map((option) => (
          <div 
            key={option.id}
            className={styles.editOption}
            onClick={() => handleOptionClick(option.path)}
          >
            <div className={styles.editOptionIcon}>
              {option.icon}
            </div>
            <div className={styles.editOptionContent}>
              <div className={styles.editOptionTitle}>{option.title}</div>
              <div className={styles.editOptionDesc}>{option.description}</div>
            </div>
            <div className={styles.editOptionArrow}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}
