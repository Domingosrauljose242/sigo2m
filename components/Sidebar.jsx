'use client';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', section: 'Principal', roles: ['superadmin', 'admin', 'user'] },
  { id: 'pagamentos', label: 'Pagamentos', icon: 'fa-credit-card', section: null, roles: ['superadmin', 'admin', 'user'] },
  { id: 'hospitais', label: 'Hospitais', icon: 'fa-hospital', section: 'Gestão', roles: ['superadmin', 'admin', 'user'] },
  { id: 'medicos', label: 'Médicos', icon: 'fa-user-doctor', section: null, roles: ['superadmin', 'admin', 'user'] },
  { id: 'notificacoes', label: 'Notificações', icon: 'fa-bell', section: 'Sistema', roles: ['superadmin', 'admin', 'user'] },
  { id: 'auditoria', label: 'Registo de Atividade', icon: 'fa-shield-halved', section: null, roles: ['superadmin', 'admin'] },
  { id: 'configuracoes', label: 'Configurações', icon: 'fa-gear', section: null, roles: ['superadmin', 'admin'] },
];

const ROLE_LABELS = {
  superadmin: 'Super Administrador',
  admin: 'Administrador',
  user: 'Utilizador',
};

export default function Sidebar({ active, onNavigate, user, onLogout }) {
  const role = user?.role || 'user';
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));
  const initials = ((user?.nome_completo || user?.username || 'AD')).substring(0, 2).toUpperCase();

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
        {visibleItems.map((item, idx) => (
          <div key={item.id || idx}>
            {item.section && (
              <div className="sidebar-section-label">{item.section}</div>
            )}
            <button
              className={`nav-item${active === item.id ? ' active' : ''}`}
              onClick={() => item.id && onNavigate(item.id)}
            >
              <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            </button>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="sidebar-footer-name">{user?.nome_completo || user?.username || 'Utilizador'}</div>
          <div className="sidebar-footer-role">{ROLE_LABELS[role] || role}</div>
        </div>
        <button
          onClick={onLogout}
          title="Terminar sessão"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '14px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <i className="fas fa-right-from-bracket" />
        </button>
      </div>
    </aside>
  );
}
