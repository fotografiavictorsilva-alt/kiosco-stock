import { supabase } from '../supabase';
import { CLIENT_CONFIG } from '../config';

const STORAGE_KEYS = {
  PRODUCTS: 'kiosco_products',
  SALES: 'kiosco_sales',
  CATEGORIES: 'kiosco_categories',
  BUSINESS_NAME: 'kiosco_business_name'
};

const DEFAULT_CATEGORIES = CLIENT_CONFIG.defaultCategories;

const SAMPLE_PRODUCTS = [
  { id: '7790895000431', barcode: '7790895000431', name: 'Alfajor Jorgito Chocolate 55g', category: 'Golosinas', purchasePrice: 400, sellingPrice: 700, stock: 45, minStock: 10, supplier: 'Distribuidora Arcor', expirationDate: '2026-11-20', description: 'Alfajor relleno con dulce de leche' },
  { id: '7790070411854', barcode: '7790070411854', name: 'Coca Cola Original 500ml', category: 'Bebidas', purchasePrice: 700, sellingPrice: 1200, stock: 60, minStock: 15, supplier: 'Femsa S.A.', expirationDate: '2026-09-10', description: 'Gaseosa sabor original' },
  { id: '7790040120205', barcode: '7790040120205', name: 'Chicles Beldent Menta 8.5g', category: 'Golosinas', purchasePrice: 220, sellingPrice: 400, stock: 8, minStock: 12, supplier: 'Distribuidora Arcor', expirationDate: '2027-01-15', description: 'Chicles sin azucar sabor menta' },
  { id: '7791120000258', barcode: '7791120000258', name: 'Cigarrillos Marlboro Box 20', category: 'Cigarrillos', purchasePrice: 2100, sellingPrice: 2600, stock: 30, minStock: 8, supplier: 'Massalin Particulares', expirationDate: '', description: 'Cigarrillos Marlboro comun Box de 20' },
  { id: '7791234567890', barcode: '7791234567890', name: 'Papas Fritas Lays Clasicas 150g', category: 'Snacks', purchasePrice: 950, sellingPrice: 1600, stock: 14, minStock: 5, supplier: 'PepsiCo Alimentos', expirationDate: '2026-08-01', description: 'Papas fritas saladas' },
  { id: '7790060002246', barcode: '7790060002246', name: 'Turron de Mani Arcor 25g', category: 'Golosinas', purchasePrice: 120, sellingPrice: 250, stock: 120, minStock: 20, supplier: 'Distribuidora Arcor', expirationDate: '2026-12-05', description: 'Oblea rellena con pasta de mani' },
  { id: '7790070509124', barcode: '7790070509124', name: 'Agua Mineral Kin Sin Gas 500ml', category: 'Bebidas', purchasePrice: 450, sellingPrice: 800, stock: 2, minStock: 10, supplier: 'Femsa S.A.', expirationDate: '2026-10-30', description: 'Agua de mesa purificada' },
  { id: '7790060235224', barcode: '7790060235224', name: 'Galletitas Oreo 117g', category: 'Galletitas', purchasePrice: 550, sellingPrice: 950, stock: 25, minStock: 8, supplier: 'Distribuidora Golopolis', expirationDate: '2026-05-15', description: 'Galletitas dulces rellenas sabor vainilla' },
  { id: '7790580510000', barcode: '7790580510000', name: 'Chocolatada Cindor 250ml', category: 'Lacteos', purchasePrice: 650, sellingPrice: 1100, stock: 18, minStock: 6, supplier: 'Danone S.A.', expirationDate: '2026-06-06', description: 'Leche chocolatada UAT' },
  { id: '7790387010214', barcode: '7790387010214', name: 'Yerba Mate Taragui 500g', category: 'Almacen', purchasePrice: 1400, sellingPrice: 2200, stock: 15, minStock: 5, supplier: 'Las Marias', expirationDate: '2028-03-20', description: 'Yerba mate con palo' }
];

const generateSampleSales = () => {
  const sales = [];
  const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - i);
    const dailySalesCount = Math.floor(Math.random() * 6) + 3;
    for (let j = 0; j < dailySalesCount; j++) {
      const hour = Math.floor(Math.random() * 12) + 9;
      const minute = Math.floor(Math.random() * 60);
      const transactionDate = new Date(saleDate);
      transactionDate.setHours(hour, minute, 0);
      const itemsCount = Math.floor(Math.random() * 4) + 1;
      const saleItems = [];
      let totalPurchase = 0;
      let totalSelling = 0;
      const selectedIndexes = new Set();
      while (selectedIndexes.size < Math.min(itemsCount, SAMPLE_PRODUCTS.length)) {
        selectedIndexes.add(Math.floor(Math.random() * SAMPLE_PRODUCTS.length));
      }
      selectedIndexes.forEach(index => {
        const prod = SAMPLE_PRODUCTS[index];
        const qty = Math.floor(Math.random() * 3) + 1;
        saleItems.push({ productId: prod.id, name: prod.name, quantity: qty, purchasePrice: prod.purchasePrice, sellingPrice: prod.sellingPrice, subtotal: prod.sellingPrice * qty });
        totalPurchase += prod.purchasePrice * qty;
        totalSelling += prod.sellingPrice * qty;
      });
      sales.push({ id: `VTA-${transactionDate.getTime()}-${Math.floor(Math.random() * 1000)}`, timestamp: transactionDate.toISOString(), items: saleItems, totalPurchasePrice: totalPurchase, totalSellingPrice: totalSelling, profit: totalSelling - totalPurchase, paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)] });
    }
  }
  return sales;
};

const readStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

const writeStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(error);
  }
};

const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

const productToRow = (product, userId) => ({
  id: product.id,
  user_id: userId,
  barcode: product.barcode || '',
  name: product.name,
  category: product.category || '',
  purchase_price: Number(product.purchasePrice) || 0,
  selling_price: Number(product.sellingPrice) || 0,
  stock: Number(product.stock) || 0,
  min_stock: Number(product.minStock) || 0,
  supplier: product.supplier || '',
  expiration_date: product.expirationDate || '',
  description: product.description || '',
});

const rowToProduct = (row) => ({
  id: row.id,
  barcode: row.barcode || '',
  name: row.name,
  category: row.category || '',
  purchasePrice: Number(row.purchase_price) || 0,
  sellingPrice: Number(row.selling_price) || 0,
  stock: Number(row.stock) || 0,
  minStock: Number(row.min_stock) || 0,
  supplier: row.supplier || '',
  expirationDate: row.expiration_date || '',
  description: row.description || '',
});

const saleToRow = (sale, userId) => ({
  id: sale.id,
  user_id: userId,
  timestamp: sale.timestamp,
  items: sale.items,
  total_purchase_price: Number(sale.totalPurchasePrice) || 0,
  total_selling_price: Number(sale.totalSellingPrice) || 0,
  profit: Number(sale.profit) || 0,
  payment_method: sale.paymentMethod || 'Efectivo',
});

const rowToSale = (row) => ({
  id: row.id,
  timestamp: row.timestamp,
  items: row.items,
  totalPurchasePrice: Number(row.total_purchase_price) || 0,
  totalSellingPrice: Number(row.total_selling_price) || 0,
  profit: Number(row.profit) || 0,
  paymentMethod: row.payment_method,
});

export const db = {
  init: async () => {
    const user = await getUser();
    if (user) {
      const [{ data: products }, { data: sales }, { data: cats }, { data: settings }] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('sales').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
        supabase.from('categories').select('name').eq('user_id', user.id),
        supabase.from('settings').select('business_name').eq('user_id', user.id).single()
      ]);
      if (products && products.length > 0) {
        writeStorage(STORAGE_KEYS.PRODUCTS, products.map(rowToProduct));
      } else {
        writeStorage(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
        supabase.from('products').insert(SAMPLE_PRODUCTS.map(p => productToRow(p, user.id))).then();
      }
      if (sales && sales.length > 0) {
        writeStorage(STORAGE_KEYS.SALES, sales.map(rowToSale));
      } else {
        const sampleSales = generateSampleSales();
        writeStorage(STORAGE_KEYS.SALES, sampleSales);
        supabase.from('sales').insert(sampleSales.map(s => saleToRow(s, user.id))).then();
      }
      if (cats && cats.length > 0) {
        writeStorage(STORAGE_KEYS.CATEGORIES, cats.map(c => c.name));
      } else {
        writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
        supabase.from('categories').insert(DEFAULT_CATEGORIES.map(name => ({ user_id: user.id, name }))).then();
      }
      if (settings && settings.business_name) {
        writeStorage(STORAGE_KEYS.BUSINESS_NAME, settings.business_name);
      }
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) writeStorage(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
      if (!localStorage.getItem(STORAGE_KEYS.SALES)) writeStorage(STORAGE_KEYS.SALES, generateSampleSales());
    }
  },

  loadSampleData: () => {
    const sampleSales = generateSampleSales();
    writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    writeStorage(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
    writeStorage(STORAGE_KEYS.SALES, sampleSales);
    getUser().then(user => {
      if (!user) return;
      supabase.from('products').delete().eq('user_id', user.id).then(() => {
        supabase.from('products').insert(SAMPLE_PRODUCTS.map(p => productToRow(p, user.id))).then();
      });
      supabase.from('sales').delete().eq('user_id', user.id).then(() => {
        supabase.from('sales').insert(sampleSales.map(s => saleToRow(s, user.id))).then();
      });
      supabase.from('categories').delete().eq('user_id', user.id).then(() => {
        supabase.from('categories').insert(DEFAULT_CATEGORIES.map(name => ({ user_id: user.id, name }))).then();
      });
    });
  },

  resetDb: () => {
    writeStorage(STORAGE_KEYS.PRODUCTS, []);
    writeStorage(STORAGE_KEYS.SALES, []);
    writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    getUser().then(user => {
      if (!user) return;
      supabase.from('products').delete().eq('user_id', user.id).then();
      supabase.from('sales').delete().eq('user_id', user.id).then();
      supabase.from('categories').delete().eq('user_id', user.id).then(() => {
        supabase.from('categories').insert(DEFAULT_CATEGORIES.map(name => ({ user_id: user.id, name }))).then();
      });
    });
  },

  // SETTINGS
  getBusinessName: () => {
    return readStorage(STORAGE_KEYS.BUSINESS_NAME, '') || CLIENT_CONFIG.kioskName || 'Mi Negocio';
  },

  saveBusinessName: async (name) => {
    writeStorage(STORAGE_KEYS.BUSINESS_NAME, name);
    const user = await getUser();
    if (!user) return;
    await supabase.from('settings').upsert({ user_id: user.id, business_name: name }, { onConflict: 'user_id' });
  },

  // PRODUCTS
  getProducts: () => readStorage(STORAGE_KEYS.PRODUCTS, []),

  saveProducts: (products) => {
    writeStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  addProduct: (product) => {
    const products = db.getProducts();
    if (products.some(p => p.id === product.id)) throw new Error('Ya existe un producto con este codigo.');
    products.push(product);
    writeStorage(STORAGE_KEYS.PRODUCTS, products);
    getUser().then(user => {
      if (user) supabase.from('products').insert(productToRow(product, user.id)).then();
    });
    return product;
  },

  updateProduct: (updatedProduct) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index === -1) throw new Error('Producto no encontrado.');
    products[index] = updatedProduct;
    writeStorage(STORAGE_KEYS.PRODUCTS, products);
    getUser().then(user => {
      if (user) supabase.from('products').update(productToRow(updatedProduct, user.id)).eq('id', updatedProduct.id).eq('user_id', user.id).then();
    });
    return updatedProduct;
  },

  deleteProduct: (id) => {
    const products = db.getProducts();
    writeStorage(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
    getUser().then(user => {
      if (user) supabase.from('products').delete().eq('id', id).eq('user_id', user.id).then();
    });
  },

  adjustStock: (id, amount) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const newStock = Math.max(0, products[index].stock + amount);
      products[index].stock = newStock;
      writeStorage(STORAGE_KEYS.PRODUCTS, products);
      getUser().then(user => {
        if (user) supabase.from('products').update({ stock: newStock }).eq('id', id).eq('user_id', user.id).then();
      });
      return products[index];
    }
    throw new Error('Producto no encontrado.');
  },

  // SALES
  getSales: () => {
    const sales = readStorage(STORAGE_KEYS.SALES, []);
    return sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  saveSales: (sales) => {
    writeStorage(STORAGE_KEYS.SALES, sales);
  },

  addSale: (cart, paymentMethod) => {
    if (!cart || cart.length === 0) throw new Error('El carrito esta vacio.');
    const products = db.getProducts();
    const saleItems = [];
    let totalPurchase = 0;
    let totalSelling = 0;
    cart.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex === -1) throw new Error(`Producto "${item.name}" no encontrado en el inventario.`);
      const product = products[productIndex];
      if (product.stock < item.quantity) throw new Error(`Stock insuficiente para "${product.name}". Stock disponible: ${product.stock}`);
      product.stock -= item.quantity;
      const subtotalPurchase = product.purchasePrice * item.quantity;
      const subtotalSelling = item.sellingPrice * item.quantity;
      saleItems.push({ productId: product.id, name: product.name, quantity: item.quantity, purchasePrice: product.purchasePrice, sellingPrice: item.sellingPrice, subtotal: subtotalSelling });
      totalPurchase += subtotalPurchase;
      totalSelling += subtotalSelling;
    });
    writeStorage(STORAGE_KEYS.PRODUCTS, products);
    getUser().then(user => {
      if (!user) return;
      cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) supabase.from('products').update({ stock: product.stock }).eq('id', product.id).eq('user_id', user.id).then();
      });
    });
    const newSale = { id: `VTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp: new Date().toISOString(), items: saleItems, totalPurchasePrice: totalPurchase, totalSellingPrice: totalSelling, profit: totalSelling - totalPurchase, paymentMethod: paymentMethod || 'Efectivo' };
    const sales = db.getSales();
    sales.push(newSale);
    writeStorage(STORAGE_KEYS.SALES, sales);
    getUser().then(user => {
      if (user) supabase.from('sales').insert(saleToRow(newSale, user.id)).then();
    });
    return newSale;
  },

  deleteSale: (saleId) => {
    const sales = db.getSales();
    writeStorage(STORAGE_KEYS.SALES, sales.filter(s => s.id !== saleId));
    getUser().then(user => {
      if (user) supabase.from('sales').delete().eq('id', saleId).eq('user_id', user.id).then();
    });
  },

  // CATEGORIES
  getCategories: () => readStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),

  saveCategories: (categories) => {
    writeStorage(STORAGE_KEYS.CATEGORIES, categories);
    getUser().then(user => {
      if (!user) return;
      supabase.from('categories').delete().eq('user_id', user.id).then(() => {
        if (categories.length > 0) supabase.from('categories').insert(categories.map(name => ({ user_id: user.id, name }))).then();
      });
    });
  },

  addCategory: (category) => {
    const categories = db.getCategories();
    const trimmed = category.trim();
    if (!trimmed) throw new Error('La categoria no puede estar vacia.');
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) throw new Error('La categoria ya existe.');
    categories.push(trimmed);
    db.saveCategories(categories);
    return categories;
  },

  deleteCategory: (category) => {
    const categories = db.getCategories();
    const filtered = categories.filter(c => c !== category);
    db.saveCategories(filtered);
    return filtered;
  },

  exportDb: () => {
    const data = { products: db.getProducts(), sales: db.getSales(), categories: db.getCategories(), exportDate: new Date().toISOString(), version: '2.0.0' };
    return JSON.stringify(data, null, 2);
  },

  importDb: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.products || !data.sales || !data.categories) throw new Error('El archivo no contiene el formato de respaldo valido.');
      writeStorage(STORAGE_KEYS.PRODUCTS, data.products);
      writeStorage(STORAGE_KEYS.SALES, data.sales);
      writeStorage(STORAGE_KEYS.CATEGORIES, data.categories);
      getUser().then(user => {
        if (!user) return;
        supabase.from('products').delete().eq('user_id', user.id).then(() => {
          if (data.products.length > 0) supabase.from('products').insert(data.products.map(p => productToRow(p, user.id))).then();
        });
        supabase.from('sales').delete().eq('user_id', user.id).then(() => {
          if (data.sales.length > 0) supabase.from('sales').insert(data.sales.map(s => saleToRow(s, user.id))).then();
        });
        supabase.from('categories').delete().eq('user_id', user.id).then(() => {
          if (data.categories.length > 0) supabase.from('categories').insert(data.categories.map(name => ({ user_id: user.id, name }))).then();
        });
      });
      return true;
    } catch (error) {
      throw new Error(`Fallo al importar respaldo: ${error.message}`);
    }
  },
};

export const formatCurrency = (val) => {
  return new Intl.NumberFormat(CLIENT_CONFIG.currencyLocale, {
    style: 'currency',
    currency: CLIENT_CONFIG.currency,
  }).format(val);
};
