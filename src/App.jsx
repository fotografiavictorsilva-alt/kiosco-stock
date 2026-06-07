import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './components/Login';
import { db } from './utils/db';
import { CLIENT_CONFIG } from './config';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import SalesPOS from './components/SalesPOS';
import SalesHistory from './components/SalesHistory';
import BackupSettings from './components/BackupSettings';

export const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  SalesPOS: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  SalesHistory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    </svg>
  ),
  BackupSettings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9z" />
    </svg>
  ),
  Plus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  Minus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  Edit: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" /></svg>),
  Trash: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>),
  Search: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
  Close: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
  AlertTriangle: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>),
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await db.init();
      setBusinessName(db.getBusinessName());
      if (CLIENT_CONFIG.theme) {
        const root = document.documentElement;
        if (CLIENT_CONFIG.theme.primary) root.style.setProperty('--primary', CLIENT_CONFIG.theme.primary);
        if (CLIENT_CONFIG.theme.primaryHover) root.style.setProperty('--primary-hover', CLIENT_CONFIG.theme.primaryHover);
        if (CLIENT_CONFIG.theme.secondary) root.style.setProperty('--secondary', CLIENT_CONFIG.theme.secondary);
        if (CLIENT_CONFIG.theme.secondaryHover) root.style.setProperty('--secondary-hover', CLIENT_CONFIG.theme.secondaryHover);
      }
      setLoadingAuth(false);
    };

    initialize().catch(() => setLoadingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await db.init();
        setBusinessName(db.getBusinessName());
        setRefreshTrigger(prev => prev + 1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingAuth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'white', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span>Cargando...</span>
    </div>
  );

  if (!session) return <Login />;

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard refreshTrigger={refreshTrigger} setActiveTab={setActiveTab} />;
      case 'inventory': return <Inventory refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} showToast={showToast} />;
      case 'sales': return <SalesPOS refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} showToast={showToast} />;
      case 'history': return <SalesHistory refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} showToast={showToast} />;
      case 'settings': return <BackupSettings refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} showToast={showToast} setActiveTab={setActiveTab} onBusinessNameChange={setBusinessName} />;
      default: return <Dashboard refreshTrigger={refreshTrigger} setActiveTab={setActiveTab} />;
    }
  };

  const displayName = businessName || CLIENT_CONFIG.kioskName || 'Mi Negocio';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">{displayName.charAt(0).toUpperCase()}</div>
          <span className="sidebar-logo-text">{displayName}</span>
        </div>
        <nav>
          <ul className="sidebar-menu">
            {[
              { key: 'dashboard', icon: <Icons.Dashboard />, label: 'Panel de Control' },
              { key: 'inventory', icon: <Icons.Inventory />, label: 'Inventario' },
              { key: 'sales', icon: <Icons.SalesPOS />, label: 'Registrar Venta' },
              { key: 'history', icon: <Icons.SalesHistory />, label: 'Historial y Reportes' },
              { key: 'settings', icon: <Icons.BackupSettings />, label: 'Ajustes y Respaldos' },
            ].map(({ key, icon, label }) => (
              <li key={key} className="sidebar-item">
                <button onClick={() => setActiveTab(key)} className={`sidebar-link ${activeTab === key ? 'active' : ''}`}>
                  {icon}<span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>VS Gestion v2.0.0</div>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()} style={{ width: '100%', fontSize: '0.8rem' }}>
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="main-content">{renderContent()}</main>
      {toast.visible && (
        <div className={`toast ${toast.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
