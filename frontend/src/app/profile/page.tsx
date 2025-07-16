import styles from './profile.module.css';

export default function ProfilePage() {
  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {/* 프로필 이미지 */}
          <span>INFJ</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>137</div>
            <div className={styles.statLabel}>일기</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>39</div>
            <div className={styles.statLabel}>팔로워</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>27</div>
            <div className={styles.statLabel}>팔로잉</div>
          </div>
        </div>
      </div>
      <div className={styles.profileName}>Unknown</div>
      <div className={styles.profileMsg}>Happy Day!! 😊</div>
      <div className={styles.btnRow}>
        <button className={styles.btn}>프로필 편집</button>
        <button className={`${styles.btn} ${styles.secondary}`}>프로필 공개</button>
      </div>
      <div className={styles.lpgCircle}>
        <span className={styles.lpgText}>LPG 💖 94.4%</span>
        {/* 하트, 아이콘 등은 추후 추가 */}
      </div>
      <div className={styles.iconRow}>
        <span className={`${styles.icon} ${styles.active}`}>📖</span>
        <span className={styles.icon}>💬</span>
        <span className={styles.icon}>👥</span>
        <span className={styles.icon}>🙋‍♂️</span>
      </div>
    </div>
  );
}
