import React from 'react';
import styles from './GradientBackgroundLayout.module.css';

interface GradientBackgroundLayoutProps {
  children: React.ReactNode;
  className?: string; // 내부 safe wrapper 추가 클래스
  fullBleed?: boolean; // 패딩/폭 제거 옵션
}

/**
 * 프로필 페이지와 동일한 감성의 재사용 가능한 배경 레이아웃.
 * App Router의 route segment layout 혹은 개별 페이지 wrapper로 활용.
 */
export default function GradientBackgroundLayout({ children, className, fullBleed }: GradientBackgroundLayoutProps) {
  const innerClass = [styles.inner];
  if (fullBleed) innerClass.push(styles.fullBleed);
  if (className) innerClass.push(className);
  return (
    <div className={styles.wrapper}>
      <div className={innerClass.join(' ')}>{children}</div>
    </div>
  );
}
