'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Hospitais from '@/components/Hospitais';
import Pagamentos from '@/components/Pagamentos';

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="app-shell">
      <Sidebar active={activeSection} onNavigate={setActiveSection} />
      <main className="main-area">
        <div className="content-scroll">
          {activeSection === 'dashboard' && <Dashboard />}
          {activeSection === 'hospitais' && <Hospitais />}
          {activeSection === 'pagamentos' && <Pagamentos />}
        </div>
      </main>
    </div>
  );
}
