const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createDatabase } = require('./src/database');

let database;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000, // Aumentado um pouco para acomodar melhor a tabela
    height: 750,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'app', 'app.html'));
}

app.whenReady().then(async () => {
  database = createDatabase();
  await database.initialize();
  createWindow();
});

// Autenticação de Usuário
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

// --- Manipuladores IPC para Hospitais ---

// 1. Inserir Hospital no Banco
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

// 2. Buscar Totais para o Dashboard
ipcMain.on('get-dashboard-stats', (event) => {
  database.db.get('SELECT COUNT(*) as total FROM hospitais', [], (err, row) => {
    if (err) {
      event.reply('dashboard-stats-result', { success: false, error: err.message });
      return;
    }
    event.reply('dashboard-stats-result', { success: true, totalHospitais: row.total });
  });
});

// 3. Buscar a Lista Completa de Hospitais para a Tabela
ipcMain.on('get-hospitais-lista', (event) => {
  database.db.all('SELECT id, nome, endereco, telefone FROM hospitais ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      event.reply('hospitais-lista-result', { success: false, error: err.message });
      return;
    }
    event.reply('hospitais-lista-result', { success: true, lista: rows });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});