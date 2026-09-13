import { ShieldCheck, ClipboardList } from 'lucide-react';

// Temporary: other menus (Home, Reports, ...) aren't wired back in yet.
// Add entries back to this list once their panel is ready.
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
