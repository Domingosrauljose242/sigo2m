'use client';

import { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Demasiadas tentativas. Tente novamente em ${remainingSecs}s.`);
      return;
    }

    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    if (typeof window !== 'undefined' && window.electron) {
      // Remove any previous listener before registering a new one to prevent double-login on rapid clicks
      window.electron.removeAllListeners('authentication-result');
      window.electron.authenticateUser({ username, password });
      // Safety timeout — reset loading after 10s if IPC never responds
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Tempo limite excedido. Por favor, tente novamente.');
        window.electron.removeAllListeners('authentication-result');
      }, 10000);
      window.electron.onAuthResult((result) => {
        clearTimeout(timeout);
        setLoading(false);
        if (result.success) {
          setAttempts(0);
          setLockoutUntil(null);
          onLogin(result.user);
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= 5) {
            setLockoutUntil(Date.now() + 60000); // 1 minuto de bloqueio
            setError('Múltiplas tentativas falhadas. Conta bloqueada por 1 minuto.');
          } else {
            setError(result.error || 'Credenciais inválidas.');
          }
        }
        window.electron.removeAllListeners('authentication-result');
      });
    } else {
      // Para ambiente de desenvolvimento no browser
      setLoading(false);
      if (username === 'admin' && password === 'admin123') {
        setAttempts(0);
        setLockoutUntil(null);
        onLogin({ id: 1, username: 'admin' });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 60000);
          setError('Múltiplas tentativas falhadas. Conta bloqueada por 1 minuto.');
        } else {
          setError('Apenas simulação no browser. Tente admin / admin123');
        }
      }
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      background: '#f8fafc'
    }}>
      {/* Lado Esquerdo - Banner Decorativo */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        overflow: 'hidden',
        padding: '40px'
      }}>
        {/* Elementos decorativos (círculos difusos) */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(56, 189, 248, 0.2)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.2)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 24px auto',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <i className="fas fa-notes-medical" style={{ color: '#38bdf8' }}></i>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>SIGO2M</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' }}>
            Plataforma centralizada para Gestão da Ordem dos Médicos. Acesso restrito a administradores autorizados.
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>Bem-vindo de volta</h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>Introduza as suas credenciais para aceder ao painel.</p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#ef4444',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #fee2e2'
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '10px', fontSize: '16px' }}></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: '600' }}>Nome de Utilizador</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-user" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    background: '#f8fafc'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  placeholder="admin"
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: '#334155', fontSize: '14px', fontWeight: '600', margin: 0 }}>Palavra-passe</label>
              </div>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 44px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    background: '#f8fafc'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#38bdf8'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#475569'}
                  onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.8 : 1,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => { if (!loading) { e.target.style.background = '#1e293b'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.target.style.background = '#0f172a'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; } }}
              onMouseDown={(e) => { if (!loading) e.target.style.transform = 'translateY(1px)'; }}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Aceder ao Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
