import styles from './SurahBanner.module.css';

function Medallion() {
  return (
    <svg className={styles.medallion} viewBox="0 0 64 64" width="60" height="60" aria-hidden="true">
      <circle className={styles.fill} cx="32" cy="32" r="30" />
      <circle className={styles.line} cx="32" cy="32" r="30" />
      <circle className={styles.thin} cx="32" cy="32" r="25" />
      <rect className={styles.line} x="16" y="16" width="32" height="32" />
      <rect className={styles.line} x="16" y="16" width="32" height="32" transform="rotate(45 32 32)" />
      <circle className={styles.core} cx="32" cy="32" r="7" />
      <circle className={styles.line} cx="32" cy="32" r="7" />
    </svg>
  );
}

export default function SurahBanner({ name }) {
  return (
    <span className={styles.banner}>
      <Medallion />
      <span className={styles.band}>
        <span className={styles.name}>سورة {name}</span>
      </span>
      <Medallion />
    </span>
  );
}
