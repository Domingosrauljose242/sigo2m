'use client';

import { useState, useEffect } from 'react';

const TABS = [
  { id: 'geral', label: 'Geral', icon: 'fa-building' },
  { id: 'utilizadores', label: 'Utilizadores & Segurança', icon: 'fa-shield-halved' },
  { id: 'pagamentos', label: 'Pagamentos', icon: 'fa-credit-card' },
  { id: 'notificacoes', label: 'Notificações', icon: 'fa-bell' },
  { id: 'basedados', label: 'Base de Dados', icon: 'fa-database' },
];

const ESPECIALIDADES = [
  'Cardiologia', 'Cirurgia Geral', 'Dermatologia', 'Endocrinologia',
  'Gastroenterologia', 'Ginecologia', 'Medicina Geral', 'Neurologia',
  'Oftalmologia', 'Ortopedia', 'Pediatria', 'Pneumologia',
  'Psiquiatria', 'Radiologia', 'Urologia',
];

function Toggle({ checked, onChange, label }) {
  return (
    <label className="cfg-toggle-row">
      <span className="cfg-toggle-label">{label}</span>
      <div className={`cfg-toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="cfg-toggle-knob" />
      </div>
    </label>
  );
}

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="cfg-section">
      <div className="cfg-section-header">
        <div className="cfg-section-icon"><i className={`fas ${icon}`} /></div>
        <div>
          <h3 className="cfg-section-title">{title}</h3>
          {subtitle && <p className="cfg-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="cfg-section-body">{children}</div>
    </div>
  );
}

// ============================================================
// TAB: GERAL
// ============================================================
function TabGeral() {
  const [form, setForm] = useState({
    nomeOrg: 'Ordem dos Médicos de Angola',
    sigla: 'OMA',
    endereco: 'Luanda, Angola',
    telefone: '+244 222 000 000',
    email: 'geral@ordemdosmedicos.ao',
    website: 'www.ordemdosmedicos.ao',
    moeda: 'AOA',
    idioma: 'pt',
    fusoHorario: 'Africa/Luanda',
  });

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const [salvo, setSalvo] = useState(false);
  const handleSalvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  return (
    <>
      <SectionCard title="Informações da Organização" subtitle="Dados gerais da Ordem dos Médicos" icon="fa-building">
        <div className="cfg-form-grid">
          <div className="form-group">
            <label>Nome da Organização</label>
            <input value={form.nomeOrg} onChange={e => handleChange('nomeOrg', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Sigla</label>
            <input value={form.sigla} onChange={e => handleChange('sigla', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Endereço</label>
            <input value={form.endereco} onChange={e => handleChange('endereco', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input value={form.telefone} onChange={e => handleChange('telefone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Website</label>
            <input value={form.website} onChange={e => handleChange('website', e.target.value)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Logotipo" subtitle="Imagem da organização exibida no sistema" icon="fa-image">
        <div className="cfg-logo-upload">
          <div className="cfg-logo-preview">
            <i className="fas fa-stethoscope" />
          </div>
          <div className="cfg-logo-info">
            <p className="cfg-logo-text">Arraste uma imagem ou clique para carregar</p>
            <p className="cfg-logo-hint">PNG, JPG ou SVG. Máximo 2MB.</p>
            <button className="btn btn-outline" style={{ marginTop: 8 }}>
              <i className="fas fa-upload" /> Carregar Imagem
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferências Regionais" subtitle="Moeda, idioma e fuso horário" icon="fa-globe">
        <div className="cfg-form-grid">
          <div className="form-group">
            <label>Moeda Padrão</label>
            <select value={form.moeda} onChange={e => handleChange('moeda', e.target.value)}>
              <option value="AOA">AOA – Kwanza Angolano</option>
              <option value="USD">USD – Dólar Americano</option>
              <option value="EUR">EUR – Euro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Idioma do Sistema</label>
            <select value={form.idioma} onChange={e => handleChange('idioma', e.target.value)}>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group">
            <label>Fuso Horário</label>
            <select value={form.fusoHorario} onChange={e => handleChange('fusoHorario', e.target.value)}>
              <option value="Africa/Luanda">Africa/Luanda (WAT, UTC+1)</option>
              <option value="Europe/Lisbon">Europe/Lisbon (WET, UTC+0)</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <div className="cfg-actions">
        <button className="btn btn-outline">Cancelar</button>
        <button className="btn btn-primary" onClick={handleSalvar} style={{ gap: 6 }}>
          <i className={`fas ${salvo ? 'fa-check' : 'fa-save'}`} />
          {salvo ? 'Salvo com sucesso!' : 'Guardar Alterações'}
        </button>
      </div>
    </>
  );
}

// ============================================================
// TAB: UTILIZADORES & SEGURANÇA
// ============================================================
const ROLE_LABELS = { superadmin: 'Super Administrador', admin: 'Administrador', user: 'Utilizador' };
const ROLE_COLORS = { superadmin: '#8b5cf6', admin: '#3b82f6', user: '#10b981' };

function TabUtilizadores({ user: currentUser }) {
  const [utilizadores, setUtilizadores] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [novoUser, setNovoUser] = useState({ username: '', password: '', nome_completo: '', email: '', role: 'user' });
  const [toast, setToast] = useState({ msg: '', error: false });
  const [loading, setLoading] = useState(false);

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: '', error: false }), 3500);
  };

  const carregarUsers = () => {
    if (typeof window !== 'undefined' && window.electron) window.electron.getUsers();
  };

  useEffect(() => {
    carregarUsers();
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.onGetUsers(data => { if (data.success) setUtilizadores(data.users || []); });
      window.electron.onAddUserResult(result => {
        setLoading(false);
        if (result.success) { setShowAddModal(false); setNovoUser({ username: '', password: '', nome_completo: '', email: '', role: 'user' }); carregarUsers(); showToast('Utilizador criado com sucesso!'); }
        else showToast('Erro: ' + result.error, true);
      });
      window.electron.onUpdateUserResult(result => {
        if (result.success) { setEditTarget(null); carregarUsers(); showToast('Utilizador atualizado!'); }
        else showToast('Erro: ' + result.error, true);
      });
      window.electron.onDeleteUserResult(result => {
        if (result.success) { carregarUsers(); showToast('Utilizador desativado.'); }
        else showToast('Erro: ' + result.error, true);
      });
      window.electron.onLimparDadosResult(result => {
        if (result.success) { showToast('Dados de teste eliminados com sucesso!'); }
        else showToast('Erro ao limpar dados: ' + result.error, true);
      });
      window.electron.onReiniciarBdResult(result => {
        if (result.success) { showToast('Base de dados reiniciada com sucesso! Faça login novamente.'); setTimeout(() => window.location.reload(), 2000); }
        else showToast('Erro ao reiniciar base de dados: ' + result.error, true);
      });
    }
    return () => {
      if (typeof window !== 'undefined' && window.electron) {
        ['get-users-result', 'add-user-result', 'update-user-result', 'delete-user-result', 'limpar-dados-result', 'reiniciar-bd-result'].forEach(ch => window.electron.removeAllListeners(ch));
      }
    };
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!novoUser.username || !novoUser.password) return showToast('Nome de utilizador e palavra-passe são obrigatórios.', true);
    if (novoUser.password.length < 6) return showToast('A palavra-passe deve ter pelo menos 6 caracteres.', true);
    if (typeof window === 'undefined' || !window.electron) return;
    setLoading(true);
    window.electron.addUser({ ...novoUser, criadoPor: currentUser?.username });
  };

  const handleToggleAtivo = (u) => {
    if (typeof window === 'undefined' || !window.electron) return;
    window.electron.updateUser({ id: u.id, nome_completo: u.nome_completo, email: u.email, role: u.role, ativo: u.ativo ? 0 : 1, editadoPor: currentUser?.username });
  };

  return (
    <>
      {toast.msg && (
        <div style={{ background: toast.error ? '#fee2e2' : '#d1fae5', color: toast.error ? '#ef4444' : '#10b981', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
          <i className={`fas ${toast.error ? 'fa-exclamation-circle' : 'fa-check-circle'}`} style={{ marginRight: 8 }} />{toast.msg}
        </div>
      )}
      <SectionCard title="Utilizadores do Sistema" subtitle="Gestão de contas e permissões de acesso" icon="fa-users">
        <div className="cfg-users-header">
          <span className="cfg-users-count">{utilizadores.length} utilizador{utilizadores.length !== 1 ? 'es' : ''}</span>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus" /> Novo Utilizador
          </button>
        </div>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Nome Completo</th>
                  <th>Papel</th>
                  <th>Estado</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {utilizadores.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="cfg-user-avatar">{(u.username || 'U').substring(0, 2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.nome_completo || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>
                      <span style={{ background: ROLE_COLORS[u.role] || '#6b7280', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: u.ativo ? '#d1fae5' : '#fee2e2', color: u.ativo ? '#10b981' : '#ef4444', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-AO') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => handleToggleAtivo(u)}
                            style={{ background: u.ativo ? '#fee2e2' : '#d1fae5', color: u.ativo ? '#ef4444' : '#10b981', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                            <i className={`fas ${u.ativo ? 'fa-user-slash' : 'fa-user-check'}`} /> {u.ativo ? 'Desativar' : 'Ativar'}
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
      </SectionCard>

      {/* Modal Criar Utilizador */}
      <div className={`modal${showAddModal ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
        <div className="modal-content">
          <div className="modal-header">
            <h3><i className="fas fa-user-plus" style={{ marginRight: 8 }} /> Novo Utilizador</h3>
            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nome de Utilizador *</label>
                <input required placeholder="Ex: joao.silva" value={novoUser.username} onChange={e => setNovoUser(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nome Completo</label>
                <input placeholder="Ex: João Manuel Silva" value={novoUser.nome_completo} onChange={e => setNovoUser(p => ({ ...p, nome_completo: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Palavra-passe *</label>
                <input required type="password" placeholder="••••••••" value={novoUser.password} onChange={e => setNovoUser(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Email</label>
                <input type="email" placeholder="email@exemplo.com" value={novoUser.email} onChange={e => setNovoUser(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Papel / Permissão</label>
              <select value={novoUser.role} onChange={e => setNovoUser(p => ({ ...p, role: e.target.value }))}>
                <option value="superadmin">Super Administrador — Acesso total ao sistema</option>
                <option value="admin">Administrador — Gestão completa + Registo e Configurações</option>
                <option value="user">Utilizador — Acesso ao Dashboard, Médicos, Hospitais e Pagamentos</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />} Criar Utilizador
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ============================================================
// TAB: PAGAMENTOS
// ============================================================
function TabPagamentos() {
  const [config, setConfig] = useState({
    valorQuota: 15000,
    moeda: 'AOA',
    diaVencimento: 10,
    multaActiva: true,
    percentualMulta: 5,
    diasGracePeriod: 15,
    multicaixa: true,
    transferencia: true,
    numerario: true,
    cheque: false,
    mobilePayment: true,
    trimestral: true,
    semestral: true,
    noveMeses: false,
    anual: true,
  });

  const [salvo, setSalvo] = useState(false);
  const handleSalvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  return (
    <>
      <SectionCard title="Valor da Quota" subtitle="Configuração do valor mensal das quotas dos médicos" icon="fa-money-bill-wave">
        <div className="cfg-form-grid">
          <div className="form-group">
            <label>Valor da Quota Mensal</label>
            <div className="cfg-input-group">
              <span className="cfg-input-prefix">AOA</span>
              <input
                type="number"
                value={config.valorQuota}
                onChange={e => setConfig(p => ({ ...p, valorQuota: Number(e.target.value) }))}
                style={{ paddingLeft: 52 }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Dia de Vencimento</label>
            <select value={config.diaVencimento} onChange={e => setConfig(p => ({ ...p, diaVencimento: Number(e.target.value) }))}>
              {[1, 5, 10, 15, 20, 25, 28].map(d => (
                <option key={d} value={d}>Dia {d} de cada mês</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cfg-quota-display">
          <div className="cfg-quota-display-item">
            <span>Valor Mensal</span>
            <strong>AOA {config.valorQuota?.toLocaleString('pt-AO')}</strong>
          </div>
          <div className="cfg-quota-display-item">
            <span>Valor Anual</span>
            <strong>AOA {(config.valorQuota * 12)?.toLocaleString('pt-AO')}</strong>
          </div>
          <div className="cfg-quota-display-item">
            <span>Vencimento</span>
            <strong>Dia {config.diaVencimento}</strong>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Multa por Atraso" subtitle="Configuração de penalizações por pagamento em atraso" icon="fa-exclamation-circle">
        <Toggle checked={config.multaActiva} onChange={v => setConfig(p => ({ ...p, multaActiva: v }))} label="Activar multa por atraso" />
        {config.multaActiva && (
          <div className="cfg-form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Percentual de Multa</label>
              <div className="cfg-input-group">
                <input
                  type="number"
                  value={config.percentualMulta}
                  onChange={e => setConfig(p => ({ ...p, percentualMulta: Number(e.target.value) }))}
                />
                <span className="cfg-input-suffix">%</span>
              </div>
            </div>
            <div className="form-group">
              <label>Período de Graça (dias)</label>
              <input
                type="number"
                value={config.diasGracePeriod}
                onChange={e => setConfig(p => ({ ...p, diasGracePeriod: Number(e.target.value) }))}
              />
            </div>
            <div className="cfg-multa-preview" style={{ gridColumn: 'span 2' }}>
              <i className="fas fa-calculator" />
              <span>
                Após {config.diasGracePeriod} dias de atraso, será aplicada uma multa de{' '}
                <strong>{config.percentualMulta}%</strong> (AOA {Math.round(config.valorQuota * config.percentualMulta / 100).toLocaleString('pt-AO')}) sobre o valor da quota.
              </span>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Métodos de Pagamento" subtitle="Métodos de pagamento aceites pelo sistema" icon="fa-wallet">
        <div className="cfg-methods-grid">
          <div className={`cfg-method-card${config.multicaixa ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, multicaixa: !p.multicaixa }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <i className="fas fa-mobile-screen-button" />
            </div>
            <span>Multicaixa Express</span>
            <div className={`cfg-toggle small${config.multicaixa ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.transferencia ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, transferencia: !p.transferencia }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <i className="fas fa-building-columns" />
            </div>
            <span>Transferência Bancária</span>
            <div className={`cfg-toggle small${config.transferencia ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.numerario ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, numerario: !p.numerario }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <i className="fas fa-money-bill" />
            </div>
            <span>Numerário</span>
            <div className={`cfg-toggle small${config.numerario ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.cheque ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, cheque: !p.cheque }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              <i className="fas fa-money-check" />
            </div>
            <span>Cheque</span>
            <div className={`cfg-toggle small${config.cheque ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.mobilePayment ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, mobilePayment: !p.mobilePayment }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>
              <i className="fas fa-qrcode" />
            </div>
            <span>Pagamento Móvel</span>
            <div className={`cfg-toggle small${config.mobilePayment ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Planos de Pagamento" subtitle="Períodos de pagamento disponíveis para os médicos" icon="fa-calendar-days">
        <div className="cfg-methods-grid">
          <div className={`cfg-method-card${config.trimestral ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, trimestral: !p.trimestral }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <i className="fas fa-calendar-week" />
            </div>
            <span>Trimestral (3 meses)</span>
            <div className={`cfg-toggle small${config.trimestral ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.semestral ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, semestral: !p.semestral }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <i className="fas fa-calendar-day" />
            </div>
            <span>Semestral (6 meses)</span>
            <div className={`cfg-toggle small${config.semestral ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.noveMeses ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, noveMeses: !p.noveMeses }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <i className="fas fa-calendar-plus" />
            </div>
            <span>9 Meses</span>
            <div className={`cfg-toggle small${config.noveMeses ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
          <div className={`cfg-method-card${config.anual ? ' active' : ''}`} onClick={() => setConfig(p => ({ ...p, anual: !p.anual }))}>
            <div className="cfg-method-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              <i className="fas fa-calendar-alt" />
            </div>
            <span>Anual (12 meses)</span>
            <div className={`cfg-toggle small${config.anual ? ' on' : ''}`}><div className="cfg-toggle-knob" /></div>
          </div>
        </div>
      </SectionCard>

      <div className="cfg-actions">
        <button className="btn btn-outline">Cancelar</button>
        <button className="btn btn-primary" onClick={handleSalvar} style={{ gap: 6 }}>
          <i className={`fas ${salvo ? 'fa-check' : 'fa-save'}`} />
          {salvo ? 'Salvo com sucesso!' : 'Guardar Alterações'}
        </button>
      </div>
    </>
  );
}

// ============================================================
// TAB: NOTIFICAÇÕES
// ============================================================
function TabNotificacoesConfig() {
  const [config, setConfig] = useState({
    emailActivo: false,
    emailServidor: '',
    emailPorta: 587,
    alertaPagamento: true,
    alertaNovoMedico: true,
    alertaQuotaVencida: true,
    alertaSistema: true,
    frequenciaLembrete: 'semanal',
    diasAntesLembrete: 5,
    resumoDiario: false,
    notifSom: true,
  });

  const [salvo, setSalvo] = useState(false);
  const handleSalvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  return (
    <>
      <SectionCard title="Notificações por Email" subtitle="Configurar envio de notificações por email" icon="fa-envelope">
        <Toggle checked={config.emailActivo} onChange={v => setConfig(p => ({ ...p, emailActivo: v }))} label="Activar notificações por email" />
        {config.emailActivo && (
          <div className="cfg-form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Servidor SMTP</label>
              <input placeholder="smtp.exemplo.ao" value={config.emailServidor} onChange={e => setConfig(p => ({ ...p, emailServidor: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Porta</label>
              <input type="number" value={config.emailPorta} onChange={e => setConfig(p => ({ ...p, emailPorta: Number(e.target.value) }))} />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Tipos de Alerta" subtitle="Escolha quais alertas quer receber no sistema" icon="fa-filter">
        <div className="cfg-alert-list">
          <Toggle checked={config.alertaPagamento} onChange={v => setConfig(p => ({ ...p, alertaPagamento: v }))} label="Alertas de pagamento (atraso, pendente, confirmado)" />
          <Toggle checked={config.alertaNovoMedico} onChange={v => setConfig(p => ({ ...p, alertaNovoMedico: v }))} label="Novo médico registado no sistema" />
          <Toggle checked={config.alertaQuotaVencida} onChange={v => setConfig(p => ({ ...p, alertaQuotaVencida: v }))} label="Quotas vencidas ou prestes a vencer" />
          <Toggle checked={config.alertaSistema} onChange={v => setConfig(p => ({ ...p, alertaSistema: v }))} label="Actualizações e alertas do sistema" />
          <Toggle checked={config.resumoDiario} onChange={v => setConfig(p => ({ ...p, resumoDiario: v }))} label="Resumo diário por email" />
          <Toggle checked={config.notifSom} onChange={v => setConfig(p => ({ ...p, notifSom: v }))} label="Som de notificação" />
        </div>
      </SectionCard>

      <SectionCard title="Lembretes Automáticos" subtitle="Frequência de envio de lembretes a médicos" icon="fa-clock">
        <div className="cfg-form-grid">
          <div className="form-group">
            <label>Frequência de Lembretes</label>
            <select value={config.frequenciaLembrete} onChange={e => setConfig(p => ({ ...p, frequenciaLembrete: e.target.value }))}>
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dias antes do vencimento para lembrete</label>
            <input type="number" value={config.diasAntesLembrete} onChange={e => setConfig(p => ({ ...p, diasAntesLembrete: Number(e.target.value) }))} />
          </div>
        </div>
      </SectionCard>

      <div className="cfg-actions">
        <button className="btn btn-outline">Cancelar</button>
        <button className="btn btn-primary" onClick={handleSalvar} style={{ gap: 6 }}>
          <i className={`fas ${salvo ? 'fa-check' : 'fa-save'}`} />
          {salvo ? 'Salvo com sucesso!' : 'Guardar Alterações'}
        </button>
      </div>
    </>
  );
}

// ============================================================
// TAB: BASE DE DADOS
// ============================================================
function TabBaseDados() {
  const [backupEmCurso, setBackupEmCurso] = useState(false);

  const simularBackup = () => {
    setBackupEmCurso(true);
    setTimeout(() => setBackupEmCurso(false), 3000);
  };

  return (
    <>
      <SectionCard title="Informações da Base de Dados" subtitle="Detalhes técnicos sobre o armazenamento" icon="fa-circle-info">
        <div className="cfg-db-info-grid">
          <div className="cfg-db-info-card">
            <div className="cfg-db-info-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>
              <i className="fas fa-database" />
            </div>
            <div>
              <span className="cfg-db-info-label">Motor</span>
              <span className="cfg-db-info-value">SQLite 3</span>
            </div>
          </div>
          <div className="cfg-db-info-card">
            <div className="cfg-db-info-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>
              <i className="fas fa-hard-drive" />
            </div>
            <div>
              <span className="cfg-db-info-label">Tamanho</span>
              <span className="cfg-db-info-value">2.4 MB</span>
            </div>
          </div>
          <div className="cfg-db-info-card">
            <div className="cfg-db-info-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>
              <i className="fas fa-table" />
            </div>
            <div>
              <span className="cfg-db-info-label">Tabelas</span>
              <span className="cfg-db-info-value">5 tabelas</span>
            </div>
          </div>
          <div className="cfg-db-info-card">
            <div className="cfg-db-info-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--orange)' }}>
              <i className="fas fa-folder-open" />
            </div>
            <div>
              <span className="cfg-db-info-label">Localização</span>
              <span className="cfg-db-info-value" style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>%APPDATA%/sigo2m/sigo2m.sqlite</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Tabelas do Sistema" subtitle="Estrutura actual da base de dados" icon="fa-layer-group">
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Tabela</th>
                  <th>Descrição</th>
                  <th>Colunas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>users</code></td>
                  <td>Utilizadores do sistema</td>
                  <td><span className="badge badge-info">3 colunas</span></td>
                </tr>
                <tr>
                  <td><code style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>hospitais</code></td>
                  <td>Unidades de saúde registadas</td>
                  <td><span className="badge badge-success">4 colunas</span></td>
                </tr>
                <tr>
                  <td><code style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>medicos</code></td>
                  <td>Médicos registados na Ordem</td>
                  <td><span className="badge badge-purple">7 colunas</span></td>
                </tr>
                <tr>
                  <td><code style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--orange)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>pagamentos</code></td>
                  <td>Registo de pagamentos e quotas</td>
                  <td><span className="badge badge-warning">9 colunas</span></td>
                </tr>
                <tr>
                  <td><code style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>configuracoes_dashboard</code></td>
                  <td>Configurações do dashboard</td>
                  <td><span className="badge badge-danger">2 colunas</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Backup & Exportação" subtitle="Ferramentas de backup e recuperação de dados" icon="fa-shield-halved">
        <div className="cfg-backup-grid">
          <div className="cfg-backup-card">
            <div className="cfg-backup-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>
              <i className="fas fa-download" />
            </div>
            <div>
              <h4>Exportar Backup</h4>
              <p>Criar uma cópia completa da base de dados</p>
            </div>
            <button className="btn btn-success" onClick={simularBackup} disabled={backupEmCurso}>
              {backupEmCurso ? (
                <><i className="fas fa-spinner fa-spin" /> A exportar...</>
              ) : (
                <><i className="fas fa-download" /> Exportar</>
              )}
            </button>
          </div>
          <div className="cfg-backup-card">
            <div className="cfg-backup-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>
              <i className="fas fa-upload" />
            </div>
            <div>
              <h4>Importar Backup</h4>
              <p>Restaurar dados a partir de um ficheiro de backup</p>
            </div>
            <button className="btn btn-outline">
              <i className="fas fa-upload" /> Importar
            </button>
          </div>
        </div>
        <div className="cfg-backup-status">
          <i className="fas fa-clock" style={{ color: 'var(--text-muted)' }} />
          <span>Último backup: <strong>Hoje, 03:00</strong> — Tamanho: 2.4 MB</span>
        </div>
      </SectionCard>

      <SectionCard title="Zona de Perigo" subtitle="Acções irreversíveis — usar com cuidado" icon="fa-triangle-exclamation">
        <div className="cfg-danger-zone">
          <div className="cfg-danger-item">
            <div>
              <h4>Limpar Dados de Teste</h4>
              <p>Remove todos os dados de teste inseridos durante a configuração inicial</p>
            </div>
            <button className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}
              onClick={() => {
                if (window.confirm('Tem a certeza que deseja limpar os dados de teste? Esta acção é irreversível.')) {
                  if (typeof window !== 'undefined' && window.electron) {
                    window.electron.limparDados({ usuario: currentUser?.username });
                  } else {
                    alert('Funcionalidade apenas disponível no ambiente Electron.');
                  }
                }
              }}
            >
              <i className="fas fa-broom" /> Limpar
            </button>
          </div>
          <div className="cfg-danger-item">
            <div>
              <h4>Reiniciar Base de Dados</h4>
              <p>Apaga todos os dados e recria as tabelas do zero. Esta acção é irreversível.</p>
            </div>
            <button className="btn" style={{ background: 'var(--red)', color: '#fff' }}
              onClick={() => {
                if (window.confirm('ATENÇÃO: Esta acção vai apagar TODOS os dados permanentemente. Tem a certeza absoluta?')) {
                  if (window.confirm('Confirmação final: todos os dados serão eliminados. Continuar?')) {
                    if (typeof window !== 'undefined' && window.electron) {
                      window.electron.reiniciarBd();
                    } else {
                      alert('Funcionalidade apenas disponível no ambiente Electron.');
                    }
                  }
                }
              }}
            >
              <i className="fas fa-trash-alt" /> Reiniciar
            </button>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Configuracoes({ user }) {
  const [activeTab, setActiveTab] = useState('geral');

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>⚙️ Configurações do Sistema</h1>
          <nav>Início / <span>Configurações</span></nav>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="cfg-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`cfg-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fas ${tab.icon}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="cfg-content">
        {activeTab === 'geral' && <TabGeral />}
        {activeTab === 'utilizadores' && <TabUtilizadores user={user} />}
        {activeTab === 'pagamentos' && <TabPagamentos />}
        {activeTab === 'notificacoes' && <TabNotificacoesConfig />}
        {activeTab === 'basedados' && <TabBaseDados />}
      </div>
    </div>
  );
}
