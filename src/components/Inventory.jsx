import React, { useState, useEffect } from 'react';
import { db, formatCurrency } from '../utils/db';
import { Icons } from '../App';

export default function Inventory({ refreshTrigger, triggerRefresh, showToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, expired

  // Estado del Modal de Producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [editingProduct, setEditingProduct] = useState(null);

  // Campos de formulario
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Estado del Modal de Categorías
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
  }, [refreshTrigger]);

  // Cargar datos en el formulario al editar
  const handleOpenEditModal = (product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setFormBarcode(product.barcode || '');
    setFormName(product.name || '');
    setFormCategory(product.category || '');
    setFormPurchasePrice(product.purchasePrice || '');
    setFormSellingPrice(product.sellingPrice || '');
    setFormStock(product.stock || '');
    setFormMinStock(product.minStock || '');
    setFormSupplier(product.supplier || '');
    setFormExpirationDate(product.expirationDate || '');
    setFormDescription(product.description || '');
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingProduct(null);
    setFormBarcode('');
    setFormName('');
    setFormCategory(categories[0] || '');
    setFormPurchasePrice('');
    setFormSellingPrice('');
    setFormStock('0');
    setFormMinStock('5');
    setFormSupplier('');
    setFormExpirationDate('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Guardar producto (Nuevo o Editado)
  const handleSaveProduct = (e) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('El nombre del producto es obligatorio.', 'danger');
      return;
    }
    if (!formCategory) {
      showToast('Debes seleccionar una categoría.', 'danger');
      return;
    }

    const purchase = parseFloat(formPurchasePrice);
    const sell = parseFloat(formSellingPrice);
    if (isNaN(purchase) || purchase < 0) {
      showToast('Precio de compra inválido.', 'danger');
      return;
    }
    if (isNaN(sell) || sell < 0) {
      showToast('Precio de venta inválido.', 'danger');
      return;
    }

    // El ID será el código de barras si se provee, o un ID autogenerado
    const barcodeVal = formBarcode.trim();
    const productId = modalMode === 'add' 
      ? (barcodeVal || `GEN-${Date.now()}`)
      : editingProduct.id;

    const productData = {
      id: productId,
      barcode: barcodeVal,
      name: formName.trim(),
      category: formCategory,
      purchasePrice: purchase,
      sellingPrice: sell,
      stock: parseInt(formStock) || 0,
      minStock: parseInt(formMinStock) || 0,
      supplier: formSupplier.trim(),
      expirationDate: formExpirationDate,
      description: formDescription.trim()
    };

    try {
      if (modalMode === 'add') {
        db.addProduct(productData);
        showToast('Producto agregado con éxito.', 'success');
      } else {
        db.updateProduct(productData);
        showToast('Producto actualizado con éxito.', 'success');
      }
      setIsModalOpen(false);
      triggerRefresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  // Eliminar producto
  const handleDeleteProduct = (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto del inventario?')) {
      db.deleteProduct(id);
      showToast('Producto eliminado del inventario.', 'warning');
      triggerRefresh();
    }
  };

  // Ajuste rápido de stock (+ / -)
  const handleQuickStockAdjust = (id, amount) => {
    try {
      db.adjustStock(id, amount);
      triggerRefresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  // Crear Categoría
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      db.addCategory(newCatName);
      setNewCatName('');
      showToast('Categoría creada.', 'success');
      triggerRefresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  // Eliminar Categoría
  const handleDeleteCategory = (cat) => {
    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${cat}"? Los productos no se borrarán, pero se mantendrán en esta categoría.`)) {
      db.deleteCategory(cat);
      showToast('Categoría eliminada.', 'warning');
      triggerRefresh();
    }
  };

  // Filtrado de productos
  const today = new Date('2026-06-04'); // Fecha simulada actual
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.barcode && p.barcode.includes(searchTerm)) ||
      (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (stockFilter === 'out') {
      matchesStock = p.stock === 0;
    } else if (stockFilter === 'expired') {
      if (!p.expirationDate) {
        matchesStock = false;
      } else {
        const exp = new Date(p.expirationDate);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        matchesStock = diffDays <= 15; // Expired (<0) or Near Expiration (<=15)
      }
    }

    return matchesSearch && matchesCategory && matchesStock;
  });


  // Calcular el margen de ganancia (markup) porcentual sobre el costo
  const calculateMarkup = (purchase, selling) => {
    if (purchase === 0) return 0;
    const markup = ((selling - purchase) / purchase) * 100;
    return Math.round(markup);
  };

  return (
    <div className="animation-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Inventario de Productos</h1>
          <p className="section-subtitle">Gestiona tu stock, precios y vencimientos de mercadería</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setIsCatModalOpen(true)} className="btn btn-ghost">
            Gestionar Categorías
          </button>
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Icons.Plus />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Fila de Filtros y Búsqueda */}
      <div className="card filter-row">
        <div className="search-input-container">
          <span className="search-icon"><Icons.Search /></span>
          <input 
            type="text" 
            placeholder="Buscar por nombre, código de barra o proveedor..." 
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select 
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '220px' }}>
          <select 
            className="form-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">Todos los Stocks</option>
            <option value="low">Stock Bajo</option>
            <option value="out">Sin Stock (Crítico)</option>
            <option value="expired">Vencidos / Por Vencer</option>
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="card">
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Icons.Inventory />
            <p style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: 500 }}>No se encontraron productos en el inventario.</p>
            <p style={{ fontSize: '0.85rem' }}>Prueba modificando la búsqueda o los filtros aplicados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cód. Barra</th>
                  <th>Nombre del Producto</th>
                  <th>Categoría</th>
                  <th>Precio Compra</th>
                  <th>Precio Venta</th>
                  <th style={{ textAlign: 'center' }}>Margen</th>
                  <th style={{ textAlign: 'center' }}>Stock Actual</th>
                  <th>Vencimiento</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => {
                  const markup = calculateMarkup(prod.purchasePrice, prod.sellingPrice);
                  const isLow = prod.stock > 0 && prod.stock <= prod.minStock;
                  const isOut = prod.stock === 0;

                  // Evaluar vencimiento para el badge de fecha
                  let expBadge = 'badge-success';
                  let expLabel = '';
                  if (prod.expirationDate) {
                    const exp = new Date(prod.expirationDate);
                    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      expBadge = 'badge-danger';
                      expLabel = 'Vencido';
                    } else if (diffDays <= 15) {
                      expBadge = 'badge-warning';
                      expLabel = `Vence en ${diffDays}d`;
                    }
                  }

                  return (
                    <tr key={prod.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {prod.barcode || 'N/A'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{prod.name}</td>
                      <td>
                        <span className="badge badge-info">{prod.category}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{formatCurrency(prod.purchasePrice)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{formatCurrency(prod.sellingPrice)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          color: markup > 40 ? 'var(--success)' : 'var(--text-secondary)' 
                        }}>
                          +{markup}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className="stock-adjust-group">
                            <button 
                              onClick={() => handleQuickStockAdjust(prod.id, -1)}
                              className="btn btn-ghost btn-circle btn-sm"
                              style={{ height: '1.75rem', width: '1.75rem' }}
                              title="Restar 1"
                            >
                              <Icons.Minus />
                            </button>
                            <span className="stock-value" style={{ 
                              color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--text-primary)'
                            }}>
                              {prod.stock}
                            </span>
                            <button 
                              onClick={() => handleQuickStockAdjust(prod.id, 1)}
                              className="btn btn-ghost btn-circle btn-sm"
                              style={{ height: '1.75rem', width: '1.75rem' }}
                              title="Sumar 1"
                            >
                              <Icons.Plus />
                            </button>
                          </div>
                          {(isOut || isLow) && (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: isOut ? 'var(--danger)' : 'var(--warning)',
                              marginTop: '0.15rem' 
                            }}>
                              {isOut ? '¡SIN STOCK!' : `MIN: ${prod.minStock}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {prod.expirationDate ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>{new Date(prod.expirationDate).toLocaleDateString('es-AR')}</span>
                            {expLabel && <span className={`badge ${expBadge}`} style={{ alignSelf: 'flex-start', padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}>{expLabel}</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin fecha</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenEditModal(prod)}
                            className="btn btn-ghost btn-sm"
                            title="Editar Producto"
                          >
                            <Icons.Edit />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="btn btn-danger btn-sm"
                            title="Eliminar Producto"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: AGREGAR / EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {modalMode === 'add' ? 'Agregar Nuevo Producto' : 'Editar Producto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                <Icons.Close />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nombre del Producto *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: Alfajor Jorgito Chocolate"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Código de Barras / ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Escanear o ingresar manual"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      disabled={modalMode === 'edit'} // No cambiar ID de barra al editar
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select 
                      className="form-select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio de Compra (Costo) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio de Venta *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="form-input" 
                      placeholder="0.00"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Inicial</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Mínimo (Alerta)</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      placeholder="5"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Proveedor</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: Distribuidora Arcor"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha de Vencimiento</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formExpirationDate}
                      onChange={(e) => setFormExpirationDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Descripción</label>
                    <textarea 
                      className="form-input" 
                      rows="2"
                      placeholder="Notas sobre el producto..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Registrar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: GESTIONAR CATEGORIAS */}
      {isCatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Gestionar Categorías</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                <Icons.Close />
              </button>
            </div>
            <div className="modal-body">
              {/* Formulario Agregar Categoria */}
              <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nueva categoría..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">Crear</button>
              </form>

              {/* Lista de Categorías */}
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Categorías Existentes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {categories.map(cat => (
                  <div key={cat} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--card-border)'
                  }}>
                    <span>{cat}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      className="btn btn-danger btn-circle btn-sm"
                      style={{ height: '1.5rem', width: '1.5rem', padding: 0 }}
                      title="Eliminar Categoría"
                    >
                      <Icons.Close />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="btn btn-ghost" style={{ width: '100%' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
