import React, { useState, useEffect } from 'react';
import { db, formatCurrency } from '../utils/db';
import { Icons } from '../App';

export default function Dashboard({ refreshTrigger, setActiveTab }) {
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalStockItems: 0,
    totalCostValue: 0,
    totalSellValue: 0,
    estimatedProfit: 0,
    lowStockCount: 0,
    criticalStockCount: 0,
    expiredCount: 0,
    nearExpirationCount: 0
  });

  const [alerts, setAlerts] = useState({
    lowStockList: [],
    expirationList: []
  });

  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    const products = db.getProducts();
    const today = new Date('2026-06-04'); // Fecha simulada actual

    let costValue = 0;
    let sellValue = 0;
    let totalStock = 0;
    let lowStock = 0;
    let criticalStock = 0;
    let expired = 0;
    let nearExp = 0;

    const lowStockItems = [];
    const expirationItems = [];

    // Agrupación por categoría
    const categoriesCount = {};

    products.forEach(p => {
      totalStock += p.stock;
      costValue += p.purchasePrice * p.stock;
      sellValue += p.sellingPrice * p.stock;

      // Evaluar stock
      if (p.stock === 0) {
        criticalStock++;
        lowStockItems.push({ ...p, status: 'Sin Stock' });
      } else if (p.stock <= p.minStock) {
        lowStock++;
        lowStockItems.push({ ...p, status: 'Stock Bajo' });
      }

      // Evaluar vencimiento
      if (p.expirationDate) {
        const expDate = new Date(p.expirationDate);
        // Diferencia en días
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          expired++;
          expirationItems.push({ ...p, expStatus: 'Vencido', diffDays });
        } else if (diffDays <= 15) {
          nearExp++;
          expirationItems.push({ ...p, expStatus: `Vence en ${diffDays} días`, diffDays });
        }
      }

      // Contar categorías
      categoriesCount[p.category] = (categoriesCount[p.category] || 0) + p.stock;
    });

    // Ordenar alertas
    lowStockItems.sort((a, b) => a.stock - b.stock);
    expirationItems.sort((a, b) => a.diffDays - b.diffDays);

    // Calcular estadísticas de categorías
    const catStatsArray = Object.keys(categoriesCount).map((cat, idx) => {
      const stockAmount = categoriesCount[cat];
      const percent = totalStock > 0 ? Math.round((stockAmount / totalStock) * 100) : 0;
      return {
        category: cat,
        count: stockAmount,
        percent,
        // Usar HSL dinámicos para una paleta bonita
        color: `hsl(${(idx * 360) / db.getCategories().length}, 70%, 60%)`
      };
    }).sort((a, b) => b.count - a.count);

    setMetrics({
      totalProducts: products.length,
      totalStockItems: totalStock,
      totalCostValue: costValue,
      totalSellValue: sellValue,
      estimatedProfit: sellValue - costValue,
      lowStockCount: lowStock,
      criticalStockCount: criticalStock,
      expiredCount: expired,
      nearExpirationCount: nearExp
    });

    setAlerts({
      lowStockList: lowStockItems.slice(0, 5),
      expirationList: expirationItems.slice(0, 5)
    });

    setCategoryStats(catStatsArray.slice(0, 5));
  }, [refreshTrigger]);

  return (
    <div className="animation-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Panel de Control</h1>
          <p className="section-subtitle">Vista general de finanzas e inventario en tiempo real</p>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
          Fecha de Simulación: <span style={{ color: 'var(--secondary)' }}>04 de Junio, 2026</span>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="metrics-grid">
        <div className="card metric-card primary">
          <div className="metric-info">
            <span className="metric-label">Productos Registrados</span>
            <span className="metric-value">{metrics.totalProducts}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {metrics.totalStockItems} unidades en total
            </span>
          </div>
          <div className="metric-icon-container">
            <Icons.Inventory />
          </div>
        </div>

        <div className="card metric-card secondary">
          <div className="metric-info">
            <span className="metric-label">Capital Invertido</span>
            <span className="metric-value">{formatCurrency(metrics.totalCostValue)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Costo de stock actual</span>
          </div>
          <div className="metric-icon-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className="card metric-card success">
          <div className="metric-info">
            <span className="metric-label">Valor de Venta</span>
            <span className="metric-value">{formatCurrency(metrics.totalSellValue)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Ganancia estimada: {formatCurrency(metrics.estimatedProfit)}
            </span>
          </div>
          <div className="metric-icon-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
        </div>

        <div className="card metric-card danger">
          <div className="metric-info">
            <span className="metric-label">Alertas Críticas</span>
            <span className="metric-value" style={{ color: metrics.criticalStockCount + metrics.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {metrics.criticalStockCount + metrics.lowStockCount}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {metrics.criticalStockCount} sin stock / {metrics.lowStockCount} bajo stock
            </span>
          </div>
          <div className="metric-icon-container">
            <Icons.AlertTriangle />
          </div>
        </div>
      </div>

      {/* Alertas de Vencimiento / Stock Crítico Banner */}
      {(metrics.expiredCount > 0 || metrics.nearExpirationCount > 0) && (
        <div className={`alert-banner ${metrics.expiredCount > 0 ? 'danger' : 'warning'}`}>
          <Icons.AlertTriangle />
          <div className="alert-banner-content">
            <div className="alert-banner-title" style={{ color: metrics.expiredCount > 0 ? '#fca5a5' : '#fcd34d' }}>
              {metrics.expiredCount > 0 ? '¡Productos Vencidos Detectados!' : 'Advertencia de Vencimiento'}
            </div>
            <div className="alert-banner-desc">
              Tienes <strong style={{ color: '#fff' }}>{metrics.expiredCount}</strong> productos vencidos y <strong style={{ color: '#fff' }}>{metrics.nearExpirationCount}</strong> productos que vencerán en los próximos 15 días. Por favor, revísalos en la sección de inventario para evitar vender mercadería en mal estado.
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveTab('inventory')} style={{ alignSelf: 'center', borderColor: 'rgba(255,255,255,0.1)' }}>
            Ver Inventario
          </button>
        </div>
      )}

      {/* Grid del Dashboard (Alertas e Inventario vs Estadísticas) */}
      <div className="dashboard-grid">
        {/* Lado izquierdo: Alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card de Stock Bajo */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Alertas de Stock Crítico</h2>
              <button onClick={() => setActiveTab('inventory')} className="btn btn-sm btn-ghost">Ver todo</button>
            </div>

            {alerts.lowStockList.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                🎉 Todo el inventario se encuentra en niveles saludables de stock.
              </p>
            ) : (
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.lowStockList.map(prod => (
                      <tr key={prod.id}>
                        <td style={{ fontWeight: 500 }}>{prod.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{prod.category}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{prod.stock}</td>
                        <td>
                          <span className={`badge ${prod.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {prod.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card de Fechas de Vencimiento */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Control de Vencimientos</h2>
              <button onClick={() => setActiveTab('inventory')} className="btn btn-sm btn-ghost">Ver todo</button>
            </div>

            {alerts.expirationList.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                🟢 No hay productos vencidos ni cercanos a vencer en el corto plazo.
              </p>
            ) : (
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.expirationList.map(prod => (
                      <tr key={prod.id}>
                        <td style={{ fontWeight: 500 }}>{prod.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {prod.expirationDate ? new Date(prod.expirationDate).toLocaleDateString('es-AR') : '-'}
                        </td>
                        <td>
                          <span className={`badge ${prod.diffDays < 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {prod.expStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Lado derecho: Estadísticas de Categorías y Accesos rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card Distribución por Categorías */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Distribución por Categorías (Stock)</h2>
            
            {categoryStats.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                No hay stock registrado para graficar.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categoryStats.map(stat => (
                  <div key={stat.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500 }}>{stat.category}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{stat.count} u. ({stat.percent}%)</span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${stat.percent}%`,
                          background: stat.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Acceso Rápido POS */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1))',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)',
              marginBottom: '0.5rem'
            }}>
              <Icons.SalesPOS />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>¿Listo para vender?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px' }}>
              Registra una nueva venta, calcula el vuelto automáticamente y descuenta del stock en segundos.
            </p>
            <button onClick={() => setActiveTab('sales')} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Iniciar Nueva Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
