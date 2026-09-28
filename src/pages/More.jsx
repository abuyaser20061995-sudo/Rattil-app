import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function More() {
  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>المزيد</h1>
      <Link to="/ayati" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Star size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 600 }}>آياتي</span>
      </Link>
    </div>
  );
}
