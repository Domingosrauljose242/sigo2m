const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createDatabase } = require('./src/database');

let database;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'app', 'index.html'));
}

app.whenReady().then(async () => {
  database = createDatabase();
  await database.initialize();
  createWindow();
});

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});