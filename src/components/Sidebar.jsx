import { ShieldCheck, ClipboardList } from 'lucide-react';

// Sementara: menu lain (Home, Reports, ...) belum ditambah semula.
// Tambah balik entri dalam senarai ni bila panel tu dah siap.
const NAV_ITEMS = [
  { id: 'routecard', label: 'Route Card', icon: ClipboardList, badgeClass: 'badge-green' },
];

export default function Sidebar({ activePanel, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><ShieldCheck /></div>
        <div className="logo-text">
          <span>MITQC</span>
          <small>Quality Control</small>
        </div>
      </div>
      <nav>
        <p className="nav-label">MENU</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon, badgeClass }) => (
          <button
            key={id}
            className={'nav-btn' + (activePanel === id ? ' active' : '')}
            onClick={() => onNavigate(id)}
          >
            <span className={`nav-icon-badge ${badgeClass}`}><Icon /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
