const API_URL = 'http://localhost:3009/api'
async function login(){
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const err = document.getElementById('err')
  err.textContent = ''
  try {
    const res = await fetch(`${API_URL}/auth/login`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,password})
    })
    const json = await res.json()
    if(!json.success) return err.textContent = json.error || 'Error'
    
    // Guardar ambos tokens
    localStorage.setItem('access_token', json.accessToken)
    localStorage.setItem('refresh_token', json.refreshToken)
    
    window.location.href = `/?token=${encodeURIComponent(json.accessToken)}`
  } catch(e){
    err.textContent = 'Error de red'
  }
}