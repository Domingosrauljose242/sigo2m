'use client';

import { useEffect, useState } from 'react';

function Toast({ msg, error, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className={`toast show${error ? ' error' : ''}`}>{msg}</div>;
}

const TIPOS_HOSPITAL = ['Hospital Público', 'Hospital Privado', 'Clínica Privada', 'Clínica Especializada', 'Maternidade', 'Centro de Saúde', 'Posto de Saúde', 'Laboratório', 'Outro'];

function ModalHospital({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({ nome: '', endereco: '', telefone: '', tipo: 'Hospital Público' });

  useEffect(() => {
    if (initial) setForm({ nome: initial.nome || '', endereco: initial.endereco || '', telefone: initial.telefone || '', tipo: initial.tipo || 'Hospital Público' });
    else setForm({ nome: '', endereco: '', telefone: '', tipo: 'Hospital Público' });
  }, [initial, open]);

  if (!open) return null;
  return (
    <div className="modal open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className={`fas ${initial ? 'fa-pen' : 'fa-plus'}`} /> {initial ? 'Editar Hospital' : 'Novo Hospital'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nome *</label>
              <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Hospital Central do Moxico" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS_HOSPITAL.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Endereço</label>
            <input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Ex: Rua Direita da Lwena, Bairro Central" />
          </div>
          <div className="form-group">
            <label>Telefone <span className="optional">(Opcional)</span></label>
            <input type="tel" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="Ex: +244 9XX XXX XXX" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">{initial ? 'Salvar Alterações' : 'Registar Hospital'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TIPO_COLORS = {
  'Hospital Público': '#3b82f6',
  'Clínica Privada': '#8b5cf6',
  'Centro de Saúde': '#10b981',
  'Posto de Saúde': '#f59e0b',
  'Laboratório': '#ef4444',
  'Outro': '#6b7280',
};

export default function Hospitais({ user }) {
  const [lista, setLista] = useState([]);
  const [stats, setStats] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState({ msg: '', error: false });
  const [search, setSearch] = useState('');

  const showToast = (msg, error = false) => setToast({ msg, error });

  const carregarDados = () => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getHospitaisLista();
    }
  };

  useEffect(() => {
    carregarDados();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onHospitaisLista((data) => {
        if (data.success) { setLista(data.lista || []); setStats(data.stats || {}); }
      });
      window.electron.onAddHospitalResult((result) => {
        if (result.success) { setModalOpen(false); carregarDados(); showToast('Hospital registado com sucesso!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
      window.electron.onUpdateHospitalResult((result) => {
        if (result.success) { setModalOpen(false); setEditTarget(null); carregarDados(); showToast('Hospital atualizado com sucesso!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
    }
    return () => {
      if (typeof window !== 'undefined' && window.electron) {
        ['hospitais-lista-result', 'add-hospital-result', 'update-hospital-result'].forEach(ch => window.electron.removeAllListeners(ch));
      }
    };
  }, []);

  const handleSave = (form) => {
    if (!window.electron) return;
    if (editTarget) {
      window.electron.updateHospital({ ...form, id: editTarget.id, usuario: user?.username });
    } else {
      window.electron.addHospital({ ...form, usuario: user?.username });
    }
  };

  const openEdit = (h) => { setEditTarget(h); setModalOpen(true); };
  const openNew = () => { setEditTarget(null); setModalOpen(true); };

  const filtered = lista.filter(h =>
    (h.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.tipo || '').toLowerCase().includes(search.toLowerCase())
  );

  const publicos = lista.filter(h => h.tipo === 'Hospital Público').length;
  const privadas = lista.filter(h => h.tipo === 'Clínica Privada').length;
  const centros = lista.filter(h => h.tipo === 'Centro de Saúde').length;

  return (
    <div>
      <Toast msg={toast.msg} error={toast.error} onClose={() => setToast({ msg: '', error: false })} />

      <div className="page-header">
        <div>
          <h1>Hospitais e Clínicas</h1>
          <nav>{lista.length} unidades de saúde registadas</nav>
        </div>
        <button className="btn-add" onClick={openNew}>
          <i className="fas fa-plus" /> Adicionar Hospital
        </button>
      </div>

      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-hospital-user" /></div>
          <div><h3>TOTAL DE UNIDADES</h3><span className="card-value">{lista.length}</span></div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-hospital" /></div>
          <div><h3>HOSPITAIS PÚBLICOS</h3><span className="card-value">{publicos}</span></div>
        </div>
        <div className="card card-purple">
          <div className="card-icon"><i className="fas fa-clinic-medical" /></div>
          <div><h3>CLÍNICAS PRIVADAS</h3><span className="card-value">{privadas}</span></div>
        </div>
        <div className="card card-orange">
          <div className="card-icon"><i className="fas fa-house-medical" /></div>
          <div><h3>CENTROS DE SAÚDE</h3><span className="card-value">{centros}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="search-box">
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Pesquisar por nome ou tipo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header"><h3>Unidades Cadastradas</h3></div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Endereço</th>
                <th>Telefone</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="no-data">Nenhum hospital encontrado.</td></tr>
              ) : filtered.map((h) => (
                <tr key={h.id}>
                  <td><strong>#{h.id}</strong></td>
                  <td><strong>{h.nome}</strong></td>
                  <td>
                    <span style={{ background: TIPO_COLORS[h.tipo] || '#6b7280', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                      {h.tipo || 'Hospital Público'}
                    </span>
                  </td>
                  <td>{h.endereco || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>{h.telefone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => openEdit(h)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px' }}>
                      <i className="fas fa-pen" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalHospital open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }} onSave={handleSave} initial={editTarget} />
    </div>
  );
}
