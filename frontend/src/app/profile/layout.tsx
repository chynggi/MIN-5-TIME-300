import styles from './profileLayout.module.css';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.outerBackground}>
      <div className={styles.innerSafe}>
        {children}
      </div>
    </div>
  );
}
