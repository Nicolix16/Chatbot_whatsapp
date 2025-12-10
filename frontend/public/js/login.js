// Usar configuración dinámica de API_URL desde config.js
const API_URL = window.ENV?.API_URL || 'http://localhost:3009/api'

// ========== FUNCIONES DE NAVEGACIÓN ==========
function mostrarRecuperarPassword() {
  document.getElementById('login').classList.remove('active')
  document.getElementById('recover').classList.add('active')
}

function volverLogin() {
  document.getElementById('recover').classList.remove('active')
  document.getElementById('login').classList.add('active')
}

function showRegister() {
  document.getElementById('login-form').classList.add('hidden')
  document.getElementById('register-form').classList.remove('hidden')
  clearMessages()
}

function showLogin() {
  document.getElementById('register-form').classList.add('hidden')
  document.getElementById('login-form').classList.remove('hidden')
  clearMessages()
}

// ========== FUNCIONES DE MENSAJES ==========
function clearMessages() {
  document.getElementById('login-err').textContent = ''
  document.getElementById('register-err').textContent = ''
  document.getElementById('register-success').textContent = ''
}

function showError(elementId, message) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = '⚠️ ' + message
    element.style.display = 'block'
    setTimeout(() => {
      element.style.display = 'none'
    }, 5000)
  }
}

function showSuccess(elementId, message) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = '✓ ' + message
    element.style.display = 'block'
  }
}

// ========== FUNCIÓN DE LOGIN ==========
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
  
  // ========== CONFIGURAR FORMULARIOS EN LOGIN.HTML ==========
  // Login form
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('login-email').value.trim()
      const password = document.getElementById('login-password').value
      const btn = document.getElementById('loginBtn')
      const spinner = document.getElementById('loginSpinner')

      if (!email || !password) {
        showError('loginError', 'Por favor completa todos los campos')
        return
      }

      btn.disabled = true
      spinner.style.display = 'block'

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await response.json()

        if (data.success && data.accessToken) {
          // Guardar tokens en localStorage
          localStorage.setItem('access_token', data.accessToken)
          localStorage.setItem('refresh_token', data.refreshToken)
          
          // Asegurar que todos los datos se guarden correctamente
          const userData = {
            _id: data.user._id,
            email: data.user.email,
            nombre: data.user.nombre,
            rol: data.user.rol,
            tipoOperador: data.user.tipoOperador,
            activo: data.user.activo
          }
          localStorage.setItem('user_data', JSON.stringify(userData))
          
          console.log('✅ Login exitoso - Usuario:', userData)
          
          showSuccess('loginSuccess', 'Ingreso exitoso. Redirigiendo...')
          setTimeout(() => {
            window.location.href = `/pages/?token=${encodeURIComponent(data.accessToken)}`
          }, 1000)
        } else {
          showError('loginError', data.error || 'Credenciales inválidas')
          btn.disabled = false
          spinner.style.display = 'none'
        }
      } catch (error) {
        console.error('Error:', error)
        showError('loginError', 'Error en el servidor. Intenta más tarde.')
        btn.disabled = false
        spinner.style.display = 'none'
      }
    })
  }

  // Recover form
  const recoverForm = document.getElementById('recoverForm')
  if (recoverForm) {
    recoverForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('recover-email').value.trim()
      const btn = document.getElementById('recoverBtn')
      const spinner = document.getElementById('recoverSpinner')

      if (!email) {
        showError('recoverError', 'Por favor ingresa tu correo electrónico')
        return
      }

      btn.disabled = true
      spinner.style.display = 'block'

      try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })

        const data = await response.json()

        if (data.success) {
          showSuccess('recoverSuccess', 'Si el correo existe, recibirás un enlace de recuperación')
          
          // En desarrollo, mostrar el enlace en consola
          if (data.resetUrl) {
            console.log('🔗 Enlace de recuperación:', data.resetUrl)
            showSuccess('recoverSuccess', 
              'Enlace generado. Revisa la consola del navegador (F12) para ver el enlace de recuperación.')
          }
          
          document.getElementById('recover-email').value = ''
          setTimeout(() => {
            volverLogin()
          }, 5000)
        } else {
          showError('recoverError', data.error || 'Error al procesar la solicitud')
        }
        
        btn.disabled = false
        spinner.style.display = 'none'
      } catch (error) {
        console.error('Error:', error)
        showError('recoverError', 'Error en el servidor. Intenta más tarde.')
        btn.disabled = false
        spinner.style.display = 'none'
      }
    })
  }
})