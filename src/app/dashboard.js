// Logica do Dashboard
document.addEventListener('DOMContentLoaded', () => {
  const userJson = localStorage.getItem('user');

  if (!userJson) {
    // Redireciona para login se nao estiver logado
    window.location.href = 'index.html';
    return;
  }

  const user = JSON.parse(userJson);
  const usernameDisplay = document.getElementById('usernameDisplay');
  usernameDisplay.textContent = `Olá, ${user.username || 'Usuário'}`;

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
});
