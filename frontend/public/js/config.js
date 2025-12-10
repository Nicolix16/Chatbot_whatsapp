// Configuración del frontend
const ENV = {
  // Configura aquí la URL de tu backend desplegado
  // Ejemplo: 'https://tu-backend.railway.app/api'
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3009/api'
    : 'TU_BACKEND_URL_AQUI/api', // ⚠️ CAMBIA ESTO por la URL real de tu backend
  
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
