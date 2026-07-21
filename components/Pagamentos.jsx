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
const MESES = [
  { val: 1, nome: 'Jan' }, { val: 2, nome: 'Fev' }, { val: 3, nome: 'Mar' },
  { val: 4, nome: 'Abr' }, { val: 5, nome: 'Mai' }, { val: 6, nome: 'Jun' },
  { val: 7, nome: 'Jul' }, { val: 8, nome: 'Ago' }, { val: 9, nome: 'Set' },
  { val: 10, nome: 'Out' }, { val: 11, nome: 'Nov' }, { val: 12, nome: 'Dez' }
];

function formatMoeda(valor) {
  return `AOA ${Number(valor || 0).toLocaleString('pt-AO', { minimumFractionDigits: 0 })}`;
}
function formatData(str) {
  if (!str) return '—';
  const p = str.split('T')[0].split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : str;
}

export default function Pagamentos() {
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const [lista, setLista] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [stats, setStats] = useState({ total: 0, pagos: 0, pendentes: 0, receita_total: 0 });
  
  // States for the Matrix
  const [anoQuotas, setAnoQuotas] = useState(currentYear);
  
  // States for Filtering & Search
  const [filtro, setFiltro] = useState('todos');
  const [search, setSearch] = useState('');
  
  // UI States
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', error: false });
  const [activePlan, setActivePlan] = useState(null);
  const [medicoSearch, setMedicoSearch] = useState('');
  const [showMedicoDropdown, setShowMedicoDropdown] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    medico_id: '',
    valorPorMes: 5000,
    meses: [],
    ano: currentYear,
    data_pagamento: today,
    metodo_pagamento: METODOS[0],
    status: 'Pago',
    observacoes: ''
  });

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
          setForm({ medico_id: '', valorPorMes: 5000, meses: [], ano: currentYear, data_pagamento: today, metodo_pagamento: METODOS[0], status: 'Pago', observacoes: '' });
          carregarDados();
          showToast('Pagamentos registados com sucesso!');
        } else {
          showToast(`Erro: ${result.error}`, true);
        }
      });
      window.electron.onUpdatePagamentoStatus((result) => {
        if (result.success) { carregarDados(); showToast('Pagamento confirmado!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
    }
    const handleNavigate = (e) => {
      if (e.detail?.to === 'pagamentos' && e.detail?.action === 'openModal') {
        setModalOpen(true);
      }
    };
    if (typeof window !== 'undefined') window.addEventListener('navigate', handleNavigate);

    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('navigate', handleNavigate);
      if (typeof window !== 'undefined' && window.electron) {
        ['pagamentos-stats-result', 'pagamentos-lista-result', 'medicos-lista-result',
         'add-pagamento-result', 'update-pagamento-status-result'].forEach(
          (c) => window.electron.removeAllListeners(c)
        );
      }
    };
  }, []);

  const filteredLista = lista.filter((p) => {
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    const matchSearch = !search ||
      (p.medico_nome || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).includes(search);
    return matchFiltro && matchSearch;
  });

  const toggleMes = (mesVal) => {
    setActivePlan(null);
    setForm(prev => {
      const isSelected = prev.meses.includes(mesVal);
      return {
        ...prev,
        meses: isSelected ? prev.meses.filter(m => m !== mesVal) : [...prev.meses, mesVal]
      };
    });
  };

  const selectPlano = (quantidade) => {
    if (activePlan === quantidade) {
      setActivePlan(null);
      setForm(prev => ({ ...prev, meses: [] }));
      return;
    }
    setActivePlan(quantidade);
    setForm(prev => {
      const primeirosMeses = [];
      for (let i = 1; i <= quantidade; i++) {
        primeirosMeses.push(i);
      }
      return { ...prev, meses: primeirosMeses };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.medico_id) { showToast('Seleccione um médico.', true); return; }
    if (form.meses.length === 0) { showToast('Seleccione pelo menos um mês.', true); return; }
    
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.addPagamento({
        medico_id: parseInt(form.medico_id, 10),
        valor: parseFloat(form.valorPorMes),
        meses: form.meses,
        ano: parseInt(form.ano, 10),
        data_pagamento: form.data_pagamento,
        metodo_pagamento: form.metodo_pagamento,
        status: form.status,
        observacoes: form.observacoes || null,
      });
    }
  };

  // Build the Quotas Matrix
  // Map of medicoId -> { ano, meses: { 1: {status}, 2: {status} } }
  const matrixData = medicos.map(med => {
    const medicoPagamentos = lista.filter(p => p.medico_id === med.id && p.ano_referencia === parseInt(anoQuotas, 10));
    const mesesPagos = {};
    medicoPagamentos.forEach(p => {
      if (p.mes_referencia) {
        // If there are duplicates, take the one that is 'Pago' preferably
        if (!mesesPagos[p.mes_referencia] || p.status === 'Pago') {
          mesesPagos[p.mes_referencia] = p.status;
        }
      }
    });
    return { ...med, mesesPagos };
  });

  return (
    <div>
      <Toast msg={toast.msg} error={toast.error} onClose={() => setToast({ msg: '', error: false })} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Gestão de Quotas</h1>
          <nav>Início / <span>Quotas e Pagamentos</span></nav>
        </div>
        <button className="btn-add" onClick={() => setModalOpen(true)}>
          <i className="fas fa-plus" /> Registar Pagamento
        </button>
      </div>

      {/* Stats Cards */}
      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-receipt" /></div>
          <div><h3>TOTAL DE REGISTOS</h3><span className="card-value">{stats.total || 0}</span></div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-check-circle" /></div>
          <div><h3>QUOTAS PAGAS</h3><span className="card-value">{stats.pagos || 0}</span></div>
        </div>
        <div className="card card-orange">
          <div className="card-icon"><i className="fas fa-clock" /></div>
          <div><h3>QUOTAS PENDENTES</h3><span className="card-value">{stats.pendentes || 0}</span></div>
        </div>
        <div className="card card-purple">
          <div className="card-icon"><i className="fas fa-coins" /></div>
          <div><h3>RECEITA TOTAL</h3><span className="card-value card-value-sm">{formatMoeda(stats.receita_total)}</span></div>
        </div>
      </div>

      {/* Quotas Matrix */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div className="panel-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Matriz Anual de Quotas</h3>
          <input 
            type="number" 
            value={anoQuotas} 
            onChange={(e) => setAnoQuotas(parseInt(e.target.value, 10) || new Date().getFullYear())} 
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', width: '100px' }} 
          />
        </div>
        <div className="table-responsive">
          <table style={{ margin: 0, minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 250, borderRight: '1px solid #f1f5f9' }}>Médico</th>
                {MESES.map(m => <th key={m.val} style={{ textAlign: 'center', width: 45, fontSize: '0.8rem' }}>{m.nome}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrixData.length === 0 ? (
                <tr><td colSpan={13} className="no-data">Nenhum médico registado.</td></tr>
              ) : matrixData.map(med => (
                <tr key={med.id}>
                  <td style={{ borderRight: '1px solid #f1f5f9' }}><strong>{med.nome}</strong><br/><span style={{fontSize: '0.8rem', color: '#64748b'}}>{med.especialidade}</span></td>
                  {MESES.map(m => {
                    const status = med.mesesPagos[m.val];
                    return (
                      <td key={m.val} style={{ textAlign: 'center' }}>
                        {status === 'Pago' && <div style={{width: 20, height: 20, background: '#22c55e', borderRadius: 4, margin: '0 auto'}} title="Pago"></div>}
                        {status === 'Pendente' && <div style={{width: 20, height: 20, background: '#f59e0b', borderRadius: 4, margin: '0 auto'}} title="Pendente"></div>}
                        {!status && <div style={{width: 20, height: 20, background: '#e2e8f0', borderRadius: 4, margin: '0 auto'}} title="Não pago"></div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 24px', fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: 16 }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, background: '#22c55e', borderRadius: 2}}></div> Pago</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, background: '#f59e0b', borderRadius: 2}}></div> Pendente</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, background: '#e2e8f0', borderRadius: 2}}></div> Não Pago</div>
          </div>
        </div>
      </div>

      {/* Histórico Table */}
      <div className="table-container">
        <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Histórico de Registos</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="filter-bar" style={{ marginBottom: 0 }}>
              {[['todos', 'Todos'], ['Pendente', 'Pendentes'], ['Pago', 'Pagos']].map(([val, label]) => (
                <button key={val} className={`filter-btn${filtro === val ? ' active' : ''}`} onClick={() => setFiltro(val)}>
                  {label}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Médico</th><th>Mês / Ano</th>
                <th>Valor</th><th>Data Registo</th><th>Método</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLista.length === 0 ? (
                <tr><td colSpan={8} className="no-data">Nenhum registo encontrado.</td></tr>
              ) : filteredLista.map((p) => (
                <tr key={p.id}>
                  <td><strong>#{p.id}</strong></td>
                  <td>{p.medico_nome || '—'}</td>
                  <td>{p.mes_referencia ? `${MESES.find(m=>m.val === p.mes_referencia)?.nome} / ${p.ano_referencia}` : 'Geral'}</td>
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
        <div className="modal-content" style={{ maxWidth: 600 }}>
          <div className="modal-header">
            <h3><i className="fas fa-credit-card" /> Registar Pagamento de Quotas</h3>
            <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Médico *</label>
              <div 
                className="search-dropdown-input" 
                style={{ position: 'relative', width: '100%' }}
              >
                <input
                  type="text"
                  placeholder="Pesquisar médico por nome..."
                  value={form.medico_id ? medicos.find(m => m.id === form.medico_id)?.nome : medicoSearch}
                  onChange={(e) => {
                    setMedicoSearch(e.target.value);
                    if (form.medico_id) setForm({ ...form, medico_id: '' });
                    setShowMedicoDropdown(true);
                  }}
                  onFocus={() => setShowMedicoDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMedicoDropdown(false), 200)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
                {showMedicoDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, maxHeight: 200, overflowY: 'auto', zIndex: 10, marginTop: 4, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {medicos.filter(m => (m.nome || '').toLowerCase().includes(medicoSearch.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '8px 12px', color: '#64748b' }}>Nenhum médico encontrado.</div>
                    ) : (
                      medicos.filter(m => (m.nome || '').toLowerCase().includes(medicoSearch.toLowerCase())).map(m => (
                        <div 
                          key={m.id} 
                          onClick={() => {
                            setForm({ ...form, medico_id: m.id });
                            setMedicoSearch('');
                            setShowMedicoDropdown(false);
                          }}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.target.style.background = '#fff'}
                        >
                          {m.nome} {m.especialidade ? <span style={{ color: '#64748b', fontSize: '0.85em' }}>— {m.especialidade}</span> : ''}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Ano Referência *</label>
                <input type="number" required value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Valor por Mês (AOA) *</label>
                <input type="number" required min="1" step="0.01" value={form.valorPorMes} onChange={(e) => setForm({ ...form, valorPorMes: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <label>Meses a Pagar *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => selectPlano(3)} style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer', background: activePlan === 3 ? '#3b82f6' : '#f8fafc', color: activePlan === 3 ? '#fff' : 'inherit' }}>Trimestre</button>
                  <button type="button" onClick={() => selectPlano(6)} style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer', background: activePlan === 6 ? '#3b82f6' : '#f8fafc', color: activePlan === 6 ? '#fff' : 'inherit' }}>Semestre</button>
                  <button type="button" onClick={() => selectPlano(9)} style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer', background: activePlan === 9 ? '#3b82f6' : '#f8fafc', color: activePlan === 9 ? '#fff' : 'inherit' }}>9 Meses</button>
                  <button type="button" onClick={() => selectPlano(12)} style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer', background: activePlan === 12 ? '#3b82f6' : '#f8fafc', color: activePlan === 12 ? '#fff' : 'inherit' }}>Anual</button>
                </div>
              </div>
              <span className="optional" style={{ display: 'block', marginTop: 4 }}>Total a cobrar: {formatMoeda((parseFloat(form.valorPorMes) || 0) * form.meses.length)}</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 8 }}>
                {MESES.map(m => (
                  <label key={m.val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.meses.includes(m.val)} onChange={() => toggleMes(m.val)} />
                    {m.nome}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data do Registo *</label>
                <input type="date" required value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Método de Pagamento *</label>
                <select value={form.metodo_pagamento} onChange={(e) => setForm({ ...form, metodo_pagamento: e.target.value })}>
                  {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status Inicial *</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Pago">Pago (confirmado)</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
              <div className="form-group">
                <label>Observações <span className="optional">(Opcional)</span></label>
                <textarea rows={1} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-save">Registar {form.meses.length} mês(es)</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
