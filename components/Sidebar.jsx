'use client';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', section: 'Principal' },
  { id: 'pagamentos', label: 'Pagamentos', icon: 'fa-credit-card', badge: 0, section: null },
  { id: null, label: 'Recibos', icon: 'fa-file-invoice', section: null },
  { id: 'hospitais', label: 'Hospitais', icon: 'fa-hospital', section: 'Gestão' },
  { id: 'medicos', label: 'Médicos', icon: 'fa-user-doctor', section: null },
  { id: null, label: 'Eventos', icon: 'fa-calendar', section: null },
  { id: null, label: 'Relatórios', icon: 'fa-chart-bar', section: 'Sistema' },
  { id: null, label: 'Notificações', icon: 'fa-bell', badge: 5, section: null },
  { id: null, label: 'Configurações', icon: 'fa-gear', section: null },
];

export default function Sidebar({ active, onNavigate }) {
  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{"username":"Administrador"}')
    : { username: 'Administrador' };

  const initials = (user.username || 'AD').substring(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <i className="fas fa-stethoscope" />
        </div>
        <div>
          <div className="sidebar-brand-name">SIGO2M</div>
          <div className="sidebar-brand-sub">Ordem dos Médicos</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ paddingTop: 8 }}>
        {NAV_ITEMS.map((item, idx) => (
          <div key={idx}>
            {item.section && (
              <div className="sidebar-section-label">{item.section}</div>
            )}
            <button
              className={`nav-item${active === item.id ? ' active' : ''}`}
              onClick={() => item.id && onNavigate(item.id)}
              style={{ opacity: item.id ? 1 : 0.45 }}
              disabled={!item.id}
            >
              <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">{initials}</div>
        <div>
          <div className="sidebar-footer-name">{user.username || 'Administrador'}</div>
          <div className="sidebar-footer-role">Superadmin</div>
        </div>
      </div>
    </aside>
  );
}
