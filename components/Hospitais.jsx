'use client';

import { useEffect, useState } from 'react';

function Toast({ msg, error, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className={`toast show${error ? ' error' : ''}`}>{msg}</div>
  );
}

export default function Hospitais() {
  const [lista, setLista] = useState([]);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', error: false });
  const [form, setForm] = useState({ nome: '', endereco: '', telefone: '' });

  const showToast = (msg, error = false) => setToast({ msg, error });

  const carregarDados = () => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getDashboardStats();
      window.electron.getHospitaisLista();
    }
  };

  useEffect(() => {
    carregarDados();

    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onDashboardStats((data) => {
        if (data.success) setTotal(data.totalHospitais);
      });
      window.electron.onHospitaisLista((data) => {
        if (data.success) setLista(data.lista || []);
      });
      window.electron.onAddHospitalResult((result) => {
        if (result.success) {
          setModalOpen(false);
          setForm({ nome: '', endereco: '', telefone: '' });
          carregarDados();
          showToast('Hospital adicionado com sucesso!');
        } else {
          showToast(`Erro: ${result.error}`, true);
        }
      });
    }

    return () => {
      if (window.electron) {
        window.electron.removeAllListeners('dashboard-stats-result');
        window.electron.removeAllListeners('hospitais-lista-result');
        window.electron.removeAllListeners('add-hospital-result');
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.addHospital({
        nome: form.nome,
        endereco: form.endereco,
        telefone: form.telefone || null,
      });
    }
  };

  return (
    <div>
      <Toast msg={toast.msg} error={toast.error} onClose={() => setToast({ msg: '', error: false })} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Hospitais e Clínicas</h1>
          <nav>{total} unidades de saúde registadas na província do Moxico</nav>
        </div>
        <button className="btn-add" onClick={() => setModalOpen(true)}>
          <i className="fas fa-plus" /> Adicionar Hospital
        </button>
      </div>

      {/* Cards */}
      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-hospital-user" /></div>
          <div><h3>TOTAL DE UNIDADES</h3><span className="card-value">{total}</span></div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-hospital" /></div>
          <div><h3>HOSPITAIS PÚBLICOS</h3><span className="card-value">—</span></div>
        </div>
        <div className="card card-purple">
          <div className="card-icon"><i className="fas fa-clinic-medical" /></div>
          <div><h3>CLÍNICAS PRIVADAS</h3><span className="card-value">—</span></div>
        </div>
        <div className="card card-orange">
          <div className="card-icon"><i className="fas fa-user-doctor" /></div>
          <div><h3>MÉDICOS DISTRIBUÍDOS</h3><span className="card-value">—</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Unidades Cadastradas</h3>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Hospital</th>
                <th>Endereço</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={4} className="no-data">Nenhum hospital localizado no banco.</td></tr>
              ) : lista.map((h) => (
                <tr key={h.id}>
                  <td><strong>#{h.id}</strong></td>
                  <td>{h.nome}</td>
                  <td>{h.endereco || <span style={{ color: '#cbd5e1' }}>Não informado</span>}</td>
                  <td>{h.telefone || <span style={{ color: '#cbd5e1' }}>--</span>}</td>
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
            <h3><i className="fas fa-plus" /> Novo Hospital</h3>
            <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome do Hospital *</label>
              <input type="text" required placeholder="Ex: Hospital Central do Moxico"
                value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Endereço *</label>
              <input type="text" required placeholder="Ex: Rua Direita da Lwena, Bairro Central"
                value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Telefone <span className="optional">(Opcional)</span></label>
              <input type="tel" placeholder="Ex: +244 9XX XXX XXX"
                value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-save">Salvar Unidade</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
