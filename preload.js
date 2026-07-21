const { contextBridge, ipcRenderer } = require('electron');

// Helper: register a listener only once per channel (deduplicates on re-mount)
function onceRegistered(channel, cb) {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, (_e, data) => cb(data));
}

contextBridge.exposeInMainWorld('electron', {
  // === Autenticação ===
  authenticateUser: (credentials) => ipcRenderer.send('authenticate-user', credentials),
  onAuthResult: (cb) => onceRegistered('authentication-result', cb),

  // === Hospitais ===
  addHospital: (dados) => ipcRenderer.send('add-hospital', dados),
  onAddHospitalResult: (cb) => onceRegistered('add-hospital-result', cb),
  updateHospital: (dados) => ipcRenderer.send('update-hospital', dados),
  onUpdateHospitalResult: (cb) => onceRegistered('update-hospital-result', cb),

  getDashboardStats: () => ipcRenderer.send('get-dashboard-stats'),
  onDashboardStats: (cb) => onceRegistered('dashboard-stats-result', cb),

  getHospitaisLista: () => ipcRenderer.send('get-hospitais-lista'),
  onHospitaisLista: (cb) => onceRegistered('hospitais-lista-result', cb),

  // === Médicos ===
  getMedicosLista: () => ipcRenderer.send('get-medicos-lista'),
  onMedicosLista: (cb) => onceRegistered('medicos-lista-result', cb),

  addMedico: (dados) => ipcRenderer.send('add-medico', dados),
  onAddMedicoResult: (cb) => onceRegistered('add-medico-result', cb),

  updateMedico: (dados) => ipcRenderer.send('update-medico', dados),
  onUpdateMedicoResult: (cb) => onceRegistered('update-medico-result', cb),

  renovarCarteira: (dados) => ipcRenderer.send('renovar-carteira', dados),
  onRenovarCarteiraResult: (cb) => onceRegistered('renovar-carteira-result', cb),

  getMedicosStats: () => ipcRenderer.send('get-medicos-stats'),
  onMedicosStats: (cb) => onceRegistered('medicos-stats-result', cb),

  // === Pagamentos ===
  addPagamento: (dados) => ipcRenderer.send('add-pagamento', dados),
  onAddPagamentoResult: (cb) => onceRegistered('add-pagamento-result', cb),

  getPagamentosStats: () => ipcRenderer.send('get-pagamentos-stats'),
  onPagamentosStats: (cb) => onceRegistered('pagamentos-stats-result', cb),

  getPagamentosLista: () => ipcRenderer.send('get-pagamentos-lista'),
  onPagamentosLista: (cb) => onceRegistered('pagamentos-lista-result', cb),

  updatePagamentoStatus: (dados) => ipcRenderer.send('update-pagamento-status', dados),
  onUpdatePagamentoStatus: (cb) => onceRegistered('update-pagamento-status-result', cb),

  // === Utilizadores ===
  getUsers: () => ipcRenderer.send('get-users'),
  onGetUsers: (cb) => onceRegistered('get-users-result', cb),

  addUser: (dados) => ipcRenderer.send('add-user', dados),
  onAddUserResult: (cb) => onceRegistered('add-user-result', cb),

  updateUser: (dados) => ipcRenderer.send('update-user', dados),
  onUpdateUserResult: (cb) => onceRegistered('update-user-result', cb),

  deleteUser: (dados) => ipcRenderer.send('delete-user', dados),
  onDeleteUserResult: (cb) => onceRegistered('delete-user-result', cb),

  // === Base de Dados ===
  limparDados: (dados) => ipcRenderer.send('limpar-dados', dados),
  onLimparDadosResult: (cb) => onceRegistered('limpar-dados-result', cb),
  reiniciarBd: () => ipcRenderer.send('reiniciar-bd'),
  onReiniciarBdResult: (cb) => onceRegistered('reiniciar-bd-result', cb),

  // === Auditoria ===
  getAuditLog: (dados) => ipcRenderer.send('get-audit-log', dados),
  onGetAuditLog: (cb) => onceRegistered('get-audit-log-result', cb),

  // === Notificações ===
  getNotificacoesLista: () => ipcRenderer.send('get-notificacoes-lista'),
  onNotificacoesLista: (cb) => onceRegistered('notificacoes-lista-result', cb),
  marcarNotificacaoLida: (id, lida) => ipcRenderer.send('marcar-notificacao-lida', { id, lida }),
  marcarTodasNotificacoesLidas: () => ipcRenderer.send('marcar-todas-notificacoes-lidas'),
  eliminarNotificacao: (id) => ipcRenderer.send('eliminar-notificacao', { id }),
  onNotificacaoAcao: (cb) => onceRegistered('notificacao-acao-result', cb),

  // === Dashboard Full ===
  getFullDashboardStats: () => ipcRenderer.send('get-full-dashboard-stats'),
  onFullDashboardStats: (cb) => onceRegistered('full-dashboard-stats-result', cb),

  // Remove listeners ao desmontar
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
