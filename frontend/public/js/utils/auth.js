/**
 * Utilidades de autenticación
 */

// Verificar si el usuario está autenticado
function isAuthenticated() {
  return !!localStorage.getItem('access_token')
}

// Obtener datos del usuario actual
function getCurrentUser() {
  const userData = localStorage.getItem('user_data')
  return userData ? JSON.parse(userData) : null
}

// Verificar si el usuario tiene un rol específico
function hasRole(role) {
  const user = getCurrentUser()
  return user && user.rol === role
}

// Verificar si el usuario es administrador
function isAdmin() {
  return hasRole(window.ENV.ROLES.ADMIN)
}

// Verificar si el usuario es operador
function isOperador() {
  return hasRole(window.ENV.ROLES.OPERADOR)
}

// Verificar si el usuario es soporte
function isSoporte() {
  return hasRole(window.ENV.ROLES.SOPORTE)
}

// Verificar si el usuario tiene permiso de escritura (admin o soporte)
function hasWritePermission() {
  return isAdmin() || isSoporte()
}

// Cerrar sesión
async function logout() {
  try {
    // Intentar invalidar token en el servidor
    await window.api.post('/auth/logout', {})
  } catch (error) {
    console.error('Error en logout:', error)
  } finally {
    // Limpiar localStorage
    localStorage.clear()
    // Redirigir al login
    window.location.href = '/pages/login.html'
  }
}

// Proteger página (redirigir al login si no está autenticado)
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html'
    return false
  }
  return true
}

// Exportar funciones al objeto global
window.auth = {
  isAuthenticated,
  getCurrentUser,
  hasRole,
  isAdmin,
  isOperador,
  isSoporte,
  hasWritePermission,
  logout,
  requireAuth
}
