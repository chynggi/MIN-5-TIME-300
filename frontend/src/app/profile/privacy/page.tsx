'use client';

import { useEffect } from 'react';
import styles from '../profile.module.css';
import { useRouter } from 'next/navigation';

// 기존 공개 설정 페이지는 새로운 통합 설정(/profile/settings)으로 이동되었습니다.
// 이 페이지는 하위 호환을 위해 남겨두고 즉시 리다이렉트 + 안내 UI만 제공합니다.

export default function LegacyPrivacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 약간의 딜레이 후 설정 페이지로 이동 (UX: 안내 문구 확인 가능)
    const t = setTimeout(() => {
      router.replace('/profile/settings');
    }, 600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <header className={styles.subPageHeader}>
          <h1 className={styles.subPageTitle}>공개 설정 이동</h1>
        </header>
        <p style={{ fontSize: '.75rem', color: 'var(--c-text-soft)', lineHeight: 1.5, marginTop: '.6rem' }}>
          공개/개인정보 관련 설정은 이제 <strong style={{ color: 'var(--c-text)' }}>환경설정 &gt; 개인정보</strong> 탭으로 이동되었습니다.<br/>
          잠시 후 자동으로 새 설정 페이지로 이동합니다...
        </p>
        <div style={{ marginTop: '1.2rem' }}>
          <button
            type="button"
            onClick={() => router.replace('/profile/settings')}
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            style={{ width:'100%' }}
          >
            바로 이동하기
          </button>
        </div>
      </div>
    </div>
  );
}
