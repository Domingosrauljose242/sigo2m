'use client';

import { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

function formatMoeda(valor) {
  return `AOA ${Number(valor || 0).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const now = new Date();
  const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dateStr = `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

  const [stats, setStats] = useState({
    totalHospitais: 0,
    totalMedicos: 0,
    receitaTotal: 0,
    pagosMes: 0,
    emAtrasoMes: 0,
    pagamentosMensais: []
  });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getFullDashboardStats();
      window.electron.onFullDashboardStats((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      });
      return () => {
        window.electron.removeAllListeners('full-dashboard-stats-result');
      };
    }
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = months.map(m => m.substring(0, 3));
    const data = new Array(12).fill(0);
    
    if (stats.pagamentosMensais && stats.pagamentosMensais.length > 0) {
      stats.pagamentosMensais.forEach(row => {
        if (row.mes_referencia >= 1 && row.mes_referencia <= 12) {
          data[row.mes_referencia - 1] = row.total;
        }
      });
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Receitas (AOA)',
          data,
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => (v >= 1000 ? (v/1000) + 'k' : v) } },
          x: { grid: { display: false } }
        }
      }
    });

    // Cleanup: destroy chart when component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [stats]);

  const taxaPagos = stats.totalMedicos > 0 ? Math.round((stats.pagosMes / stats.totalMedicos) * 100) : 0;
  const taxaAtraso = stats.totalMedicos > 0 ? Math.round(((stats.emAtrasoMes || 0) / stats.totalMedicos) * 100) : 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h2>Bom dia, Administrador! 👋</h2>
          <p>{dateStr}</p>
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
            <div className="metric-value">{stats.totalMedicos}</div>
            <div className="metric-trend up">Total Registado</div>
          </div>
        </div>
        <div className="metric-card green">
          <div className="metric-icon green">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div className="metric-label">Pagamentos em Dia (Mês)</div>
            <div className="metric-value">{stats.pagosMes}</div>
            <div className="metric-trend up">{taxaPagos}% do total</div>
          </div>
        </div>
        <div className="metric-card orange">
          <div className="metric-icon orange">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div className="metric-label">Pagamentos em Atraso (Mês)</div>
            <div className="metric-value">{stats.emAtrasoMes}</div>
            <div className="metric-trend down">{taxaAtraso}% do total</div>
          </div>
        </div>
        <div className="metric-card purple">
          <div className="metric-icon purple">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div className="metric-label">Receita Acumulada</div>
            <div className="metric-value" style={{ fontSize: '1.25rem' }}>{formatMoeda(stats.receitaTotal)}</div>
            <div className="metric-trend up">Este Ano</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="panel" style={{ flex: 2 }}>
          <div className="panel-header">
            <div>
              <h3>Receitas e Pagamentos Mensais</h3>
              <span className="panel-sub">Jan – Dez {now.getFullYear()}</span>
            </div>
          </div>
          <div style={{ height: 280, position: 'relative', width: '100%' }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-header">
            <h3>Estado de Quotas (Mês)</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--oma-navy)' }}>{taxaPagos}%</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Taxa de Pagamento</span>
          </div>
          <div className="quota-list">
            <div className="quota-row">
              <span className="quota-label"><span className="quota-dot" style={{ background: 'var(--green)' }} /> Em dia</span>
              <div className="quota-bar-wrap">
                <div className="quota-bar"><div className="quota-bar-fill" style={{ width: `${taxaPagos}%`, background: 'var(--green)' }} /></div>
                <span className="quota-count">{stats.pagosMes}</span>
              </div>
            </div>
            <div className="quota-row">
              <span className="quota-label"><span className="quota-dot" style={{ background: 'var(--orange)' }} /> Em atraso</span>
              <div className="quota-bar-wrap">
                <div className="quota-bar"><div className="quota-bar-fill" style={{ width: `${taxaAtraso}%`, background: 'var(--orange)' }} /></div>
                <span className="quota-count">{stats.emAtrasoMes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
