'use client';

import { useState, useMemo, useEffect } from 'react';

const TIPO_PADRAO = { icon: 'fa-bell', color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', label: 'Notificação' };
const TIPOS = {
  pagamento: { icon: 'fa-credit-card', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', label: 'Pagamento' },
  medico: { icon: 'fa-user-doctor', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', label: 'Médico' },
  hospital: { icon: 'fa-hospital', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', label: 'Hospital' },
  sistema: { icon: 'fa-server', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', label: 'Sistema' },
  quota: { icon: 'fa-bell', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', label: 'Quota' },
  alerta: { icon: 'fa-triangle-exclamation', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', label: 'Alerta' },
  aviso: { icon: 'fa-triangle-exclamation', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', label: 'Aviso' },
  info: { icon: 'fa-circle-info', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', label: 'Info' },
};

const DADOS_INICIAIS = [];

function tempoRelativo(data) {
  try {
    const d = data instanceof Date ? data : new Date(data);
    if (isNaN(d)) return '—';
    const agora = new Date();
    const diff = agora - d;
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (min < 1) return 'Agora mesmo';
    if (min < 60) return `Há ${min} min`;
    if (hrs < 24) return `Há ${hrs}h`;
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `Há ${dias} dias`;
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

const FILTROS = [
  { id: 'todas', label: 'Todas', icon: 'fa-layer-group' },
  { id: 'nao_lidas', label: 'Não Lidas', icon: 'fa-envelope' },
  { id: 'pagamento', label: 'Pagamentos', icon: 'fa-credit-card' },
  { id: 'medico', label: 'Médicos', icon: 'fa-user-doctor' },
  { id: 'sistema', label: 'Sistema', icon: 'fa-server' },
  { id: 'quota', label: 'Quotas', icon: 'fa-bell' },
];

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [seleccionada, setSeleccionada] = useState(null);
  const [busca, setBusca] = useState('');

  const carregarNotificacoes = () => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getNotificacoesLista();
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onNotificacoesLista((data) => {
        if (data.success) {
          // Parse string dates to Date objects and handle booleans
          const parsed = data.lista.map(n => ({
            ...n,
            data: new Date(n.data),
            lida: Boolean(n.lida),
            urgente: Boolean(n.urgente)
          }));
          setNotificacoes(parsed);
        }
      });
      window.electron.onNotificacaoAcao((data) => {
        if (data.success) {
          carregarNotificacoes();
        }
      });
    }
    return () => {
      if (window.electron) {
        window.electron.removeAllListeners('notificacoes-lista-result');
        window.electron.removeAllListeners('notificacao-acao-result');
      }
    };
  }, []);

  const filtradas = useMemo(() => {
    let resultado = [...notificacoes];
    if (filtroActivo === 'nao_lidas') {
      resultado = resultado.filter(n => !n.lida);
    } else if (filtroActivo !== 'todas') {
      resultado = resultado.filter(n => n.tipo === filtroActivo);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      resultado = resultado.filter(n =>
        (n.titulo || '').toLowerCase().includes(q) || (n.descricao || '').toLowerCase().includes(q)
      );
    }
    return resultado.sort((a, b) => b.data - a.data);
  }, [notificacoes, filtroActivo, busca]);

  const stats = useMemo(() => ({
    total: notificacoes.length,
    naoLidas: notificacoes.filter(n => !n.lida).length,
    urgentes: notificacoes.filter(n => n.urgente && !n.lida).length,
    hoje: notificacoes.filter(n => {
      const agora = new Date();
      return n.data.toDateString() === agora.toDateString();
    }).length,
  }), [notificacoes]);

  const marcarComoLida = (id) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    if (typeof window !== 'undefined' && window.electron) window.electron.marcarNotificacaoLida(id, true);
  };

  const toggleLida = (id) => {
    const notif = notificacoes.find(n => n.id === id);
    if (!notif) return;
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: !n.lida } : n));
    if (typeof window !== 'undefined' && window.electron) window.electron.marcarNotificacaoLida(id, !notif.lida);
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    if (typeof window !== 'undefined' && window.electron) window.electron.marcarTodasNotificacoesLidas();
  };

  const eliminar = (id) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
    if (seleccionada?.id === id) setSeleccionada(null);
    if (typeof window !== 'undefined' && window.electron) window.electron.eliminarNotificacao(id);
  };

  const abrirDetalhe = (notif) => {
    if (!notif.lida) marcarComoLida(notif.id);
    setSeleccionada(notif);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>🔔 Centro de Notificações</h1>
          <nav>Início / <span>Notificações</span></nav>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={marcarTodasComoLidas}>
            <i className="fas fa-check-double" /> Marcar todas como lidas
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-bell" /></div>
          <div>
            <h3>Total</h3>
            <div className="card-value">{stats.total}</div>
          </div>
        </div>
        <div className="card card-orange">
          <div className="card-icon"><i className="fas fa-envelope" /></div>
          <div>
            <h3>Não Lidas</h3>
            <div className="card-value">{stats.naoLidas}</div>
          </div>
        </div>
        <div className="card card-purple" style={{ borderLeft: '3px solid var(--red)' }}>
          <div className="card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}>
            <i className="fas fa-exclamation-triangle" />
          </div>
          <div>
            <h3>Urgentes</h3>
            <div className="card-value">{stats.urgentes}</div>
          </div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-calendar-day" /></div>
          <div>
            <h3>Hoje</h3>
            <div className="card-value">{stats.hoje}</div>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="notif-toolbar">
        <div className="filter-bar">
          {FILTROS.map(f => (
            <button
              key={f.id}
              className={`filter-btn${filtroActivo === f.id ? ' active' : ''}`}
              onClick={() => setFiltroActivo(f.id)}
            >
              <i className={`fas ${f.icon}`} style={{ marginRight: 6 }} />
              {f.label}
              {f.id === 'nao_lidas' && stats.naoLidas > 0 && (
                <span className="filter-count">{stats.naoLidas}</span>
              )}
            </button>
          ))}
        </div>
        <div className="search-box">
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Pesquisar notificações..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="notif-layout">
        {/* List */}
        <div className="notif-list-container">
          <div className="notif-list-header">
            <span>{filtradas.length} notificação{filtradas.length !== 1 ? 'ões' : ''}</span>
          </div>
          {filtradas.length === 0 ? (
            <div className="notif-empty">
              <i className="fas fa-bell-slash" />
              <p>Nenhuma notificação encontrada</p>
              <span>Tente alterar os filtros ou a pesquisa</span>
            </div>
          ) : (
            <div className="notif-list">
              {filtradas.map(notif => {
                const tipo = TIPOS[notif.tipo] || { icon: 'fa-bell', color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', label: 'Notificação' };
                return (
                  <div
                    key={notif.id}
                    className={`notif-item${!notif.lida ? ' unread' : ''}${seleccionada?.id === notif.id ? ' selected' : ''}${notif.urgente ? ' urgent' : ''}`}
                    onClick={() => abrirDetalhe(notif)}
                  >
                    <div className="notif-item-icon" style={{ background: tipo.bgColor, color: tipo.color }}>
                      <i className={`fas ${tipo.icon}`} />
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-top">
                        <span className="notif-item-title">{notif.titulo}</span>
                        {notif.urgente && <span className="notif-urgent-badge">Urgente</span>}
                      </div>
                      <p className="notif-item-desc">{notif.descricao}</p>
                      <div className="notif-item-meta">
                        <span className="notif-item-tipo" style={{ color: tipo.color }}>
                          <i className={`fas ${tipo.icon}`} /> {tipo.label}
                        </span>
                        <span className="notif-item-time">
                          <i className="fas fa-clock" /> {tempoRelativo(notif.data)}
                        </span>
                      </div>
                    </div>
                    <div className="notif-item-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="notif-action-btn"
                        title={notif.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                        onClick={() => toggleLida(notif.id)}
                      >
                        <i className={`fas ${notif.lida ? 'fa-envelope' : 'fa-envelope-open'}`} />
                      </button>
                      <button
                        className="notif-action-btn danger"
                        title="Eliminar"
                        onClick={() => eliminar(notif.id)}
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className={`notif-detail${seleccionada ? ' open' : ''}`}>
          {seleccionada ? (() => {
            const tipo = TIPOS[seleccionada.tipo] || { icon: 'fa-bell', color: '#6b7280', bgColor: 'rgba(107,114,128,0.1)', label: 'Notificação' };
            return (
              <>
                <div className="notif-detail-header">
                  <div className="notif-detail-icon" style={{ background: tipo.bgColor, color: tipo.color }}>
                    <i className={`fas ${tipo.icon}`} />
                  </div>
                  <div>
                    <span className="notif-detail-tipo" style={{ color: tipo.color }}>{tipo.label}</span>
                    <span className="notif-detail-time">{tempoRelativo(seleccionada.data)}</span>
                  </div>
                  <button className="close-btn" onClick={() => setSeleccionada(null)}>×</button>
                </div>
                <div className="notif-detail-body">
                  <h3>{seleccionada.titulo}</h3>
                  {seleccionada.urgente && (
                    <div className="notif-detail-urgent">
                      <i className="fas fa-exclamation-triangle" /> Notificação urgente — requer atenção imediata
                    </div>
                  )}
                  <p>{seleccionada.descricao}</p>
                  <div className="notif-detail-info">
                    <div className="notif-detail-info-row">
                      <span className="notif-detail-info-label">Tipo</span>
                      <span className="notif-detail-info-value" style={{ color: tipo.color }}>
                        <i className={`fas ${tipo.icon}`} /> {tipo.label}
                      </span>
                    </div>
                    <div className="notif-detail-info-row">
                      <span className="notif-detail-info-label">Data</span>
                      <span className="notif-detail-info-value">
                        {seleccionada.data.toLocaleDateString('pt-AO', {
                          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="notif-detail-info-row">
                      <span className="notif-detail-info-label">Estado</span>
                      <span className={`badge ${seleccionada.lida ? 'badge-success' : 'badge-warning'}`}>
                        {seleccionada.lida ? 'Lida' : 'Não lida'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="notif-detail-actions">
                  <button className="btn btn-outline" onClick={() => toggleLida(seleccionada.id)}>
                    <i className={`fas ${seleccionada.lida ? 'fa-envelope' : 'fa-envelope-open'}`} />
                    {seleccionada.lida ? 'Marcar não lida' : 'Marcar como lida'}
                  </button>
                  <button className="btn btn-outline" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => eliminar(seleccionada.id)}>
                    <i className="fas fa-trash-alt" /> Eliminar
                  </button>
                </div>
              </>
            );
          })() : (
            <div className="notif-detail-empty">
              <i className="fas fa-hand-pointer" />
              <p>Seleccione uma notificação</p>
              <span>Clique numa notificação da lista para ver os detalhes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
