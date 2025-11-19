const API_URL = 'http://localhost:3009/api'

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
        const response = await fetchWithAuth(`${API_URL}/clientes?t=${Date.now()}`); // Cache busting
        const result = await response.json();
        
        console.log('📊 Clientes cargados:', result.data); // Debug
        
        const container = document.getElementById('clientes-content');
        
        if (result.success && result.data.length > 0) {
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
                            // Parsear la información del cliente
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
                                    <td>${cliente.telefono}</td>
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
        const response = await fetchWithAuth(`${API_URL}/conversaciones?t=${Date.now()}`); // Cache busting
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

// Cambiar entre tabs
function switchTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar tab seleccionado
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Cargar todo
function loadAll() {
    console.log('🔄 Actualizando datos...', new Date().toLocaleTimeString());
    loadStats();
    loadClientes();
    loadPedidos();
    loadConversaciones();
}

// Cargar datos al iniciar
loadAll();

// Auto-refresh cada 30 segundos
setInterval(loadAll, 30000);

console.log('✅ Dashboard iniciado');
