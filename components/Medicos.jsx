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

const FORM_VAZIO = { nome: '', especialidade: '', telefone: '', email: '', hospital_id: '', numero_ordem: '', data_validade: '', grupo_sanguineo: '' };
const GRUPOS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function getValidadeStatus(data_validade) {
  if (!data_validade) return null;
  const hoje = new Date();
  const expira = new Date(data_validade);
  const diff = Math.ceil((expira - hoje) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Expirada', color: '#ef4444', bg: '#fee2e2' };
  if (diff <= 3) return { label: `Expira em ${diff}d`, color: '#f59e0b', bg: '#fef3c7' };
  return { label: expira.toLocaleDateString('pt-AO'), color: '#10b981', bg: '#d1fae5' };
}

function ModalMedico({ open, onClose, onSave, initial, hospitais }) {
  const [form, setForm] = useState(FORM_VAZIO);

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome || '',
        especialidade: initial.especialidade || '',
        telefone: initial.telefone || '',
        email: initial.email || '',
        hospital_id: initial.hospital_id ? String(initial.hospital_id) : '',
        numero_ordem: initial.numero_ordem || '',
        data_validade: initial.data_validade || '',
        grupo_sanguineo: initial.grupo_sanguineo || '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
  }, [initial, open]);

  if (!open) return null;

  return (
    <div className="modal open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className={`fas ${initial ? 'fa-pen' : 'fa-user-plus'}`} /> {initial ? 'Editar Médico' : 'Registar Novo Médico'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
          <div className="form-group">
            <label>Nome Completo *</label>
            <input required placeholder="Ex: Dr. João Manuel Silva" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Telefone</label>
              <input type="tel" placeholder="+244 9XX XXX XXX" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>E-mail</label>
              <input type="email" placeholder="medico@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nº da Ordem</label>
              <input placeholder="Ex: 12345" value={form.numero_ordem} onChange={e => setForm({ ...form, numero_ordem: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data de Validade da Carteira</label>
              <input type="date" value={form.data_validade} onChange={e => setForm({ ...form, data_validade: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Grupo Sanguíneo</label>
              <select value={form.grupo_sanguineo} onChange={e => setForm({ ...form, grupo_sanguineo: e.target.value })}>
                {GRUPOS.map(g => <option key={g} value={g}>{g || 'Desconhecido'}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Especialidade</label>
              <input placeholder="Ex: Pediatria, Ortopedia..." value={form.especialidade} onChange={e => setForm({ ...form, especialidade: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Hospital / Clínica Vinculada</label>
            <select value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
              <option value="">Nenhum vínculo</option>
              {hospitais.map(h => <option key={h.id} value={h.id}>{h.nome}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">{initial ? 'Guardar Alterações' : 'Registar Médico'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalRenovar({ open, onClose, onSave, medico }) {
  const [novaData, setNovaData] = useState('');
  useEffect(() => { if (open) setNovaData(''); }, [open]);
  if (!open || !medico) return null;
  return (
    <div className="modal open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h3><i className="fas fa-id-card" /> Renovar Carteira</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '0 0 16px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Renovar a carteira profissional do <strong>Dr(a). {medico.nome}</strong>.
            {medico.data_validade && <span> Validade atual: <strong>{new Date(medico.data_validade).toLocaleDateString('pt-AO')}</strong>.</span>}
          </p>
          <div className="form-group">
            <label>Nova Data de Validade *</label>
            <input type="date" required value={novaData} onChange={e => setNovaData(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={() => { if (novaData) onSave(novaData); }}
            style={{ background: '#10b981' }}>
            <i className="fas fa-rotate" /> Renovar Carteira
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Medicos({ user }) {
  const [lista, setLista] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [renovarTarget, setRenovarTarget] = useState(null);
  const [toast, setToast] = useState({ msg: '', error: false });

  const showToast = (msg, error = false) => setToast({ msg, error });

  const carregarDados = () => {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.getMedicosLista();
      window.electron.getHospitaisLista();
      window.electron.getMedicosStats();
    }
  };

  useEffect(() => {
    carregarDados();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onMedicosStats(data => { if (data.success) setTotal(data.total || 0); });
      window.electron.onMedicosLista(data => { if (data.success) setLista(data.lista || []); });
      window.electron.onHospitaisLista(data => { if (data.success) setHospitais(data.lista || []); });
      window.electron.onAddMedicoResult(result => {
        if (result.success) { setModalOpen(false); carregarDados(); showToast('Médico registado com sucesso!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
      window.electron.onUpdateMedicoResult(result => {
        if (result.success) { setModalOpen(false); setEditTarget(null); carregarDados(); showToast('Médico atualizado com sucesso!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
      window.electron.onRenovarCarteiraResult(result => {
        if (result.success) { setRenovarTarget(null); carregarDados(); showToast('Carteira renovada com sucesso!'); }
        else showToast(`Erro: ${result.error}`, true);
      });
    }
    return () => {
      if (typeof window !== 'undefined' && window.electron) {
        ['medicos-lista-result', 'hospitais-lista-result', 'medicos-stats-result',
         'add-medico-result', 'update-medico-result', 'renovar-carteira-result']
          .forEach(c => window.electron.removeAllListeners(c));
      }
    };
  }, []);

  const filtered = lista.filter(m =>
    !search ||
    (m.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.especialidade || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.numero_ordem || '').toLowerCase().includes(search.toLowerCase())
  );

  // expirados: diff < 0 (strictly past)
  // aExpirar: diff >= 1 && diff <= 3 (expiring in 1-3 days, not yet expired)
  const expirados = lista.filter(m => {
    if (!m.data_validade) return false;
    const diff = Math.ceil((new Date(m.data_validade) - new Date()) / (1000 * 60 * 60 * 24));
    return diff < 0;
  }).length;
  const aExpirar = lista.filter(m => {
    if (!m.data_validade) return false;
    const diff = Math.ceil((new Date(m.data_validade) - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  }).length;

  const handleSave = (form) => {
    if (!window.electron) return;
    const dados = {
      ...form,
      hospital_id: form.hospital_id ? parseInt(form.hospital_id, 10) : null,
      usuario: user?.username || 'Sistema',
    };
    if (editTarget) {
      window.electron.updateMedico({ ...dados, id: editTarget.id });
    } else {
      window.electron.addMedico(dados);
    }
  };

  const handleRenovar = (novaData) => {
    if (!window.electron || !renovarTarget) return;
    window.electron.renovarCarteira({
      medico_id: renovarTarget.id,
      nova_data: novaData,
      nome_medico: renovarTarget.nome,
      usuario: user?.username || 'Sistema',
    });
  };

  return (
    <div>
      <Toast msg={toast.msg} error={toast.error} onClose={() => setToast({ msg: '', error: false })} />

      <div className="page-header">
        <div>
          <h1>Médicos</h1>
          <nav>{total} médicos registados no sistema</nav>
        </div>
        <button className="btn-add" onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          <i className="fas fa-plus" /> Registar Médico
        </button>
      </div>

      <div className="cards-grid">
        <div className="card card-blue">
          <div className="card-icon"><i className="fas fa-user-doctor" /></div>
          <div><h3>TOTAL DE MÉDICOS</h3><span className="card-value">{total}</span></div>
        </div>
        <div className="card card-green">
          <div className="card-icon"><i className="fas fa-check-circle" /></div>
          <div><h3>COM CARTEIRA VÁLIDA</h3><span className="card-value">{total - expirados - aExpirar}</span></div>
        </div>
        <div className="card card-orange">
          <div className="card-icon"><i className="fas fa-triangle-exclamation" /></div>
          <div><h3>A EXPIRAR (3 DIAS)</h3><span className="card-value">{aExpirar}</span></div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
          <div className="card-icon" style={{ background: '#ef4444' }}><i className="fas fa-times-circle" /></div>
          <div><h3>CARTEIRAS EXPIRADAS</h3><span className="card-value" style={{ color: '#ef4444' }}>{expirados}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="search-box">
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Pesquisar por nome, especialidade ou nº ordem..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header"><h3>Médicos Registados</h3></div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Médico</th>
                <th>Especialidade</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Nº da Ordem</th>
                <th>Validade da Carteira</th>
                <th>Hospital / Clínica</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="no-data">Nenhum médico encontrado.</td></tr>
              ) : filtered.map(m => {
                const valStatus = getValidadeStatus(m.data_validade);
                return (
                  <tr key={m.id}>
                    <td><strong>#{m.id}</strong></td>
                    <td><strong>{m.nome}</strong></td>
                    <td>{m.especialidade || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>{m.telefone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>{m.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>{m.numero_ordem ? <strong>{m.numero_ordem}</strong> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>
                      {valStatus ? (
                        <span style={{ background: valStatus.bg, color: valStatus.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {valStatus.label}
                        </span>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td>{m.hospital_nome || <span style={{ color: '#cbd5e1' }}>Nenhum</span>}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => { setEditTarget(m); setModalOpen(true); }}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', marginRight: 6 }}>
                        <i className="fas fa-pen" /> Editar
                      </button>
                      <button onClick={() => setRenovarTarget(m)}
                        style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>
                        <i className="fas fa-rotate" /> Renovar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalMedico
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
        hospitais={hospitais}
      />

      <ModalRenovar
        open={!!renovarTarget}
        onClose={() => setRenovarTarget(null)}
        onSave={handleRenovar}
        medico={renovarTarget}
      />
    </div>
  );
}
