import React, { useState, useEffect, useRef } from 'react';
import { db, formatCurrency } from '../utils/db';
import { Icons } from '../App';
import { CLIENT_CONFIG } from '../config';

// Función para imprimir el ticket usando estilos de impresión
const printTicket = (sale, receivedAmt, changeAmt, paymentMethod) => {
  const ticketHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ticket de Venta</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          width: 280px;
          margin: 0 auto;
          padding: 8px;
          color: #000;
        }
        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 16px; font-weight: bold; }
        .header p { font-size: 10px; color: #555; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
        .items-table th { text-align: left; font-size: 10px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
        .items-table td { padding: 3px 0; font-size: 11px; vertical-align: top; }
        .items-table td:last-child { text-align: right; white-space: nowrap; }
        .items-table td.qty { text-align: center; width: 30px; }
        .totals { margin-top: 4px; }
        .totals .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
        .totals .row.total { font-size: 15px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 2px; }
        .totals .row.change { font-size: 13px; font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; color: #555; }
        @media print {
          body { width: 100%; }
          @page { margin: 5mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${CLIENT_CONFIG.kioskName || 'Kiosco'}</h1>
        <p>Comprobante de Venta</p>
        <p>${new Date(sale.timestamp).toLocaleString('es-AR')}</p>
      </div>
      <div class="divider"></div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th class="qty">Cant</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(item => `
            <tr>
              <td>
                ${item.name}<br/>
                <span style="font-size:10px;color:#555">${new Intl.NumberFormat('es-AR', { style: 'currency', currency: '${CLIENT_CONFIG.currency}' }).format(item.sellingPrice)} c/u</span>
              </td>
              <td class="qty">${item.quantity}</td>
              <td>${new Intl.NumberFormat('es-AR', { style: 'currency', currency: '${CLIENT_CONFIG.currency}' }).format(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals">
        <div class="row total">
          <span>TOTAL</span>
          <span>${new Intl.NumberFormat('es-AR', { style: 'currency', currency: '${CLIENT_CONFIG.currency}' }).format(sale.totalSellingPrice)}</span>
        </div>
        <div class="row">
          <span>Pago: ${paymentMethod}</span>
        </div>
        ${paymentMethod === 'Efectivo' && receivedAmt ? `
          <div class="row">
            <span>Recibido</span>
            <span>${new Intl.NumberFormat('es-AR', { style: 'currency', currency: '${CLIENT_CONFIG.currency}' }).format(parseFloat(receivedAmt))}</span>
          </div>
          <div class="row change">
            <span>VUELTO</span>
            <span>${new Intl.NumberFormat('es-AR', { style: 'currency', currency: '${CLIENT_CONFIG.currency}' }).format(parseFloat(changeAmt))}</span>
          </div>
        ` : ''}
      </div>

      <div class="divider"></div>
      <div class="footer">
        <p>¡Gracias por su compra!</p>
        <p>Nro: ${sale.id.replace('VTA-', '').substring(0, 8)}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  printWindow.document.write(ticketHtml);
  printWindow.document.close();
  printWindow.focus();
  // Pequeño delay para que cargue el HTML antes de imprimir
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};

export default function SalesPOS({ refreshTrigger, triggerRefresh, showToast }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  // Calculadora de vuelto
  const [receivedAmount, setReceivedAmount] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  // Modal de ticket post-venta
  const [lastSale, setLastSale] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [lastReceivedAmount, setLastReceivedAmount] = useState('');
  const [lastChangeAmount, setLastChangeAmount] = useState(0);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('Efectivo');

  const searchInputRef = useRef(null);

  useEffect(() => {
    setProducts(db.getProducts());
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [refreshTrigger]);

  // Manejar cambios en Dinero Recibido para calcular Vuelto
  const totalCartPrice = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);

  useEffect(() => {
    const received = parseFloat(receivedAmount);
    if (!isNaN(received) && received >= totalCartPrice) {
      setChangeAmount(received - totalCartPrice);
    } else {
      setChangeAmount(0);
    }
  }, [receivedAmount, totalCartPrice]);

  // Buscar por código de barras (agregado automático al escanear)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const matchedProduct = products.find(p => p.barcode && p.barcode === query);
    if (matchedProduct) {
      handleAddToCart(matchedProduct);
      setSearchQuery('');
      showToast(`✓ Agregado: ${matchedProduct.name}`, 'success');
    }
  };

  // Agregar producto al carrito (al hacer clic o escanear)
  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`"${product.name}" no tiene stock disponible.`, 'danger');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          showToast(`Máximo de stock alcanzado (${product.stock} u.)`, 'warning');
          return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          productId: product.id,
          name: product.name,
          sellingPrice: product.sellingPrice,
          quantity: 1,
          maxStock: product.stock
        }];
      }
    });
  };

  // Ajustar cantidad en carrito
  const handleAdjustCartQty = (productId, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + amount;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            showToast(`Máximo de stock alcanzado (${item.maxStock} u.)`, 'warning');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Quitar del carrito
  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  // Confirmar Venta
  const handleConfirmSale = () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío.', 'danger');
      return;
    }

    try {
      const newSale = db.addSale(cart, paymentMethod);
      
      // Guardar los datos del ticket ANTES de limpiar el carrito
      setLastSale(newSale);
      setLastReceivedAmount(receivedAmount);
      setLastChangeAmount(changeAmount);
      setLastPaymentMethod(paymentMethod);
      setShowTicketModal(true);
      
      // Limpiar carrito
      setCart([]);
      setReceivedAmount('');
      setChangeAmount(0);
      setSearchQuery('');
      triggerRefresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  // Cerrar modal de ticket y continuar
  const handleCloseTicketModal = () => {
    setShowTicketModal(false);
    setLastSale(null);
    showToast('¡Venta registrada con éxito!', 'success');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Imprimir ticket
  const handlePrintTicket = () => {
    if (lastSale) {
      printTicket(lastSale, lastReceivedAmount, lastChangeAmount, lastPaymentMethod);
    }
  };

  // Filtrar catálogo
  const filteredProducts = products.filter(p => {
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (p.barcode && p.barcode.includes(searchQuery));
  });

  return (
    <div className="animation-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Punto de Venta (POS)</h1>
          <p className="section-subtitle">Hacé clic en los productos de la izquierda para agregarlos al carrito</p>
        </div>
      </div>

      <div className="pos-layout">
        {/* LADO IZQUIERDO: CATÁLOGO */}
        <div className="pos-catalog">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="search-input-container">
              <span className="search-icon"><Icons.Search /></span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escanea el código de barra o escribe el nombre del producto..."
                className="form-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            {/* Instrucción visual */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.9rem',
              fontSize: '0.82rem',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>👆</span>
              <span><strong>Hacé clic en cualquier producto</strong> para sumarlo al carrito. Podés agregar tantos como quieras.</span>
            </div>

            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Productos Disponibles ({filteredProducts.filter(p => p.stock > 0).length} con stock)
            </h2>

            {filteredProducts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No se encontraron productos que coincidan con la búsqueda.
              </p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredProducts.map(prod => {
                  const isOut = prod.stock === 0;
                  const inCart = cart.find(item => item.productId === prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOut && handleAddToCart(prod)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: inCart
                          ? 'rgba(6, 182, 212, 0.07)'
                          : isOut ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: inCart
                          ? 'rgba(6, 182, 212, 0.35)'
                          : isOut ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-border)',
                        borderRadius: '0.5rem',
                        cursor: isOut ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: isOut ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isOut ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {prod.name}
                          {inCart && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'rgba(6,182,212,0.2)', color: 'var(--secondary)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                              en carrito: {inCart.quantity}
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {prod.category}{prod.barcode ? ` • ${prod.barcode}` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 700, color: isOut ? 'var(--text-secondary)' : 'var(--secondary)' }}>
                          {formatCurrency(prod.sellingPrice)}
                        </span>
                        <span className={`badge ${isOut ? 'badge-danger' : prod.stock <= prod.minStock ? 'badge-warning' : 'badge-success'}`}>
                          {isOut ? 'Sin Stock' : `${prod.stock} disp.`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: CARRITO */}
        <div>
          <div className="card pos-cart-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Carrito</span>
              {cart.length > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--secondary)' }}>
                  {cart.reduce((a, i) => a + i.quantity, 0)} artículo(s)
                </span>
              )}
            </h2>

            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem', padding: '1rem' }}>
                <Icons.SalesPOS />
                <p style={{ fontWeight: 600 }}>El carrito está vacío</p>
                <p style={{ fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.5 }}>
                  Hacé <strong>clic en cualquier producto</strong> de la lista de la izquierda para agregarlo aquí.
                  <br />Podés agregar <strong>todos los que quieras</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Items del carrito */}
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.productId} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">{formatCurrency(item.sellingPrice)} c/u</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="cart-item-qty-control">
                          <button
                            onClick={() => handleAdjustCartQty(item.productId, -1)}
                            className="btn btn-ghost btn-circle btn-sm"
                            style={{ height: '1.5rem', width: '1.5rem' }}
                          >
                            <Icons.Minus />
                          </button>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', width: '1.25rem', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleAdjustCartQty(item.productId, 1)}
                            className="btn btn-ghost btn-circle btn-sm"
                            style={{ height: '1.5rem', width: '1.5rem' }}
                          >
                            <Icons.Plus />
                          </button>
                        </div>

                        <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: '4.5rem', textAlign: 'right' }}>
                          {formatCurrency(item.sellingPrice * item.quantity)}
                        </span>

                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="btn btn-danger btn-circle btn-sm"
                          style={{ height: '1.5rem', width: '1.5rem', opacity: 0.7 }}
                          title="Quitar del carrito"
                        >
                          <Icons.Close />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen */}
                <div className="cart-summary">
                  {/* Forma de Pago */}
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Forma de Pago</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`btn btn-sm ${paymentMethod === method ? 'btn-secondary' : 'btn-ghost'}`}
                          style={{ flex: 1 }}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculadora de vuelto (solo efectivo) */}
                  {paymentMethod === 'Efectivo' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Dinero Recibido</label>
                        <input
                          type="number"
                          placeholder="Paga con..."
                          className="form-input"
                          style={{ padding: '0.4rem 0.75rem' }}
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vuelto a entregar</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: changeAmount > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                          {formatCurrency(changeAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="summary-row total">
                    <span>TOTAL</span>
                    <span>{formatCurrency(totalCartPrice)}</span>
                  </div>

                  {/* Botón Confirmar */}
                  <button
                    onClick={handleConfirmSale}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                  >
                    ✓ Confirmar Venta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: TICKET POST-VENTA */}
      {showTicketModal && lastSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                  ✓ Venta Confirmada
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(lastSale.timestamp).toLocaleString('es-AR')}
                </span>
              </div>
              <button onClick={handleCloseTicketModal} className="btn btn-ghost btn-circle btn-sm">
                <Icons.Close />
              </button>
            </div>

            <div className="modal-body">
              {/* Resumen del ticket */}
              <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{CLIENT_CONFIG.kioskName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Comprobante de Venta</div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                  {lastSale.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ flex: 1, paddingRight: '0.5rem' }}>
                        {item.name}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}> x{item.quantity}</span>
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
                    <span>TOTAL</span>
                    <span style={{ color: 'var(--secondary)' }}>{formatCurrency(lastSale.totalSellingPrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <span>Pago: {lastPaymentMethod}</span>
                  </div>
                  {lastPaymentMethod === 'Efectivo' && lastReceivedAmount && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span>Recibido</span>
                        <span>{formatCurrency(parseFloat(lastReceivedAmount))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
                        <span>VUELTO</span>
                        <span>{formatCurrency(lastChangeAmount)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
                  ¡Gracias por su compra!
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ gap: '0.75rem' }}>
              <button
                onClick={handlePrintTicket}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                🖨️ Imprimir Ticket
              </button>
              <button
                onClick={handleCloseTicketModal}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
