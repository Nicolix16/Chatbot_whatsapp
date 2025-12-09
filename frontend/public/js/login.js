// Usar configuración dinámica de API_URL desde config.js
const API_URL = window.ENV?.API_URL || 'http://localhost:3009/api'

// Función para mostrar el formulario de registro
function showRegister() {
  document.getElementById('login-form').classList.add('hidden')
  document.getElementById('register-form').classList.remove('hidden')
  clearMessages()
}

// Función para mostrar el formulario de login
function showLogin() {
  document.getElementById('register-form').classList.add('hidden')
  document.getElementById('login-form').classList.remove('hidden')
  clearMessages()
}

// Limpiar mensajes de error y éxito
function clearMessages() {
  document.getElementById('login-err').textContent = ''
  document.getElementById('register-err').textContent = ''
  document.getElementById('register-success').textContent = ''
}

// Función de login
async function login() {
  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value
  const err = document.getElementById('login-err')
  err.textContent = ''
  
  if (!email || !password) {
    err.textContent = 'Por favor completa todos los campos'
    return
  }
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const json = await res.json()
    
    if (!json.success) {
      err.textContent = json.error || 'Error en el inicio de sesión'
      return
    }
    
    // ⭐ Guardar tokens y datos completos del usuario
    localStorage.setItem('access_token', json.accessToken)
    localStorage.setItem('refresh_token', json.refreshToken)
    
    // Asegurar que todos los datos se guarden correctamente
    const userData = {
      _id: json.user._id,
      email: json.user.email,
      nombre: json.user.nombre,
      rol: json.user.rol,
      tipoOperador: json.user.tipoOperador,  // ⭐ Crítico para operadores
      activo: json.user.activo
    }
    localStorage.setItem('user_data', JSON.stringify(userData))
    
    console.log('✅ Login exitoso - Usuario:', userData)
    
    window.location.href = `/?token=${encodeURIComponent(json.accessToken)}`
  } catch (e) {
    err.textContent = 'Error de red. Verifica tu conexión.'
  }
}

// Función de registro
async function register() {
  const email = document.getElementById('register-email').value.trim()
  const password = document.getElementById('register-password').value
  const passwordConfirm = document.getElementById('register-password-confirm').value
  const err = document.getElementById('register-err')
  const success = document.getElementById('register-success')
  
  err.textContent = ''
  success.textContent = ''
  
  // Validaciones
  if (!email || !password || !passwordConfirm) {
    err.textContent = 'Por favor completa todos los campos'
    return
  }
  
  if (password.length < 6) {
    err.textContent = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  
  if (password !== passwordConfirm) {
    err.textContent = 'Las contraseñas no coinciden'
    return
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    err.textContent = 'Por favor ingresa un correo válido'
    return
  }
  
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const json = await res.json()
    
    if (!json.success) {
      err.textContent = json.error || 'Error al crear la cuenta'
      return
    }
    
    // Mostrar mensaje de éxito
    success.textContent = '✅ Cuenta creada exitosamente. Redirigiendo...'
    
    // Limpiar campos
    document.getElementById('register-email').value = ''
    document.getElementById('register-password').value = ''
    document.getElementById('register-password-confirm').value = ''
    
    // Esperar 2 segundos y cambiar al formulario de login
    setTimeout(() => {
      showLogin()
      document.getElementById('login-email').value = email
      document.getElementById('login-email').focus()
    }, 2000)
    
  } catch (e) {
    err.textContent = 'Error de red. Verifica tu conexión.'
  }
}

// Permitir enviar con Enter en ambos formularios
document.addEventListener('DOMContentLoaded', () => {
  // Login
  const loginPassword = document.getElementById('login-password')
  const loginEmail = document.getElementById('login-email')
  
  if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') login()
    })
  }
  
  if (loginEmail) {
    loginEmail.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') login()
    })
  }
  
  // Registro
  const registerConfirm = document.getElementById('register-password-confirm')
  if (registerConfirm) {
    registerConfirm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') register()
    })
  }
})