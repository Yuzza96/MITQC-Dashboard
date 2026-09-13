import { ShieldCheck, Home, ClipboardList, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, badgeClass: 'badge-slate' },
  { id: 'form', label: 'New Inspection', icon: ClipboardList, badgeClass: 'badge-green' },
  { id: 'report', label: 'Reports', icon: BarChart3, badgeClass: 'badge-orange' },
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
