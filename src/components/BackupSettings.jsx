import React, { useRef, useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Icons } from '../App';
import { supabase } from '../supabase';

export default function BackupSettings({ refreshTrigger, triggerRefresh, showToast, setActiveTab }) {
  const fileInputRef = useRef(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setBusinessName(db.getBusinessName());
  }, []);

  const handleSaveBusinessName = async () => {
    if (!businessName.trim()) {
      showToast('El nombre no puede estar vacio.', 'danger');
      return;
    }
    setSavingName(true);
    try {
      await db.saveBusinessName(businessName.trim());
      showToast('Nombre del negocio actualizado. Recarga la pagina para verlo en el menu.', 'success');
    } catch (error) {
      showToast('Error al guardar el nombre.', 'danger');
    }
    setSavingName(false);
  };

  const handleExport = () => {
    try {
      const dataStr = db.exportDb();
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const today = new Date().toISOString().split('T')[0];
      const exportFileDefaultName = `respaldo_${today}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast('Copia de seguridad exportada con exito.', 'success');
    } catch (error) {
      showToast(`Error al exportar: ${error.message}`, 'danger');
    }
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;
    fileReader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        db.importDb(fileContent);
        showToast('Copia de seguridad restaurada con exito.', 'success');
        triggerRefresh();
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveTab('dashboard');
      } catch (error) {
        showToast(error.message, 'danger');
      }
    };
    fileReader.readAsText(file, 'UTF-8');
  };

  const handleReset = () => {
    const confirmed = window.confirm('ADVERTENCIA: Estas seguro de que deseas vaciar por completo la base de datos?\nSe borraran TODOS los productos, ventas y categorias.\n\nEsta accion NO se puede deshacer.');
    if (confirmed) {
      db.resetDb();
      showToast('Base de datos restablecida a cero.', 'warning');
      triggerRefresh();
      setActiveTab('dashboard');
    }
  };

  const handleLoadSample = () => {
    const confirmed = window.confirm('Deseas sobreescribir los datos actuales y cargar los productos y ventas de prueba?');
    if (confirmed) {
      db.loadSampleData();
      showToast('Datos de prueba cargados correctamente.', 'success');
      triggerRefresh();
      setActiveTab('dashboard');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Completa los dos campos.', 'danger');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Las contrasenas no coinciden.', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      showToast('La contrasena debe tener al menos 6 caracteres.', 'danger');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(`Error: ${error.message}`, 'danger');
    } else {
      showToast('Contrasena actualizada con exito.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="animation-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Ajustes y Respaldos</h1>
          <p className="section-subtitle">Personalizacion, copias de seguridad y administracion de la base de datos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* CARD NOMBRE DEL NEGOCIO */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Nombre del Negocio
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Este nombre aparece en el menu lateral de la aplicacion.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              className="form-input"
              type="text"
              placeholder="Ej: Kiosco Don Pedro"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveBusinessName}
              disabled={savingName}
              style={{ width: '100%' }}
            >
              {savingName ? 'Guardando...' : 'Guardar Nombre'}
            </button>
          </div>
        </div>

        {/* CARD EXPORTAR / IMPORTAR */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Copias de Seguridad
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Descarga un respaldo completo en formato JSON para guardarlo en tu computadora.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
            <button onClick={handleExport} className="btn btn-secondary" style={{ width: '100%' }}>
              Exportar Base de Datos (Guardar)
            </button>
            <div style={{ position: 'relative' }}>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="btn btn-ghost" style={{ width: '100%', borderColor: 'var(--card-border)' }}>
                Importar Respaldo (Restaurar archivo .json)
              </button>
            </div>
          </div>
        </div>

        {/* CARD MANTENIMIENTO */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.AlertTriangle />
            Mantenimiento
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Herramientas para reiniciar el sistema o cargar productos de ejemplo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
            <button onClick={handleLoadSample} className="btn btn-primary" style={{ width: '100%' }}>
              Cargar Productos y Ventas de Prueba
            </button>
            <button onClick={handleReset} className="btn btn-danger" style={{ width: '100%' }}>
              Vaciar Base de Datos
            </button>
          </div>
        </div>

        {/* CARD CAMBIAR CONTRASEÑA */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Cambiar Contrasena
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Actualizá tu contrasena de acceso.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input className="form-input" type="password" placeholder="Nueva contrasena" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <input className="form-input" type="password" placeholder="Confirmar contrasena" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <button onClick={handleChangePassword} className="btn btn-primary" style={{ width: '100%' }}>
              Actualizar Contrasena
            </button>
          </div>
        </div>

      </div>

      <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>Informacion sobre el almacenamiento</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Tus datos se guardan de forma segura en la nube. Podes acceder desde cualquier dispositivo con tu usuario y contrasena.
        </p>
      </div>
    </div>
  );
}
