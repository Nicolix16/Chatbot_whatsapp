const API_URL = 'http://localhost:3009/api'

// Verificar autenticación al cargar la página
function checkAuthentication() {
  const token = localStorage.getItem('access_token')
  const userData = localStorage.getItem('user_data')
  
  if (!token || !userData) {
    // No hay token, redirigir al login
    window.location.href = '/login.html'
    return false
  }
  
  return true
}

// Obtener datos del usuario desde localStorage
function getUserData() {
  const data = localStorage.getItem('user_data')
  return data ? JSON.parse(data) : null
}

// Verificar permisos por rol
function hasRole(...roles) {
  const user = getUserData()
  return user && roles.includes(user.rol)
}

// Inicializar UI según rol del usuario
function initializeRoleBasedUI() {
  // Primero verificar autenticación
  if (!checkAuthentication()) {
    return
  }
  
  const user = getUserData()
  if (!user) {
    window.location.href = '/login.html'
    return
  }
  
  // Mostrar nombre y rol del usuario en sidebar
  const firstLetter = (user.nombre || user.email).charAt(0).toUpperCase()
  document.getElementById('user-avatar').textContent = firstLetter
  document.getElementById('user-card-name').textContent = user.nombre || 'Usuario'
  document.getElementById('user-card-email').textContent = user.email
  
  const rolBadge = document.getElementById('role-badge')
  rolBadge.textContent = user.rol.toUpperCase()
  rolBadge.className = `role-badge rol-${user.rol}`
  
  // Actualizar saludo
  document.getElementById('user-greeting').textContent = `Bienvenido, ${user.nombre || 'Usuario'}`
  
  // Ocultar tabs según rol
  const isVisitante = user.rol === 'visitante'
  const isAdmin = user.rol === 'administrador'
  
  // Visitantes no ven Pedidos ni Conversaciones
  if (isVisitante) {
    document.getElementById('nav-pedidos').style.display = 'none'
    document.getElementById('nav-conversaciones').style.display = 'none'
  }
  
  // Solo admin ve gestión de usuarios
  if (isAdmin) {
    document.getElementById('nav-usuarios').style.display = 'flex'
  }
  
  console.log(`👤 Usuario: ${user.nombre} - Rol: ${user.rol}`)
}

// Función para renovar el access token usando el refresh token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    window.location.href = '/login.html'
    return null
  }
  
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    const json = await res.json()
    
    if (json.success) {
      localStorage.setItem('access_token', json.accessToken)
      localStorage.setItem('refresh_token', json.refreshToken)
      return json.accessToken
    } else {
      localStorage.clear()
      window.location.href = '/login.html'
      return null
    }
  } catch (e) {
    localStorage.clear()
    window.location.href = '/login.html'
    return null
  }
}

function authHeader(){
  const t = localStorage.getItem('access_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// Función para hacer fetch con auto-refresh si el token expiró
async function fetchWithAuth(url, options = {}) {
  options.headers = { ...options.headers, ...authHeader() }
  
  let res = await fetch(url, options)
  
  // Si el token expiró (401), renovar y reintentar
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      options.headers.Authorization = `Bearer ${newToken}`
      res = await fetch(url, options)
    }
  }
  
  return res
}

async function loadStats() {
  try {
    const response = await fetchWithAuth(`${API_URL}/stats`)
    const result = await response.json();
    
    if (result.success) {
        document.getElementById('totalClientes').textContent = result.data.clientes.total;
        document.getElementById('clientesHogar').textContent = result.data.clientes.hogar;
        document.getElementById('clientesNegocio').textContent = result.data.clientes.negocio;
        document.getElementById('clientesHoy').textContent = result.data.clientes.hoy;
    }
  } catch (error) {
      console.error('Error cargando estadísticas:', error);
  }
}

// Cargar clientes
async function loadClientes() {
    try {
        const response = await fetchWithAuth(`${API_URL}/clientes?t=${Date.now()}`);
        const result = await response.json();
        
        console.log('📊 Clientes cargados:', result.data);
        
        const container = document.getElementById('clientes-content');
        const user = getUserData()
        const isVisitante = user && user.rol === 'visitante'
        
        if (result.success && result.data.length > 0) {
            // Visitantes ven una tabla simplificada sin datos sensibles
            if (isVisitante) {
                container.innerHTML = `
                    <div class="info-message">ℹ️ Como visitante, solo puedes ver estadísticas básicas.</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Fecha Registro</th>
                                <th>Conversaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.data.map(cliente => `
                                <tr>
                                    <td><span class="badge badge-${cliente.tipoCliente}">${cliente.tipoCliente.toUpperCase()}</span></td>
                                    <td>${new Date(cliente.fechaRegistro).toLocaleDateString('es-CO')}</td>
                                    <td>${cliente.conversaciones}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                // Admin y operarios ven todos los datos
                container.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Teléfono</th>
                                <th>Tipo</th>
                                <th>Información del Cliente</th>
                                <th>Fecha Registro</th>
                                <th>Conversaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.data.map(cliente => {
                                let info = '-';
                                if (cliente.productosInteres) {
                                    const lines = cliente.productosInteres.split('\n').map(l => l.trim()).filter(l => l);
                                    if (lines.length >= 4) {
                                        info = `Negocio: ${lines[0]} | Ciudad: ${lines[1]} | Contacto: ${lines[2]} | Productos: ${lines[3]}`;
                                    } else {
                                        info = cliente.productosInteres.replace(/\n/g, ' | ');
                                    }
                                }
                                
                                return `
                                    <tr>
                                        <td>${cliente.telefono || '-'}</td>
                                        <td><span class="badge badge-${cliente.tipoCliente}">${cliente.tipoCliente.toUpperCase()}</span></td>
                                        <td style="max-width: 400px; white-space: normal;">${info}</td>
                                        <td>${new Date(cliente.fechaRegistro).toLocaleDateString('es-CO')}</td>
                                        <td>${cliente.conversaciones}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No hay clientes registrados aún</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
        document.getElementById('clientes-content').innerHTML = 
            '<div class="empty-state"><p>Error cargando datos</p></div>';
    }
}

// Cargar pedidos
async function loadPedidos() {
    try {
        const response = await fetchWithAuth(`${API_URL}/pedidos?t=${Date.now()}`); // Cache busting
        const result = await response.json();
        
        const container = document.getElementById('pedidos-content');
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Teléfono</th>
                            <th>Tipo Cliente</th>
                            <th>Productos</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.data.map(pedido => `
                            <tr>
                                <td>${pedido.telefono}</td>
                                <td><span class="badge badge-${pedido.tipoCliente}">${pedido.tipoCliente.toUpperCase()}</span></td>
                                <td>${pedido.productos}</td>
                                <td>${pedido.estado}</td>
                                <td>${new Date(pedido.fechaPedido).toLocaleDateString('es-CO')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No hay pedidos registrados aún</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        document.getElementById('pedidos-content').innerHTML = 
            '<div class="empty-state"><p>Error cargando datos</p></div>';
    }
}

// Cargar conversaciones
async function loadConversaciones() {
    try {
        const response = await fetchWithAuth(`${API_URL}/conversaciones?t=${Date.now()}`);
        const result = await response.json();
        
        const container = document.getElementById('conversaciones-content');
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Teléfono</th>
                            <th>Flujo Actual</th>
                            <th>Mensajes</th>
                            <th>Fecha Inicio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.data.map(conv => `
                            <tr>
                                <td>${conv.telefono}</td>
                                <td>${conv.flujoActual || '-'}</td>
                                <td>${conv.mensajes.length}</td>
                                <td>${new Date(conv.fechaInicio).toLocaleString('es-CO')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No hay conversaciones registradas aún</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando conversaciones:', error);
        document.getElementById('conversaciones-content').innerHTML = 
            '<div class="empty-state"><p>Error cargando datos</p></div>';
    }
}

// Cargar usuarios (solo admin)
async function loadUsuarios() {
    if (!hasRole('administrador')) return
    
    try {
        const response = await fetchWithAuth(`${API_URL}/usuarios?t=${Date.now()}`);
        const result = await response.json();
        
        const container = document.getElementById('usuarios-content');
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.data.map(user => `
                            <tr>
                                <td>${user.nombre || '-'}</td>
                                <td>${user.email}</td>
                                <td>
                                    <select class="rol-selector" onchange="changeUserRole('${user._id}', this.value)" ${user.rol === 'administrador' ? 'disabled' : ''}>
                                        <option value="visitante" ${user.rol === 'visitante' ? 'selected' : ''}>Visitante</option>
                                        <option value="operario" ${user.rol === 'operario' ? 'selected' : ''}>Operario</option>
                                        <option value="administrador" ${user.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                                    </select>
                                </td>
                                <td><span class="badge ${user.activo ? 'badge-success' : 'badge-danger'}">${user.activo ? 'Activo' : 'Inactivo'}</span></td>
                                <td>${new Date(user.createdAt).toLocaleDateString('es-CO')}</td>
                                <td>
                                    <button class="btn-small ${user.activo ? 'btn-danger' : 'btn-success'}" 
                                            onclick="toggleUserStatus('${user._id}', ${!user.activo})"
                                            ${user.rol === 'administrador' ? 'disabled' : ''}>
                                        ${user.activo ? '🚫 Desactivar' : '✅ Activar'}
                                    </button>
                                    <button class="btn-small btn-danger" 
                                            onclick="deleteUser('${user._id}', '${user.email}')"
                                            ${user.rol === 'administrador' ? 'disabled' : ''}>
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👤</div>
                    <p>No hay usuarios registrados</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        document.getElementById('usuarios-content').innerHTML = 
            '<div class="empty-state"><p>Error cargando usuarios</p></div>';
    }
}

// Cambiar rol de usuario (solo admin)
async function changeUserRole(userId, newRole) {
    if (!hasRole('administrador')) return
    
    if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole.toUpperCase()}?`)) {
        loadUsuarios() // Recargar para resetear el select
        return
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/usuarios/${userId}/rol`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rol: newRole })
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Rol actualizado exitosamente a ${newRole.toUpperCase()}`)
            loadUsuarios()
        } else {
            alert('❌ Error: ' + (result.error || 'No se pudo actualizar el rol'))
            loadUsuarios()
        }
    } catch (error) {
        console.error('Error actualizando rol:', error);
        alert('❌ Error de conexión')
        loadUsuarios()
    }
}

// Activar/Desactivar usuario (solo admin)
async function toggleUserStatus(userId, newStatus) {
    if (!hasRole('administrador')) return
    
    if (!confirm(`¿Estás seguro de ${newStatus ? 'activar' : 'desactivar'} este usuario?`)) {
        return
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/usuarios/${userId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: newStatus })
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`)
            loadUsuarios()
        } else {
            alert('❌ Error: ' + (result.error || 'No se pudo actualizar el usuario'))
        }
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        alert('❌ Error de conexión')
    }
}

// Eliminar usuario (solo admin)
async function deleteUser(userId, userEmail) {
    if (!hasRole('administrador')) return
    
    if (!confirm(`⚠️ ¿Estás seguro de ELIMINAR permanentemente al usuario ${userEmail}?\n\nEsta acción NO se puede deshacer.`)) {
        return
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/usuarios/${userId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Usuario eliminado exitosamente')
            loadUsuarios()
        } else {
            alert('❌ Error: ' + (result.error || 'No se pudo eliminar el usuario'))
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('❌ Error de conexión')
    }
}

// Función de logout
async function logout() {
    try {
        await fetchWithAuth(`${API_URL}/auth/logout`, {
            method: 'POST'
        });
    } catch (e) {
        console.error('Error en logout:', e);
    }
    
    localStorage.clear();
    window.location.href = '/login.html';
}

// Cambiar entre tabs
function switchTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar tab seleccionado
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.getElementById(`page-title`).textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
    
    // Cargar datos del tab si es usuarios
    if (tabName === 'usuarios') {
        loadUsuarios();
    }
}

// Cargar todo
function loadAll() {
    console.log('🔄 Actualizando datos...', new Date().toLocaleTimeString());
    loadStats();
    loadClientes();
    
    // Solo cargar si el usuario tiene permisos
    if (hasRole('administrador', 'operario')) {
        loadPedidos();
        loadConversaciones();
    }
}

// Inicializar al cargar
initializeRoleBasedUI();
loadAll();

// Auto-refresh cada 30 segundos
setInterval(loadAll, 30000);

console.log('✅ Dashboard iniciado');
