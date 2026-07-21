'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Hospitais from '@/components/Hospitais';
import Pagamentos from '@/components/Pagamentos';
import Medicos from '@/components/Medicos';
import Notificacoes from '@/components/Notificacoes';
import Configuracoes from '@/components/Configuracoes';
import Auditoria from '@/components/Auditoria';
import Login from '@/components/Login';

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleNavigate = (e) => {
      if (e.detail?.to) setActiveSection(e.detail.to);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('navigate', handleNavigate);
      return () => window.removeEventListener('navigate', handleNavigate);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setActiveSection('dashboard');
    // Limpar listeners pendentes
    if (typeof window !== 'undefined' && window.electron) {
      ['medicos-lista-result', 'hospitais-lista-result', 'pagamentos-lista-result',
       'notificacoes-lista-result', 'full-dashboard-stats-result'].forEach(ch => {
        window.electron.removeAllListeners(ch);
      });
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={activeSection} onNavigate={setActiveSection} user={user} onLogout={handleLogout} />
      <main className="main-area">
        <div className="content-scroll">
          {activeSection === 'dashboard' && <Dashboard user={user} />}
          {activeSection === 'hospitais' && <Hospitais user={user} />}
          {activeSection === 'pagamentos' && <Pagamentos user={user} />}
          {activeSection === 'medicos' && <Medicos user={user} />}
          {activeSection === 'notificacoes' && <Notificacoes user={user} />}
          {activeSection === 'auditoria' && <Auditoria user={user} />}
          {activeSection === 'configuracoes' && <Configuracoes user={user} />}
        </div>
      </main>
    </div>
  );
}
