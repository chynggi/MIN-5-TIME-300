import React from 'react';
import styles from './activity-indicator.module.css';

interface ActivityIndicatorProps {
  score?: number; // 0-100
  size?: number;
  onClick?: () => void;
}

/**
 * 활동지수 하트 아이콘 + 퍼센트
 * 0~100 점수에 따라 색상 그라데이션/톤 변화
 */
export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ score = 0, size = 52, onClick }) => {
  const clamped = Math.min(100, Math.max(0, score));

  // 색상 구간 정의 (Carrot 마켓 온도 유사 컨셉)
  // 0-20 차가운 회색/파랑, 20-40 보라, 40-60 핑크, 60-80 주황, 80-100 레드
  const getGradient = (value: number) => {
    if (value < 20) return 'linear-gradient(135deg,#4b5563,#6b7280)';
    if (value < 40) return 'linear-gradient(135deg,#6366f1,#a855f7)';
    if (value < 60) return 'linear-gradient(135deg,#ec4899,#f472b6)';
    if (value < 80) return 'linear-gradient(135deg,#f97316,#fb923c)';
    return 'linear-gradient(135deg,#dc2626,#f87171)';
  };

  const gradient = getGradient(clamped);

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }} onClick={onClick} title={`활동지수 ${clamped}%`}>
      <div className={styles.heartShell}>
        <div className={styles.fillMask}>
          <div className={styles.fill} style={{ background: gradient, height: `${clamped}%` }} />
        </div>
        <div className={styles.outline}>❤</div>
      </div>
      <div className={styles.score}>{clamped}%</div>
      <div className={styles.label}>활동지수</div>
    </div>
  );
};

export default ActivityIndicator;