'use client';

import { useEffect, useState } from 'react';

function Toast({ msg, error, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className={`toast show${error ? ' error' : ''}`}>{msg}</div>;
}

const METODOS = ['Multicaixa Express', 'Transferência Bancária', 'Depósito em Conta', 'Numerário'];

function formatMoeda(valor) {
  return `AOA ${Number(valor || 0).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`;
}
function formatData(str) {
  if (!str) return '—';
  const p = str.split('T')[0].split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : str;
}

export default function Pagamentos() {
  const [lista, setLista] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [stats, setStats] = useState({ total: 0, pagos: 0, pendentes: 0, receita_total: 0 });
  const [filtro, setFiltro] = useState('todos');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', error: false });
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ medico_id: '', valor: '', data_pagamento: today, metodo_pagamento: METODOS[0], status: 'Pago', observacoes: '' });

  const showToast = (msg, error = false) => setToast({ msg, error });

  const carregarDados = () => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getPagamentosStats();
      window.electron.getPagamentosLista();
      window.electron.getMedicosLista();
    }
  };

  useEffect(() => {
    carregarDados();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onPagamentosStats((data) => {
        if (data.success) setStats(data.stats || {});
      });
      window.electron.onPagamentosLista((data) => {
        if (data.success) setLista(data.lista || []);
      });
      window.electron.onMedicosLista((data) => {
        if (data.success) setMedicos(data.lista || []);
      });
      window.electron.onAddPagamentoResult((result) => {
        if (result.success) {
          setModalOpen(false);
          setForm({ medico_id: '', valor: '', data_pagamento: today, metodo_pagamento: METODOS[0], status: 'Pago', observacoes: '' });
          carregarDados();
          showToast('Pagamento registado com sucesso!');
        } else {
          showToast(`Erro: ${result.error}`, true);
        }
      });
      window.electron.onUpdatePagamentoStatus((result) => {
        if (result.success) { carregarDados(); showToast('Pagamento confirmado!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
    }
    return () => {
      if (window.electron) {
        ['pagamentos-stats-result', 'pagamentos-lista-result', 'medicos-lista-result',
         'add-pagamento-result', 'update-pagamento-status-result'].forEach(
          (c) => window.electron.removeAllListeners(c)
        );
      }
    };
  }, []);

  const filtered = lista.filter((p) => {
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    const matchSearch = !search ||
      (p.medico_nome || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).includes(search);
    return matchFiltro && matchSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.medico_id) { showToast('Seleccione um médico.', true); return; }
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.addPagamento({
        medico_id: parseInt(form.medico_id, 10),
        valor: parseFloat(form.valor),
        data_pagamento: form.data_pagamento,
        metodo_pagamento: form.metodo_pagamento,
        status: form.status,
        observacoes: form.observacoes || null,
      });
    }
  };

  return (
    <div>
      <Toast msg={toast.msg} error={toast.error} onClose={() => setToast({ msg: '', error: false })} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Pagamentos</h1>
          <nav>Início / <span>Gestão de Pagamentos</span></nav>
        </div>
        <button className="btn-add" onClick={() => setModalOpen(true)}>
          <i className="fas fa-plus" /> Registar Pagamento
        </button>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <i className="fas fa-info-circle" />
        <span><strong>Métodos aceites:</strong> Multicaixa Express, Transferência Bancária, Depósito em Conta ou Numerário na sede.</span>
      </div>

      {/* Stats Cards */}
      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-receipt" /></div>
          <div><h3>TOTAL DE REGISTOS</h3><span className="card-value">{stats.total || 0}</span></div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-check-circle" /></div>
          <div><h3>PAGAMENTOS CONFIRMADOS</h3><span className="card-value">{stats.pagos || 0}</span></div>
        </div>
        <div className="card card-orange">
          <div className="card-icon"><i className="fas fa-clock" /></div>
          <div><h3>PENDENTES</h3><span className="card-value">{stats.pendentes || 0}</span></div>
        </div>
        <div className="card card-purple">
          <div className="card-icon"><i className="fas fa-coins" /></div>
          <div><h3>RECEITA TOTAL</h3><span className="card-value card-value-sm">{formatMoeda(stats.receita_total)}</span></div>
        </div>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {[['todos', 'Todos'], ['Pendente', 'Pendentes'], ['Pago', 'Pagos']].map(([val, label]) => (
            <button key={val} className={`filter-btn${filtro === val ? ' active' : ''}`} onClick={() => setFiltro(val)}>
              {label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Pesquisar médico ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header"><h3>Histórico de Pagamentos</h3></div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Médico</th><th>Especialidade</th>
                <th>Valor</th><th>Data</th><th>Método</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="no-data">Nenhum pagamento encontrado.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td><strong>#{p.id}</strong></td>
                  <td>{p.medico_nome || '—'}</td>
                  <td>{p.especialidade || '—'}</td>
                  <td className={p.status === 'Pago' ? 'valor-pago' : 'valor-pendente'}>{formatMoeda(p.valor)}</td>
                  <td>{formatData(p.data_pagamento)}</td>
                  <td>{p.metodo_pagamento || '—'}</td>
                  <td><span className={`status-badge ${p.status === 'Pago' ? 'status-pago' : 'status-pendente'}`}>{p.status}</span></td>
                  <td>
                    <div className="action-btns">
                      {p.status === 'Pago' ? (
                        <button className="btn-action btn-confirm" disabled>✓ Pago</button>
                      ) : (
                        <button className="btn-action btn-confirm" onClick={() => window.electron?.updatePagamentoStatus({ id: p.id, status: 'Pago' })}>
                          ✓ Confirmar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <div className={`modal${modalOpen ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <div className="modal-content">
          <div className="modal-header">
            <h3><i className="fas fa-credit-card" /> Registar Pagamento</h3>
            <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Médico *</label>
              <select required value={form.medico_id} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
                <option value="">Seleccionar médico...</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}{m.especialidade ? ` — ${m.especialidade}` : ''}</option>
                ))}
              </select>
              {medicos.length === 0 && <p className="form-hint">Nenhum médico registado. Adicione médicos antes de registar pagamentos.</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Valor (AOA) *</label>
                <input type="number" required min="1" step="0.01" placeholder="Ex: 120000"
                  value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Data *</label>
                <input type="date" required value={form.data_pagamento}
                  onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Método de Pagamento *</label>
              <select value={form.metodo_pagamento} onChange={(e) => setForm({ ...form, metodo_pagamento: e.target.value })}>
                {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status *</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Pago">Pago (confirmado)</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
            <div className="form-group">
              <label>Observações <span className="optional">(Opcional)</span></label>
              <textarea rows={2} placeholder="Notas adicionais..."
                value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-save">Guardar Pagamento</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
