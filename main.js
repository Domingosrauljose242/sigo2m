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
    // Em desenvolvimento, carrega o servidor Next.js
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carrega a build estática do Next.js
    mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
  }
}

app.whenReady().then(async () => {
  database = createDatabase();
  await database.initialize();
  createWindow();
});

// === Autenticação ===
ipcMain.on('authenticate-user', async (_event, credentials) => {
  try {
    const user = await database.authenticateUser(credentials.username, credentials.password);
    mainWindow.webContents.send('authentication-result', {
      success: Boolean(user),
      user,
    });
  } catch (error) {
    mainWindow.webContents.send('authentication-result', {
      success: false,
      error: error.message,
    });
  }
});

// === Hospitais ===
ipcMain.on('add-hospital', async (event, dadosHospital) => {
  try {
    database.db.run(
      'INSERT INTO hospitais (nome, endereco, telefone) VALUES (?, ?, ?)',
      [dadosHospital.nome, dadosHospital.endereco, dadosHospital.telefone],
      function (err) {
        if (err) {
          event.reply('add-hospital-result', { success: false, error: err.message });
          return;
        }
        event.reply('add-hospital-result', { success: true, id: this.lastID });
      }
    );
  } catch (error) {
    event.reply('add-hospital-result', { success: false, error: error.message });
  }
});

ipcMain.on('get-dashboard-stats', (event) => {
  database.db.get('SELECT COUNT(*) as total FROM hospitais', [], (err, row) => {
    if (err) {
      event.reply('dashboard-stats-result', { success: false, error: err.message });
      return;
    }
    event.reply('dashboard-stats-result', { success: true, totalHospitais: row.total });
  });
});

ipcMain.on('get-hospitais-lista', (event) => {
  database.db.all('SELECT id, nome, endereco, telefone FROM hospitais ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      event.reply('hospitais-lista-result', { success: false, error: err.message });
      return;
    }
    event.reply('hospitais-lista-result', { success: true, lista: rows });
  });
});

// === Médicos ===
ipcMain.on('get-medicos-lista', (event) => {
  database.db.all('SELECT id, nome, especialidade FROM medicos ORDER BY nome ASC', [], (err, rows) => {
    if (err) {
      event.reply('medicos-lista-result', { success: false, error: err.message });
      return;
    }
    event.reply('medicos-lista-result', { success: true, lista: rows || [] });
  });
});

// === Pagamentos ===
ipcMain.on('add-pagamento', (event, dados) => {
  const sql = `INSERT INTO pagamentos (medico_id, valor, data_pagamento, metodo_pagamento, status, observacoes)
               VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [dados.medico_id, dados.valor, dados.data_pagamento, dados.metodo_pagamento, dados.status, dados.observacoes || null];
  database.db.run(sql, params, function (err) {
    if (err) {
      event.reply('add-pagamento-result', { success: false, error: err.message });
      return;
    }
    event.reply('add-pagamento-result', { success: true, id: this.lastID });
  });
});

ipcMain.on('get-pagamentos-stats', (event) => {
  const sql = `SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'Pago' THEN 1 ELSE 0 END) as pagos,
    SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END) as pendentes,
    SUM(CASE WHEN status = 'Pago' THEN valor ELSE 0 END) as receita_total
  FROM pagamentos`;
  database.db.get(sql, [], (err, row) => {
    if (err) {
      event.reply('pagamentos-stats-result', { success: false, error: err.message });
      return;
    }
    event.reply('pagamentos-stats-result', { success: true, stats: row });
  });
});

ipcMain.on('get-pagamentos-lista', (event) => {
  const sql = `SELECT p.*, m.nome as medico_nome, m.especialidade
               FROM pagamentos p
               LEFT JOIN medicos m ON p.medico_id = m.id
               ORDER BY p.id DESC`;
  database.db.all(sql, [], (err, rows) => {
    if (err) {
      event.reply('pagamentos-lista-result', { success: false, error: err.message });
      return;
    }
    event.reply('pagamentos-lista-result', { success: true, lista: rows || [] });
  });
});

ipcMain.on('update-pagamento-status', (event, dados) => {
  database.db.run('UPDATE pagamentos SET status = ? WHERE id = ?', [dados.status, dados.id], function (err) {
    if (err) {
      event.reply('update-pagamento-status-result', { success: false, error: err.message });
      return;
    }
    event.reply('update-pagamento-status-result', { success: true });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});