/**
 * Utilidad para hacer peticiones a la API con manejo automático de tokens
 */

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      window.location.href = '/pages/login.html'
      return null
    }
    
    try {
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      const json = await res.json()
      
      if (json.success) {
        localStorage.setItem('access_token', json.accessToken)
        localStorage.setItem('refresh_token', json.refreshToken)
        
        if (json.user) {
          const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}')
          const updatedUser = { ...currentUser, ...json.user }
          localStorage.setItem('user_data', JSON.stringify(updatedUser))
        }
        
        return json.accessToken
      } else {
        localStorage.clear()
        window.location.href = '/pages/login.html'
        return null
      }
    } catch (error) {
      console.error('Error renovando token:', error)
      localStorage.clear()
      window.location.href = '/pages/login.html'
      return null
    }
  }

  async request(url, options = {}) {
    const token = localStorage.getItem('access_token')
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      let response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers
      })
      
      // Si el token expiró, intentar renovarlo
      if (response.status === 401) {
        const newToken = await this.refreshAccessToken()
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`
          response = await fetch(`${this.baseURL}${url}`, {
            ...options,
            headers
          })
        }
      }
      
      return response
    } catch (error) {
      console.error('Error en request:', error)
      throw error
    }
  }

  async get(url) {
    return this.request(url, { method: 'GET' })
  }

  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(url) {
    return this.request(url, { method: 'DELETE' })
  }

  async patch(url, data) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

// Crear instancia global
window.api = new ApiClient(window.ENV.API_URL)
