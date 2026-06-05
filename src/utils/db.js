// Base de datos local utilizando localStorage para el Kiosco

const STORAGE_KEYS = {
  PRODUCTS: 'kiosco_products',
  SALES: 'kiosco_sales',
  CATEGORIES: 'kiosco_categories'
};

import { CLIENT_CONFIG } from '../config';

const DEFAULT_CATEGORIES = CLIENT_CONFIG.defaultCategories;

const SAMPLE_PRODUCTS = [
  {
    id: '7790895000431',
    barcode: '7790895000431',
    name: 'Alfajor Jorgito Chocolate 55g',
    category: 'Golosinas',
    purchasePrice: 400.00,
    sellingPrice: 700.00,
    stock: 45,
    minStock: 10,
    supplier: 'Distribuidora Arcor',
    expirationDate: '2026-11-20',
    description: 'Alfajor relleno con dulce de leche con baño de repostería'
  },
  {
    id: '7790070411854',
    barcode: '7790070411854',
    name: 'Coca Cola Original 500ml',
    category: 'Bebidas',
    purchasePrice: 700.00,
    sellingPrice: 1200.00,
    stock: 60,
    minStock: 15,
    supplier: 'Femsa S.A.',
    expirationDate: '2026-09-10',
    description: 'Gaseosa sabor original'
  },
  {
    id: '7790040120205',
    barcode: '7790040120205',
    name: 'Chicles Beldent Menta 8.5g',
    category: 'Golosinas',
    purchasePrice: 220.00,
    sellingPrice: 400.00,
    stock: 8, // Bajo stock
    minStock: 12,
    supplier: 'Distribuidora Arcor',
    expirationDate: '2027-01-15',
    description: 'Chicles sin azúcar sabor menta'
  },
  {
    id: '7791120000258',
    barcode: '7791120000258',
    name: 'Cigarrillos Marlboro Box 20',
    category: 'Cigarrillos',
    purchasePrice: 2100.00,
    sellingPrice: 2600.00,
    stock: 30,
    minStock: 8,
    supplier: 'Massalin Particulares',
    expirationDate: '',
    description: 'Cigarrillos Marlboro común Box de 20'
  },
  {
    id: '7791234567890',
    barcode: '7791234567890',
    name: 'Papas Fritas Lays Clásicas 150g',
    category: 'Snacks',
    purchasePrice: 950.00,
    sellingPrice: 1600.00,
    stock: 14,
    minStock: 5,
    supplier: 'PepsiCo Alimentos',
    expirationDate: '2026-08-01',
    description: 'Papas fritas saladas copetín'
  },
  {
    id: '7790060002246',
    barcode: '7790060002246',
    name: 'Turrón de Maní Arcor 25g',
    category: 'Golosinas',
    purchasePrice: 120.00,
    sellingPrice: 250.00,
    stock: 120,
    minStock: 20,
    supplier: 'Distribuidora Arcor',
    expirationDate: '2026-12-05',
    description: 'Oblea rellena con pasta de maní'
  },
  {
    id: '7790070509124',
    barcode: '7790070509124',
    name: 'Agua Mineral Kin Sin Gas 500ml',
    category: 'Bebidas',
    purchasePrice: 450.00,
    sellingPrice: 800.00,
    stock: 2, // Stock crítico
    minStock: 10,
    supplier: 'Femsa S.A.',
    expirationDate: '2026-10-30',
    description: 'Agua de mesa purificada'
  },
  {
    id: '7790060235224',
    barcode: '7790060235224',
    name: 'Galletitas Oreo 117g',
    category: 'Galletitas',
    purchasePrice: 550.00,
    sellingPrice: 950.00,
    stock: 25,
    minStock: 8,
    supplier: 'Distribuidora Golopolis',
    expirationDate: '2026-05-15', // Ya vencido para pruebas
    description: 'Galletitas dulces rellenas sabor vainilla'
  },
  {
    id: '7790580510000',
    barcode: '7790580510000',
    name: 'Chocolatada Cindor 250ml',
    category: 'Lácteos',
    purchasePrice: 650.00,
    sellingPrice: 1100.00,
    stock: 18,
    minStock: 6,
    supplier: 'Danone S.A.',
    expirationDate: '2026-06-06', // Próximo a vencer (2 días desde 2026-06-04)
    description: 'Leche chocolatada UAT'
  },
  {
    id: '7790387010214',
    barcode: '7790387010214',
    name: 'Yerba Mate Taragüi 500g',
    category: 'Almacén',
    purchasePrice: 1400.00,
    sellingPrice: 2200.00,
    stock: 15,
    minStock: 5,
    supplier: 'Las Marías',
    expirationDate: '2028-03-20',
    description: 'Yerba mate con palo'
  }
];

const generateSampleSales = () => {
  const sales = [];
  const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];
  const now = new Date('2026-06-04T17:00:00'); // Fecha actual en la simulación

  // Simular ventas para los últimos 5 días
  for (let i = 4; i >= 0; i--) {
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - i);
    
    // Cantidad de ventas por día (entre 3 y 8)
    const dailySalesCount = Math.floor(Math.random() * 6) + 3;

    for (let j = 0; j < dailySalesCount; j++) {
      // Hora aleatoria para la venta
      const hour = Math.floor(Math.random() * 12) + 9; // 9 AM a 9 PM
      const minute = Math.floor(Math.random() * 60);
      const transactionDate = new Date(saleDate);
      transactionDate.setHours(hour, minute, 0);

      // Elegir entre 1 y 4 productos aleatorios para la venta
      const itemsCount = Math.floor(Math.random() * 4) + 1;
      const saleItems = [];
      let totalPurchase = 0;
      let totalSelling = 0;

      // Lista para no repetir productos en la misma compra
      const selectedProductIndexes = new Set();
      while (selectedProductIndexes.size < Math.min(itemsCount, SAMPLE_PRODUCTS.length)) {
        selectedProductIndexes.add(Math.floor(Math.random() * SAMPLE_PRODUCTS.length));
      }

      selectedProductIndexes.forEach(index => {
        const prod = SAMPLE_PRODUCTS[index];
        const qty = Math.floor(Math.random() * 3) + 1; // 1 a 3 unidades
        const subtotalPurchase = prod.purchasePrice * qty;
        const subtotalSelling = prod.sellingPrice * qty;

        saleItems.push({
          productId: prod.id,
          name: prod.name,
          quantity: qty,
          purchasePrice: prod.purchasePrice,
          sellingPrice: prod.sellingPrice,
          subtotal: subtotalSelling
        });

        totalPurchase += subtotalPurchase;
        totalSelling += subtotalSelling;
      });

      sales.push({
        id: `VTA-${transactionDate.getTime()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: transactionDate.toISOString(),
        items: saleItems,
        totalPurchasePrice: totalPurchase,
        totalSellingPrice: totalSelling,
        profit: totalSelling - totalPurchase,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      });
    }
  }
  return sales;
};

// Funciones Auxiliares de Lectura/Escritura en LocalStorage
const readStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const writeStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export const db = {
  // Inicialización de base de datos
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      writeStorage(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      writeStorage(STORAGE_KEYS.SALES, generateSampleSales());
    }
  },

  // Cargar datos de prueba por defecto
  loadSampleData: () => {
    writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    writeStorage(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
    writeStorage(STORAGE_KEYS.SALES, generateSampleSales());
  },

  // Limpiar base de datos
  resetDb: () => {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    db.init();
  },

  // PRODUCTOS
  getProducts: () => {
    return readStorage(STORAGE_KEYS.PRODUCTS, []);
  },

  saveProducts: (products) => {
    writeStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  addProduct: (product) => {
    const products = db.getProducts();
    // Validar ID duplicado
    if (products.some(p => p.id === product.id)) {
      throw new Error('Ya existe un producto con este código.');
    }
    products.push(product);
    db.saveProducts(products);
    return product;
  },

  updateProduct: (updatedProduct) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index === -1) {
      throw new Error('Producto no encontrado.');
    }
    products[index] = updatedProduct;
    db.saveProducts(products);
    return updatedProduct;
  },

  deleteProduct: (id) => {
    const products = db.getProducts();
    const filtered = products.filter(p => p.id !== id);
    db.saveProducts(filtered);
  },

  adjustStock: (id, amount) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const newStock = Math.max(0, products[index].stock + amount);
      products[index].stock = newStock;
      db.saveProducts(products);
      return products[index];
    }
    throw new Error('Producto no encontrado.');
  },

  // VENTAS
  getSales: () => {
    const sales = readStorage(STORAGE_KEYS.SALES, []);
    // Ordenar de más reciente a más antiguo
    return sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  saveSales: (sales) => {
    writeStorage(STORAGE_KEYS.SALES, sales);
  },

  addSale: (cart, paymentMethod) => {
    if (!cart || cart.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    const products = db.getProducts();
    const saleItems = [];
    let totalPurchase = 0;
    let totalSelling = 0;

    // Descontar stock y preparar items de venta
    cart.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex === -1) {
        throw new Error(`Producto "${item.name}" no encontrado en el inventario.`);
      }

      const product = products[productIndex];
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.name}". Stock disponible: ${product.stock}`);
      }

      // Descontar stock
      product.stock -= item.quantity;

      const subtotalPurchase = product.purchasePrice * item.quantity;
      const subtotalSelling = item.sellingPrice * item.quantity; // Usamos el precio de venta al momento de registrar

      saleItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: item.sellingPrice,
        subtotal: subtotalSelling
      });

      totalPurchase += subtotalPurchase;
      totalSelling += subtotalSelling;
    });

    // Guardar stock actualizado
    db.saveProducts(products);

    // Crear venta
    const newSale = {
      id: `VTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      items: saleItems,
      totalPurchasePrice: totalPurchase,
      totalSellingPrice: totalSelling,
      profit: totalSelling - totalPurchase,
      paymentMethod: paymentMethod || 'Efectivo'
    };

    const sales = db.getSales();
    sales.push(newSale);
    db.saveSales(sales);

    return newSale;
  },

  // CATEGORIAS
  getCategories: () => {
    return readStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  },

  saveCategories: (categories) => {
    writeStorage(STORAGE_KEYS.CATEGORIES, categories);
  },

  addCategory: (category) => {
    const categories = db.getCategories();
    const trimmed = category.trim();
    if (!trimmed) throw new Error('La categoría no puede estar vacía.');
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('La categoría ya existe.');
    }
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

  // EXPORTACIÓN / IMPORTACIÓN JSON
  exportDb: () => {
    const data = {
      products: db.getProducts(),
      sales: db.getSales(),
      categories: db.getCategories(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  },

  importDb: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.products || !data.sales || !data.categories) {
        throw new Error('El archivo no contiene el formato de respaldo válido de Kiosco.');
      }
      
      writeStorage(STORAGE_KEYS.PRODUCTS, data.products);
      writeStorage(STORAGE_KEYS.SALES, data.sales);
      writeStorage(STORAGE_KEYS.CATEGORIES, data.categories);
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      throw new Error(`Fallo al importar respaldo: ${error.message}`);
    }
  }
};

export const formatCurrency = (val) => {
  return new Intl.NumberFormat(CLIENT_CONFIG.currencyLocale, {
    style: 'currency',
    currency: CLIENT_CONFIG.currency
  }).format(val);
};

