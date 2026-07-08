const { ipcRenderer } = require('electron');

const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageElement = document.getElementById('message');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showMessage('Preencha usuário e senha.', 'error');
    return;
  }

  showMessage('Autenticando...', '');
  ipcRenderer.send('authenticate-user', { username, password });
});

ipcRenderer.on('authentication-result', (_event, result) => {
  if (result.success) {
    showMessage(`Login realizado com sucesso, ${result.user.username}!`, 'success');
  } else {
    showMessage('Usuário ou senha inválidos.', 'error');
  }
});

function showMessage(text, type) {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`.trim();
}
