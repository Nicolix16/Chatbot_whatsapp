/**
 * Funciones de ayuda generales
 */

// Formatear fecha a formato local
function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formatear fecha solo (sin hora)
function formatDateOnly(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Formatear hora solo
function formatTimeOnly(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formatear número de teléfono
function formatPhone(phone) {
  if (!phone) return '-'
  // Quitar espacios y guiones
  const cleaned = phone.replace(/\D/g, '')
  // Formato colombiano: +57 XXX XXX XXXX
  if (cleaned.startsWith('57') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

// Formatear moneda (pesos colombianos)
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// Mostrar notificación toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// Confirmar acción
function confirmAction(message) {
  return confirm(message)
}

// Debounce function para búsquedas
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Copiar texto al portapapeles
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copiado al portapapeles', 'success')
    return true
  } catch (error) {
    console.error('Error copiando al portapapeles:', error)
    showToast('Error al copiar', 'error')
    return false
  }
}

// Obtener parámetro de URL
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

// Exportar funciones al objeto global
window.helpers = {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  formatPhone,
  formatCurrency,
  escapeHtml,
  showToast,
  confirmAction,
  debounce,
  copyToClipboard,
  getUrlParameter
}
