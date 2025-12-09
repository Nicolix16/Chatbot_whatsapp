// Configuración del frontend
const ENV = {
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3009/api'
    : `${window.location.origin}/api`,
  
  WHATSAPP_URL: 'https://wa.me/',
  
  // Configuración de paginación
  ITEMS_PER_PAGE: 20,
  
  // Intervalos de actualización (ms)
  REFRESH_INTERVAL: 30000, // 30 segundos
  
  // Roles y permisos
  ROLES: {
    ADMIN: 'administrador',
    OPERADOR: 'operador',
    SOPORTE: 'soporte'
  },
  
  TIPOS_OPERADOR: {
    COORDINADOR_MASIVOS: 'coordinador_masivos',
    DIRECTOR_COMERCIAL: 'director_comercial',
    EJECUTIVO_HORECAS: 'ejecutivo_horecas',
    MAYORISTA: 'mayorista'
  }
}

// Exportar para uso en otros archivos
window.ENV = ENV
