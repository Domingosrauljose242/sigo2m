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

export default function Medicos() {
  const [lista, setLista] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', error: false });
  const [form, setForm] = useState({ nome: '', especialidade: '', hospital_id: '' });

  const showToast = (msg, error = false) => setToast({ msg, error });

  const carregarDados = () => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getMedicosStats();
      window.electron.getMedicosLista();
      window.electron.getHospitaisLista();
    }
  };

  useEffect(() => {
    carregarDados();
    
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onMedicosStats((data) => {
        if (data.success) setTotal(data.total || 0);
      });
      window.electron.onMedicosLista((data) => {
        if (data.success) setLista(data.lista || []);
      });
      window.electron.onHospitaisLista((data) => {
        if (data.success) setHospitais(data.lista || []);
      });
      window.electron.onAddMedicoResult((result) => {
        if (result.success) {
          setModalOpen(false);
          setForm({ nome: '', especialidade: '', hospital_id: '' });
          carregarDados();
          showToast('Médico registado com sucesso!');
        } else {
          showToast(`Erro: ${result.error}`, true);
        }
      });
    }
    return () => {
      if (window.electron) {
        ['medicos-stats-result', 'medicos-lista-result', 'hospitais-lista-result', 'add-medico-result']
          .forEach((c) => window.electron.removeAllListeners(c));
      }
    };
  }, []);

  const filtered = lista.filter((m) => {
    return !search || 
      m.nome.toLowerCase().includes(search.toLowerCase()) || 
      (m.especialidade || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.addMedico({
        nome: form.nome,
        especialidade: form.especialidade,
        hospital_id: form.hospital_id ? parseInt(form.hospital_id, 10) : null
      });
    }
  };

  return (
    <div>
      <Toast msg={toast.msg} error={toast.error} onClose={() => setToast({ msg: '', error: false })} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Médicos</h1>
          <nav>Início / <span>Gestão de Médicos</span></nav>
        </div>
        <button className="btn-add" onClick={() => setModalOpen(true)}>
          <i className="fas fa-plus" /> Registar Médico
        </button>
      </div>

      {/* Cards */}
      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-user-doctor" /></div>
          <div><h3>TOTAL DE MÉDICOS</h3><span className="card-value">{total}</span></div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-check-circle" /></div>
          <div><h3>MÉDICOS ACTIVOS</h3><span className="card-value">{total}</span></div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="search-box">
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Pesquisar por nome ou especialidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Médicos Registados</h3>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Médico</th>
                <th>Especialidade</th>
                <th>Hospital / Clínica Vinculada</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="no-data">Nenhum médico encontrado.</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id}>
                  <td><strong>#{m.id}</strong></td>
                  <td>{m.nome}</td>
                  <td>{m.especialidade || <span style={{ color: '#cbd5e1' }}>Clínica Geral</span>}</td>
                  <td>{m.hospital_nome || <span style={{ color: '#cbd5e1' }}>Nenhum</span>}</td>
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
            <h3><i className="fas fa-user-plus" /> Registar Novo Médico</h3>
            <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo *</label>
              <input type="text" required placeholder="Ex: Dr. João Silva"
                value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Especialidade</label>
              <input type="text" placeholder="Ex: Pediatria, Ortopedia..."
                value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Hospital / Clínica</label>
              <select value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}>
                <option value="">Nenhum vínculo</option>
                {hospitais.map((h) => (
                  <option key={h.id} value={h.id}>{h.nome}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-save">Guardar Médico</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
