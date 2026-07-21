'use client';

import { useEffect, useState } from 'react';

const ACAO_COLORS = {
  'CRIAR': '#10b981',
  'EDITAR': '#3b82f6',
  'DESATIVAR': '#ef4444',
  'RENOVAR CARTEIRA': '#8b5cf6',
  'ELIMINAR': '#ef4444',
};

const ENTIDADE_ICONS = {
  'Médico': 'fa-user-doctor',
  'Hospital': 'fa-hospital',
  'Utilizador': 'fa-user-shield',
  'Pagamento': 'fa-credit-card',
  'Sistema': 'fa-gear',
};

export default function Auditoria({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEntidade, setFilterEntidade] = useState('');
  const [filterAcao, setFilterAcao] = useState('');

  const carregarLogs = () => {
    setLoading(true);
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getAuditLog({ limit: 300 });
    }
  };

  useEffect(() => {
    carregarLogs();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onGetAuditLog(data => {
        setLoading(false);
        if (data.success) setLogs(data.logs || []);
      });
    }
    return () => {
      if (typeof window !== 'undefined' && window.electron) {
        window.electron.removeAllListeners('get-audit-log-result');
      }
    };
  }, []);

  const formatData = (data) => {
    try {
      return new Date(data).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return data; }
  };

  const entidades = [...new Set(logs.map(l => l.entidade))];
  const acoes = [...new Set(logs.map(l => l.acao))];

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !search || l.detalhes?.toLowerCase().includes(q) || l.usuario?.toLowerCase().includes(q) || l.entidade?.toLowerCase().includes(q);
    const matchEntidade = !filterEntidade || l.entidade === filterEntidade;
    const matchAcao = !filterAcao || l.acao === filterAcao;
    return matchSearch && matchEntidade && matchAcao;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Registo de Atividade</h1>
          <nav>{logs.length} ações registadas no sistema</nav>
        </div>
        <button className="btn-add" onClick={carregarLogs} style={{ background: '#6b7280' }}>
          <i className="fas fa-rotate-right" /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Pesquisar por utilizador, entidade ou detalhes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterEntidade} onChange={e => setFilterEntidade(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)', fontSize: 14 }}>
          <option value="">Todas as entidades</option>
          {entidades.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterAcao} onChange={e => setFilterAcao(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)', fontSize: 14 }}>
          <option value="">Todas as ações</option>
          {acoes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Histórico de Atividades</h3>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} entradas</span>
        </div>
        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} /> A carregar registo...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>ID</th>
                  <th>Detalhes</th>
                  <th>Utilizador</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="no-data">Nenhuma atividade encontrada.</td></tr>
                ) : filtered.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatData(log.data)}</td>
                    <td>
                      <span style={{
                        background: ACAO_COLORS[log.acao] || '#6b7280',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}>
                        {log.acao}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className={`fas ${ENTIDADE_ICONS[log.entidade] || 'fa-file'}`} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} />
                        {log.entidade}
                      </span>
                    </td>
                    <td>{log.entidade_id ? <strong>#{log.entidade_id}</strong> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ fontSize: '0.87rem', maxWidth: 300 }}>{log.detalhes || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                          {(log.usuario || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.87rem' }}>{log.usuario}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
