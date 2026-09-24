import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Brain, RotateCcw, Menu } from 'lucide-react';
import styles from './BottomNav.module.css';

const items = [
  { to: '/', icon: Home, label: 'الرئيسية' },
  { to: '/mushaf', icon: BookOpen, label: 'المصحف' },
  { to: '/memorization', icon: Brain, label: 'الحفظ' },
  { to: '/review', icon: RotateCcw, label: 'المراجعة' },
  { to: '/more', icon: Menu, label: 'المزيد' }
];

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
