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
            container.innerHTML = result.data.map(conv => {
                const nombreDisplay = conv.nombreNegocio || conv.nombreCliente || conv.telefono;
                const tipoCliente = conv.tipoCliente || 'desconocido';
                const totalMensajes = conv.mensajes?.length || 0;
                const ultimaFecha = conv.fechaUltimoMensaje ? 
                    new Date(conv.fechaUltimoMensaje).toLocaleString('es-CO') : '-';
                
                return `
                    <div class="conversacion-card" onclick="verDetalleConversacion('${conv.telefono}')">
                        <div class="conversacion-header">
                            <div>
                                <div class="conversacion-nombre">${nombreDisplay}</div>
                                <div class="conversacion-telefono">📱 ${conv.telefono}</div>
                            </div>
                            <span class="badge badge-${tipoCliente}">${tipoCliente.toUpperCase()}</span>
                        </div>
                        <div class="conversacion-stats">
                            <span>💬 ${totalMensajes} mensajes</span>
                            <span>📅 ${ultimaFecha}</span>
                            <span>🔄 ${conv.flujoActual || 'N/A'}</span>
                        </div>
                    </div>
                `;
            }).join('');
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

// Ver detalle de conversación
async function verDetalleConversacion(telefono) {
    try {
        const response = await fetchWithAuth(`${API_URL}/conversaciones/${telefono}`);
        const result = await response.json();
        
        if (result.success) {
            const conv = result.data;
            const nombreDisplay = conv.nombreNegocio || conv.nombreCliente || telefono;
            
            // Actualizar título del modal
            document.getElementById('modalTitle').textContent = 
                `Conversación con ${nombreDisplay}`;
            
            // Separar interacciones importantes
            const interaccionesImportantes = conv.interaccionesImportantes || [];
            const pedidos = interaccionesImportantes.filter(i => i.tipo === 'pedido');
            const registros = interaccionesImportantes.filter(i => i.tipo === 'registro');
            const contactos = interaccionesImportantes.filter(i => i.tipo === 'contacto_asesor');
            
            // Construir contenido del modal
            let modalContent = `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: var(--avellano-red); margin-bottom: 15px;">
                        📊 Resumen de Interacciones
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div class="stat-card">
                            <div class="stat-value">${pedidos.length}</div>
                            <div class="stat-label">Pedidos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${registros.length}</div>
                            <div class="stat-label">Registros</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${contactos.length}</div>
                            <div class="stat-label">Contactos</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Sección de interacciones importantes
            if (interaccionesImportantes.length > 0) {
                modalContent += `
                    <div class="interacciones-importantes">
                        <h4 style="margin-bottom: 10px; color: var(--avellano-red);">
                            ⭐ Interacciones Importantes
                        </h4>
                `;
                
                interaccionesImportantes.forEach(interaccion => {
                    modalContent += `
                        <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 8px;">
                            <span class="interaccion-badge interaccion-${interaccion.tipo}">
                                ${interaccion.tipo.toUpperCase()}
                            </span>
                            <div style="margin-top: 8px; font-size: 13px;">
                                ${interaccion.contenido}
                            </div>
                            <div style="margin-top: 5px; font-size: 11px; color: #999;">
                                ${new Date(interaccion.timestamp).toLocaleString('es-CO')}
                            </div>
                        </div>
                    `;
                });
                
                modalContent += `</div>`;
            }
            
            // Timeline de mensajes
            modalContent += `
                <h4 style="margin-top: 25px; margin-bottom: 15px; color: var(--avellano-red);">
                    💬 Historial de Conversación
                </h4>
                <div class="conversacion-timeline">
            `;
            
            if (conv.mensajes && conv.mensajes.length > 0) {
                conv.mensajes.forEach(mensaje => {
                    const clase = mensaje.rol === 'usuario' ? 'mensaje-usuario' : 'mensaje-bot';
                    const icono = mensaje.rol === 'usuario' ? '👤' : '🤖';
                    
                    modalContent += `
                        <div class="timeline-item">
                            <div class="mensaje-item ${clase}">
                                <strong>${icono} ${mensaje.rol === 'usuario' ? 'Cliente' : 'Bot Avellano'}</strong>
                                <div style="margin-top: 5px;">${mensaje.mensaje}</div>
                                <div class="mensaje-timestamp">
                                    ${new Date(mensaje.timestamp).toLocaleString('es-CO')}
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                modalContent += '<p style="text-align: center; color: #999;">No hay mensajes registrados</p>';
            }
            
            modalContent += `</div>`;
            
            // Mostrar modal
            document.getElementById('modalBody').innerHTML = modalContent;
            document.getElementById('modalConversacion').classList.add('active');
        }
    } catch (error) {
        console.error('Error cargando detalle de conversación:', error);
        alert('❌ Error cargando detalle de conversación');
    }
}

// Cerrar modal de conversación
function cerrarModalConversacion() {
    document.getElementById('modalConversacion').classList.remove('active');
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalConversacion');
    if (event.target === modal) {
        cerrarModalConversacion();
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
