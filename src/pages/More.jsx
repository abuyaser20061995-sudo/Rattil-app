import { Link } from 'react-router-dom';
import { Star, ListChecks, DatabaseBackup, Settings as SettingsIcon, StickyNote } from 'lucide-react';

export default function More() {
  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>المزيد</h1>
      <Link to="/ayati" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Star size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 600 }}>آياتي</span>
      </Link>
      <Link to="/notes" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StickyNote size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 600 }}>ملاحظاتي</span>
      </Link>
      <Link to="/manage-suggestions" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ListChecks size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 600 }}>إدارة مقترحات «ماذا أقرأ؟»</span>
      </Link>
      <Link to="/backup" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <DatabaseBackup size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 600 }}>النسخ الاحتياطي</span>
      </Link>
      <Link to="/settings" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SettingsIcon size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 600 }}>الإعدادات</span>
      </Link>
    </div>
  );
}
