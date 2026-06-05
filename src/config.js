// Configuración de Personalización del Cliente para el Kiosco

export const CLIENT_CONFIG = {
  // Nombre del negocio que se muestra en el menú lateral
  kioskName: 'VS Gestion',

  // Configuración de Moneda local (Ej: 'ARS' para Pesos Argentinos, 'USD' para Dólares, 'CLP' para Chile)
  currency: 'ARS',
  currencyLocale: 'es-AR',

  // Colores principales de la interfaz (en formato Hexadecimal)
  // Cambia estos códigos para modificar el tema visual de la aplicación
  theme: {
    primary: '#6366f1',     // Índigo Eléctrico (Color base)
    primaryHover: '#4f46e5',
    secondary: '#06b6d4',   // Cian (Destacados y precios)
    secondaryHover: '#0891b2'
  },

  // Categorías iniciales por defecto para este cliente
  defaultCategories: [
    'Golosinas',
    'Bebidas',
    'Cigarrillos',
    'Almacén',
    'Galletitas',
    'Snacks',
    'Lácteos',
    'Otros'
  ]
};
