'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const now = new Date();
  const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dateStr = `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

  const [stats, setStats] = useState({ totalHospitais: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getDashboardStats();
      window.electron.onDashboardStats((data) => {
        if (data.success) setStats(data);
      });
      return () => {
        window.electron.removeAllListeners('dashboard-stats-result');
      };
    }
  }, []);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h2>Bom dia, Administrador! 👋</h2>
          <p>{dateStr}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="welcome-btn primary">💳 Registar Pagamento</button>
            <button className="welcome-btn">📊 Ver Relatório</button>
          </div>
        </div>
        <div className="welcome-date">
          <div className="day">{String(now.getDate()).padStart(2, '0')}</div>
          <div className="month">{months[now.getMonth()].substring(0, 3).toUpperCase()}. {now.getFullYear()}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-row">
        <div className="metric-card blue">
          <div className="metric-icon blue">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div className="metric-label">Médicos Activos</div>
            <div className="metric-value">0</div>
            <div className="metric-trend up">Sem dados ainda</div>
          </div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon green">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div className="metric-label">Pagamentos em Dia</div>
            <div className="metric-value">0</div>
            <div className="metric-trend up">Aguardando uso</div>
          </div>
        </div>
        <div className="metric-card orange">
          <div className="metric-icon orange">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div className="metric-label">Pagamentos em Atraso</div>
            <div className="metric-value">0</div>
            <div className="metric-trend down">Sem movimentos</div>
          </div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div className="metric-label">Receita Mensal</div>
            <div className="metric-value">AOA 0</div>
            <div className="metric-trend up">Os valores aparecerão aqui</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Receitas e Pagamentos Mensais</h3>
              <span className="panel-sub">Jan – Dez 2026</span>
            </div>
          </div>
          <div style={{ height: 280, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Os gráficos aparecerão conforme o uso do sistema.</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Estado de Quotas</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--oma-navy)' }}>0%</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Taxa de Pagamento</span>
          </div>
          <div className="quota-list">
            <div className="quota-row">
              <span className="quota-label"><span className="quota-dot" style={{ background: 'var(--green)' }} /> Em dia</span>
              <div className="quota-bar-wrap">
                <div className="quota-bar"><div className="quota-bar-fill" style={{ width: '0%', background: 'var(--green)' }} /></div>
                <span className="quota-count">0</span>
              </div>
            </div>
            <div className="quota-row">
              <span className="quota-label"><span className="quota-dot" style={{ background: 'var(--orange)' }} /> Em atraso</span>
              <div className="quota-bar-wrap">
                <div className="quota-bar"><div className="quota-bar-fill" style={{ width: '100%', background: 'var(--orange)' }} /></div>
                <span className="quota-count">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats info */}
      <div className="panel">
        <div className="panel-header">
          <h3>Resumo do Sistema</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '8px 0' }}>
          Unidades de Saúde Registadas: <strong style={{ color: 'var(--oma-navy)' }}>{stats.totalHospitais}</strong>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8 }}>
          As informações do dashboard aparecerão aqui conforme o sistema for utilizado.
        </p>
      </div>
    </div>
  );
}
