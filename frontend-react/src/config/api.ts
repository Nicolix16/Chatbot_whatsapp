// Configuración de la API
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3009/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Endpoints
export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  
  // Clientes
  CLIENTES: {
    LIST: '/clientes',
    DETAIL: (id: string) => `/clientes/${id}`,
    CREATE: '/clientes',
    UPDATE: (id: string) => `/clientes/${id}`,
    DELETE: (id: string) => `/clientes/${id}`,
    STATS: '/clientes/stats',
  },
  
  // Pedidos
  PEDIDOS: {
    LIST: '/pedidos',
    DETAIL: (id: string) => `/pedidos/${id}`,
    CREATE: '/pedidos',
    UPDATE: (id: string) => `/pedidos/${id}`,
    DELETE: (id: string) => `/pedidos/${id}`,
    BY_CLIENTE: (numero: string) => `/pedidos/cliente/${numero}`,
    STATS: '/pedidos/stats',
  },
  
  // Conversaciones
  CONVERSACIONES: {
    LIST: '/conversaciones',
    DETAIL: (id: string) => `/conversaciones/${id}`,
    BY_CLIENTE: (numero: string) => `/conversaciones/cliente/${numero}`,
    STATS: '/conversaciones/stats',
  },
  
  // Eventos
  EVENTOS: {
    LIST: '/eventos',
    DETAIL: (id: string) => `/eventos/${id}`,
    MARK_READ: (id: string) => `/eventos/${id}/read`,
    DELETE: (id: string) => `/eventos/${id}`,
  },
  
  // Usuarios
  USUARIOS: {
    LIST: '/usuarios',
    DETAIL: (id: string) => `/usuarios/${id}`,
    CREATE: '/usuarios',
    UPDATE: (id: string) => `/usuarios/${id}`,
    DELETE: (id: string) => `/usuarios/${id}`,
    TOGGLE_STATUS: (id: string) => `/usuarios/${id}/toggle-status`,
  },
  
  // Power BI / Exportación
  EXPORT: {
    CLIENTES: '/powerbi/clientes',
    PEDIDOS: '/powerbi/pedidos',
    CONVERSACIONES: '/powerbi/conversaciones',
    USUARIOS: '/powerbi/usuarios',
    ESTADISTICAS: '/powerbi/estadisticas',
    EVENTOS: '/powerbi/eventos',
  },
};
