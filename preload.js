const { contextBridge, ipcRenderer } = require('electron');

// Expõe canais IPC seguros ao frontend (Next.js / React)
contextBridge.exposeInMainWorld('electron', {
  // === Autenticação ===
  authenticateUser: (credentials) =>
    ipcRenderer.send('authenticate-user', credentials),
  onAuthResult: (cb) =>
    ipcRenderer.on('authentication-result', (_e, data) => cb(data)),

  // === Hospitais ===
  addHospital: (dados) => ipcRenderer.send('add-hospital', dados),
  onAddHospitalResult: (cb) =>
    ipcRenderer.on('add-hospital-result', (_e, data) => cb(data)),

  getDashboardStats: () => ipcRenderer.send('get-dashboard-stats'),
  onDashboardStats: (cb) =>
    ipcRenderer.on('dashboard-stats-result', (_e, data) => cb(data)),

  getHospitaisLista: () => ipcRenderer.send('get-hospitais-lista'),
  onHospitaisLista: (cb) =>
    ipcRenderer.on('hospitais-lista-result', (_e, data) => cb(data)),

  // === Médicos ===
  getMedicosLista: () => ipcRenderer.send('get-medicos-lista'),
  onMedicosLista: (cb) =>
    ipcRenderer.on('medicos-lista-result', (_e, data) => cb(data)),

  // === Pagamentos ===
  addPagamento: (dados) => ipcRenderer.send('add-pagamento', dados),
  onAddPagamentoResult: (cb) =>
    ipcRenderer.on('add-pagamento-result', (_e, data) => cb(data)),

  getPagamentosStats: () => ipcRenderer.send('get-pagamentos-stats'),
  onPagamentosStats: (cb) =>
    ipcRenderer.on('pagamentos-stats-result', (_e, data) => cb(data)),

  getPagamentosLista: () => ipcRenderer.send('get-pagamentos-lista'),
  onPagamentosLista: (cb) =>
    ipcRenderer.on('pagamentos-lista-result', (_e, data) => cb(data)),

  updatePagamentoStatus: (dados) =>
    ipcRenderer.send('update-pagamento-status', dados),
  onUpdatePagamentoStatus: (cb) =>
    ipcRenderer.on('update-pagamento-status-result', (_e, data) => cb(data)),

  // Remove listeners ao desmontar componentes
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
