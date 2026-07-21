const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createDatabase } = require('./src/database');

const isDev = process.env.NODE_ENV === 'development';

let database;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
  }
}

app.whenReady().then(async () => {
  const databasePath = path.join(app.getPath('userData'), 'sigo2m.sqlite');
  database = createDatabase({ databasePath });
  await database.initialize();

  // Verificar validades ao arranque
  checkExpiredMedicos(database);

  createWindow();
});

// === Verificação de validades ===
function checkExpiredMedicos(dbInstance) {
  const sql = `SELECT id, nome, data_validade FROM medicos WHERE data_validade IS NOT NULL AND data_validade != ''`;
  dbInstance.db.all(sql, [], (err, rows) => {
    if (err) return;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    rows.forEach(m => {
      const expira = new Date(m.data_validade);
      const diffMs = expira - hoje;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias < 0) {
        // Já expirou
        const checkSql = `SELECT id FROM notificacoes WHERE tipo='alerta' AND lida=0 AND descricao LIKE ? AND titulo='Carteira Expirada'`;
        dbInstance.db.get(checkSql, [`%${m.nome}%`], (checkErr, row) => {
          if (!checkErr && !row) {
            dbInstance.addNotificacao('alerta', 'Carteira Expirada',
              `A carteira profissional do Dr(a). ${m.nome} expirou em ${m.data_validade}. Renovação urgente necessária.`, 1);
          }
        });
      } else if (diffDias >= 0 && diffDias <= 3) {
        // Expira em até 3 dias
        const checkSql = `SELECT id FROM notificacoes WHERE tipo='aviso' AND lida=0 AND descricao LIKE ? AND titulo='Carteira a Expirar'`;
        dbInstance.db.get(checkSql, [`%${m.nome}%`], (checkErr, row) => {
          if (!checkErr && !row) {
            dbInstance.addNotificacao('aviso', 'Carteira a Expirar',
              `A carteira profissional do Dr(a). ${m.nome} expira em ${diffDias === 0 ? 'hoje' : diffDias + ' dia(s)'} (${m.data_validade}). Proceda à renovação.`, 1);
          }
        });
      }
    });
  });
}

// === Autenticação ===
ipcMain.on('authenticate-user', async (_event, credentials) => {
  try {
    const user = await database.authenticateUser(credentials.username, credentials.password);
    mainWindow.webContents.send('authentication-result', { success: Boolean(user), user });
  } catch (error) {
    mainWindow.webContents.send('authentication-result', { success: false, error: error.message });
  }
});

// === Hospitais ===
ipcMain.on('add-hospital', async (event, dados) => {
  try {
    database.db.run(
      'INSERT INTO hospitais (nome, endereco, telefone, tipo) VALUES (?, ?, ?, ?)',
      [dados.nome, dados.endereco, dados.telefone || null, dados.tipo || 'Hospital Público'],
      function(err) {
        if (err) { event.reply('add-hospital-result', { success: false, error: err.message }); return; }
        database.addAuditLog('CRIAR', 'Hospital', this.lastID, `Hospital "${dados.nome}" registado.`, dados.usuario || 'Sistema');
        database.addNotificacao('hospital', 'Nova unidade de saúde', `"${dados.nome}" foi registado no sistema.`, 0);
        event.reply('add-hospital-result', { success: true, id: this.lastID });
      }
    );
  } catch (error) {
    event.reply('add-hospital-result', { success: false, error: error.message });
  }
});

ipcMain.on('update-hospital', async (event, dados) => {
  try {
    const result = await database.updateHospital(dados.id, dados, dados.usuario);
    event.reply('update-hospital-result', { success: true, ...result });
  } catch (error) {
    event.reply('update-hospital-result', { success: false, error: error.message });
  }
});

ipcMain.on('get-dashboard-stats', (event) => {
  database.db.get('SELECT COUNT(*) as total FROM hospitais', [], (err, row) => {
    if (err) { event.reply('dashboard-stats-result', { success: false, error: err.message }); return; }
    event.reply('dashboard-stats-result', { success: true, totalHospitais: row.total });
  });
});

ipcMain.on('get-hospitais-lista', async (event) => {
  try {
    const lista = await database.getHospitaisLista();
    // Contar por tipo
    database.db.get(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN tipo='Hospital Público' THEN 1 ELSE 0 END) as publicos,
      SUM(CASE WHEN tipo='Clínica Privada' THEN 1 ELSE 0 END) as privadas
      FROM hospitais`, [], (err, stats) => {
      event.reply('hospitais-lista-result', { success: true, lista, stats: stats || {} });
    });
  } catch (error) {
    event.reply('hospitais-lista-result', { success: false, error: error.message });
  }
});

// === Médicos ===
ipcMain.on('get-medicos-lista', async (event) => {
  try {
    const lista = await database.getMedicosLista();
    event.reply('medicos-lista-result', { success: true, lista: lista || [] });
  } catch (error) {
    event.reply('medicos-lista-result', { success: false, error: error.message });
  }
});

ipcMain.on('add-medico', (event, dados) => {
  const sql = `INSERT INTO medicos (nome, especialidade, telefone, email, numero_ordem, data_validade, grupo_sanguineo, hospital_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [dados.nome, dados.especialidade || null, dados.telefone || null, dados.email || null,
    dados.numero_ordem || null, dados.data_validade || null, dados.grupo_sanguineo || null, dados.hospital_id || null];
  database.db.run(sql, params, function(err) {
    if (err) { event.reply('add-medico-result', { success: false, error: err.message }); return; }
    database.addAuditLog('CRIAR', 'Médico', this.lastID, `Dr(a). ${dados.nome} registado no sistema.`, dados.usuario || 'Sistema');
    database.addNotificacao('medico', 'Novo médico registado', `Dr(a). ${dados.nome} adicionado ao sistema.`, 0);
    event.reply('add-medico-result', { success: true, id: this.lastID });
  });
});

ipcMain.on('update-medico', async (event, dados) => {
  try {
    const result = await database.updateMedico(dados.id, dados, dados.usuario);
    event.reply('update-medico-result', { success: true, ...result });
  } catch (error) {
    event.reply('update-medico-result', { success: false, error: error.message });
  }
});

ipcMain.on('renovar-carteira', async (event, dados) => {
  try {
    const result = await database.renovarCarteira(dados.medico_id, dados.nova_data, dados.nome_medico, dados.usuario);
    event.reply('renovar-carteira-result', { success: true, ...result });
  } catch (error) {
    event.reply('renovar-carteira-result', { success: false, error: error.message });
  }
});

ipcMain.on('get-medicos-stats', (event) => {
  database.db.get('SELECT COUNT(*) as total FROM medicos', [], (err, row) => {
    if (err) { event.reply('medicos-stats-result', { success: false }); return; }
    event.reply('medicos-stats-result', { success: true, total: row.total });
  });
});

// === Pagamentos ===
ipcMain.on('add-pagamento', async (event, dados) => {
  try {
    const result = await database.addPagamento(dados);
    database.addAuditLog('CRIAR', 'Pagamento', result.id, `Pagamento de ${dados.valor} AOA registado para médico ID ${dados.medico_id}.`, dados.usuario || 'Sistema');
    event.reply('add-pagamento-result', { success: true, ...result });
  } catch (error) {
    event.reply('add-pagamento-result', { success: false, error: error.message });
  }
});

ipcMain.on('get-pagamentos-stats', async (event) => {
  try {
    const stats = await database.getPagamentosStats();
    event.reply('pagamentos-stats-result', { success: true, stats });
  } catch (error) {
    event.reply('pagamentos-stats-result', { success: false, error: error.message });
  }
});

ipcMain.on('get-pagamentos-lista', async (event) => {
  try {
    const lista = await database.getPagamentosLista();
    event.reply('pagamentos-lista-result', { success: true, lista });
  } catch (error) {
    event.reply('pagamentos-lista-result', { success: false, error: error.message });
  }
});

ipcMain.on('update-pagamento-status', async (event, dados) => {
  try {
    const result = await database.updatePagamentoStatus(dados.id, dados.status);
    event.reply('update-pagamento-status-result', { success: true, ...result });
  } catch (error) {
    event.reply('update-pagamento-status-result', { success: false, error: error.message });
  }
});

// === Utilizadores ===
ipcMain.on('get-users', async (event) => {
  try {
    const users = await database.getUsers();
    event.reply('get-users-result', { success: true, users });
  } catch (error) {
    event.reply('get-users-result', { success: false, error: error.message });
  }
});

ipcMain.on('add-user', async (event, dados) => {
  try {
    const result = await database.addUser(dados);
    database.addAuditLog('CRIAR', 'Utilizador', result.id, `Utilizador "${dados.username}" criado com role "${dados.role}".`, dados.criadoPor || 'Sistema');
    event.reply('add-user-result', { success: true, ...result });
  } catch (error) {
    event.reply('add-user-result', { success: false, error: error.message });
  }
});

ipcMain.on('update-user', async (event, dados) => {
  try {
    const result = await database.updateUser(dados.id, dados);
    database.addAuditLog('EDITAR', 'Utilizador', dados.id, `Utilizador ID ${dados.id} atualizado.`, dados.editadoPor || 'Sistema');
    event.reply('update-user-result', { success: true, ...result });
  } catch (error) {
    event.reply('update-user-result', { success: false, error: error.message });
  }
});

ipcMain.on('delete-user', async (event, dados) => {
  try {
    const result = await database.deleteUser(dados.id);
    database.addAuditLog('DESATIVAR', 'Utilizador', dados.id, `Utilizador ID ${dados.id} desativado.`, dados.deletadoPor || 'Sistema');
    event.reply('delete-user-result', { success: true, ...result });
  } catch (error) {
    event.reply('delete-user-result', { success: false, error: error.message });
  }
});

// === Base de Dados ===
ipcMain.on('limpar-dados', async (event, dados) => {
  try {
    const result = await database.limparDadosTeste(dados?.usuario);
    event.reply('limpar-dados-result', { success: true, ...result });
  } catch (error) {
    event.reply('limpar-dados-result', { success: false, error: error.message });
  }
});

ipcMain.on('reiniciar-bd', async (event) => {
  try {
    const result = await database.reiniciarBaseDados();
    event.reply('reiniciar-bd-result', { success: true, ...result });
  } catch (error) {
    event.reply('reiniciar-bd-result', { success: false, error: error.message });
  }
});

// === Auditoria ===
ipcMain.on('get-audit-log', async (event, dados) => {
  try {
    const logs = await database.getAuditLog(dados?.limit || 200);
    event.reply('get-audit-log-result', { success: true, logs });
  } catch (error) {
    event.reply('get-audit-log-result', { success: false, error: error.message });
  }
});

// === Notificações ===
ipcMain.on('get-notificacoes-lista', async (event) => {
  try {
    const lista = await database.getNotificacoesLista();
    event.reply('notificacoes-lista-result', { success: true, lista });
  } catch (error) {
    event.reply('notificacoes-lista-result', { success: false, error: error.message });
  }
});

ipcMain.on('marcar-notificacao-lida', async (event, dados) => {
  try {
    await database.marcarNotificacaoLida(dados.id, dados.lida);
    event.reply('notificacao-acao-result', { success: true });
  } catch (error) {
    event.reply('notificacao-acao-result', { success: false, error: error.message });
  }
});

ipcMain.on('marcar-todas-notificacoes-lidas', async (event) => {
  try {
    await database.marcarTodasNotificacoesLidas();
    event.reply('notificacao-acao-result', { success: true });
  } catch (error) {
    event.reply('notificacao-acao-result', { success: false, error: error.message });
  }
});

ipcMain.on('eliminar-notificacao', async (event, dados) => {
  try {
    await database.eliminarNotificacao(dados.id);
    event.reply('notificacao-acao-result', { success: true });
  } catch (error) {
    event.reply('notificacao-acao-result', { success: false, error: error.message });
  }
});

// === Dashboard Full Stats ===
ipcMain.on('get-full-dashboard-stats', async (event) => {
  try {
    const stats = await database.getFullDashboardStats();
    event.reply('full-dashboard-stats-result', { success: true, stats });
  } catch (error) {
    event.reply('full-dashboard-stats-result', { success: false, error: error.message });
  }
});
