import React, { useState, useEffect } from 'react';
import { db, formatCurrency } from '../utils/db';
import { Icons } from '../App';

export default function SalesHistory({ refreshTrigger, triggerRefresh, showToast }) {
  const [sales, setSales] = useState([]);
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, Efectivo, Tarjeta, Transferencia
  
  // Modal de Detalle de Venta
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    setSales(db.getSales());
  }, [refreshTrigger]);

  const todayDate = new Date('2026-06-04'); // Fecha simulada actual

  // Filtrar ventas por fecha y método de pago
  const filteredSales = sales.filter(sale => {
    // 1. Filtrar por fecha
    const saleDate = new Date(sale.timestamp);
    let dateMatch = true;

    if (dateFilter === 'today') {
      dateMatch = saleDate.toDateString() === todayDate.toDateString();
    } else if (dateFilter === 'week') {
      const diffTime = todayDate - saleDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      dateMatch = diffDays <= 7;
    } else if (dateFilter === 'month') {
      const diffTime = todayDate - saleDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      dateMatch = diffDays <= 30;
    }

    // 2. Filtrar por método de pago
    const paymentMatch = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

    return dateMatch && paymentMatch;
  });

  // Calcular totales acumulados
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalSellingPrice, 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + s.totalPurchasePrice, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalSalesCount = filteredSales.length;

  // Eliminar una venta (Reintegrar stock)
  const handleDeleteSale = (sale) => {
    const confirmReturnStock = window.confirm(
      `¿Está seguro de anular la venta "${sale.id}"?\n\nPresione ACEPTAR para reintegrar los productos al stock del inventario, o CANCELAR para anular sin devolver los productos.`
    );
    
    // Obtener ventas
    const allSales = db.getSales();
    const updatedSales = allSales.filter(s => s.id !== sale.id);
    db.saveSales(updatedSales);

    if (confirmReturnStock) {
      // Reintegrar stock de los productos
      const products = db.getProducts();
      sale.items.forEach(item => {
        const prodIndex = products.findIndex(p => p.id === item.productId);
        if (prodIndex !== -1) {
          products[prodIndex].stock += item.quantity;
        }
      });
      db.saveProducts(products);
      showToast('Venta anulada. Los productos fueron devueltos al stock.', 'success');
    } else {
      showToast('Venta anulada. El stock del inventario no fue alterado.', 'warning');
    }

    triggerRefresh();
  };

  const handleOpenDetailModal = (sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };


  return (
    <div className="animation-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Historial y Reportes de Ventas</h1>
          <p className="section-subtitle">Visualiza tus facturaciones, márgenes de ganancia y rendimiento</p>
        </div>
      </div>

      {/* Grid de Totales Acumulados */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card metric-card primary" style={{ padding: '1.25rem' }}>
          <div className="metric-info">
            <span className="metric-label" style={{ fontSize: '0.8rem' }}>Cantidad de Ventas</span>
            <span className="metric-value" style={{ fontSize: '1.5rem' }}>{totalSalesCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transacciones realizadas</span>
          </div>
          <div className="metric-icon-container" style={{ width: '2.5rem', height: '2.5rem' }}>
            <Icons.SalesHistory />
          </div>
        </div>

        <div className="card metric-card secondary" style={{ padding: '1.25rem' }}>
          <div className="metric-info">
            <span className="metric-label" style={{ fontSize: '0.8rem' }}>Facturación Total</span>
            <span className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>{formatCurrency(totalRevenue)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total cobrado</span>
          </div>
          <div className="metric-icon-container" style={{ width: '2.5rem', height: '2.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className="card metric-card success" style={{ padding: '1.25rem' }}>
          <div className="metric-info">
            <span className="metric-label" style={{ fontSize: '0.8rem' }}>Ganancia Neta</span>
            <span className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{formatCurrency(totalProfit)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Margen promedio: {totalRevenue > 0 ? Math.round((totalProfit / totalCost) * 100) : 0}%
            </span>
          </div>
          <div className="metric-icon-container" style={{ width: '2.5rem', height: '2.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fila de Filtros */}
      <div className="card filter-row">
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' }}>Período de Tiempo</label>
          <select 
            className="form-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Ventas de Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Últimos 30 días</option>
            <option value="all">Todo el Historial</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' }}>Método de Pago</label>
          <select 
            className="form-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">Todos los Medios</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
      </div>

      {/* Tabla de Historial */}
      <div className="card">
        {filteredSales.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No se registran ventas en el período e filtros seleccionados.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nro Transacción</th>
                  <th>Fecha y Hora</th>
                  <th>Método Pago</th>
                  <th style={{ textAlign: 'center' }}>Cant. Items</th>
                  <th>Costo Total</th>
                  <th>Facturación</th>
                  <th style={{ color: 'var(--success)' }}>Ganancia Neta</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>
                      {sale.id}
                    </td>
                    <td>
                      {new Date(sale.timestamp).toLocaleString('es-AR')}
                    </td>
                    <td>
                      <span className={`badge ${
                        sale.paymentMethod === 'Efectivo' ? 'badge-success' : 
                        sale.paymentMethod === 'Tarjeta' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(sale.totalPurchasePrice)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(sale.totalSellingPrice)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(sale.profit)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenDetailModal(sale)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          Detalle
                        </button>
                        <button 
                          onClick={() => handleDeleteSale(sale)}
                          className="btn btn-danger btn-sm"
                          title="Anular venta"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: DETALLE DE VENTA */}
      {isDetailModalOpen && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Detalle de Transacción</h2>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedSale.id}
                </span>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                <Icons.Close />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Fecha: {new Date(selectedSale.timestamp).toLocaleString('es-AR')}</span>
                <span>Pago: <strong>{selectedSale.paymentMethod}</strong></span>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.25rem' }}>
                Artículos Vendidos
              </h3>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table className="custom-table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ textAlign: 'center' }}>Cantidad</th>
                      <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.sellingPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen financiero de la transacción */}
              <div style={{ 
                background: 'rgba(0,0,0,0.15)', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                border: '1px solid var(--card-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Costo de Venta (Inversión):</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(selectedSale.totalPurchasePrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Facturado (Total Cobrado):</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedSale.totalSellingPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--success)' }}>Ganancia Estimada:</span>
                  <span style={{ color: 'var(--success)' }}>{formatCurrency(selectedSale.profit)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
