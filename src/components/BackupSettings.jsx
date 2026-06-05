import React, { useRef } from 'react';
import { db } from '../utils/db';
import { Icons } from '../App';

export default function BackupSettings({ refreshTrigger, triggerRefresh, showToast, setActiveTab }) {
  const fileInputRef = useRef(null);

  // Exportar base de datos a un archivo JSON local
  const handleExport = () => {
    try {
      const dataStr = db.exportDb();
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const today = new Date().toISOString().split('T')[0];
      const exportFileDefaultName = `respaldo_kiosco_${today}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showToast('Copia de seguridad exportada con éxito.', 'success');
    } catch (error) {
      showToast(`Error al exportar: ${error.message}`, 'danger');
    }
  };

  // Importar base de datos desde un archivo JSON local
  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        db.importDb(fileContent);
        showToast('Copia de seguridad restaurada con éxito.', 'success');
        triggerRefresh();
        
        // Limpiar el valor del input para permitir cargar el mismo archivo otra vez
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Redirigir al dashboard para ver los cambios
        setActiveTab('dashboard');
      } catch (error) {
        showToast(error.message, 'danger');
      }
    };
    
    fileReader.readAsText(file, 'UTF-8');
  };

  // Limpiar y resetear base de datos
  const handleReset = () => {
    const confirmed = window.confirm(
      '⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n¿Estás seguro de que deseas vaciar por completo la base de datos?\nSe borrarán TODOS los productos registrados, el historial de ventas y las categorías.\n\nEsta acción NO se puede deshacer.'
    );

    if (confirmed) {
      db.resetDb();
      showToast('Base de datos restablecida a cero.', 'warning');
      triggerRefresh();
      setActiveTab('dashboard');
    }
  };

  // Recargar datos semilla de prueba
  const handleLoadSample = () => {
    const confirmed = window.confirm(
      '¿Deseas sobreescribir los datos actuales y cargar los productos y ventas de prueba del Kiosco?'
    );

    if (confirmed) {
      db.loadSampleData();
      showToast('Datos de prueba cargados correctamente.', 'success');
      triggerRefresh();
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="animation-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Ajustes y Respaldos</h1>
          <p className="section-subtitle">Asegura tu información exportando copias de seguridad o administrando la base de datos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* CARD EXPORTAR / IMPORTAR */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Copias de Seguridad (Backup)
          </h2>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Descarga un respaldo completo en formato JSON para guardarlo en tu computadora. Puedes restaurarlo en cualquier momento o importarlo en otro navegador.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
            <button onClick={handleExport} className="btn btn-secondary" style={{ width: '100%' }}>
              Exportar Base de Datos (Guardar)
            </button>
            
            <div style={{ position: 'relative' }}>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                className="btn btn-ghost" 
                style={{ width: '100%', borderColor: 'var(--card-border)' }}
              >
                Importar Respaldo (Restaurar archivo .json)
              </button>
            </div>
          </div>
        </div>

        {/* CARD MANTENIMIENTO base de datos */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.AlertTriangle />
            Mantenimiento y Datos de Prueba
          </h2>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Herramientas para reiniciar el sistema o cargar productos típicos de kiosco y ventas de ejemplo para explorar el funcionamiento del programa.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
            <button onClick={handleLoadSample} className="btn btn-primary" style={{ width: '100%' }}>
              Cargar Productos y Ventas de Prueba
            </button>
            
            <button onClick={handleReset} className="btn btn-danger" style={{ width: '100%' }}>
              Vaciar Base de Datos (Limpiar Kiosco)
            </button>
          </div>
        </div>

      </div>

      {/* INFORMACIÓN ADICIONAL DE SEGURIDAD */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>ℹ️ Información sobre el almacenamiento local</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Este programa almacena toda la información del kiosco de forma segura directamente en esta computadora utilizando la tecnología <strong>localStorage</strong> de tu navegador de internet. 
          Esto significa que los datos no se borran al cerrar la pestaña o apagar la compu.
          Sin embargo, borrar el historial de navegación completo o los datos de sitios del navegador podría eliminar esta información. 
          Te recomendamos realizar una copia de seguridad semanal utilizando el botón <strong>Exportar Base de Datos</strong> para evitar pérdidas accidentales de información.
        </p>
      </div>
    </div>
  );
}
