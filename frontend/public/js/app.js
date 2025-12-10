// Usar configuración dinámica de API_URL desde config.js
const API_URL = window.ENV?.API_URL || 'http://localhost:3009/api'

// Variables globales para filtros de clientes
let todosClientes = [];
let tipoFiltroActual = 'todos';

// Verificar autenticación al cargar la página
function checkAuthentication() {
  const token = localStorage.getItem('access_token')
  const userData = localStorage.getItem('user_data')
  
  if (!token || !userData) {
    // No hay token, redirigir al login
    window.location.href = '/pages/login.html'
    return false
  }
  
  return true
}

// Obtener datos del usuario desde localStorage
function getUserData() {
  const data = localStorage.getItem('user_data')
  if (!data) {
    console.warn('⚠️ No hay datos de usuario en localStorage')
    return null
  }
  
  try {
    const user = JSON.parse(data)
    
    // ⭐ Validar estructura del usuario operador
    if (user.rol === 'operador' && !user.tipoOperador) {
      console.error('❌ Usuario operador sin tipoOperador:', user)
      console.log('🔄 Se requiere volver a iniciar sesión')
      // No recargar automáticamente, solo advertir
      // El middleware del servidor bloqueará las peticiones
    }
    
    return user
  } catch (e) {
    console.error('❌ Error parseando user data:', e)
    return null
  }
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
    window.location.href = '/pages/login.html'
    return
  }
  
  // Mostrar nombre y rol del usuario en sidebar
  const firstLetter = (user.nombre || user.email).charAt(0).toUpperCase()
  document.getElementById('user-avatar').textContent = firstLetter
  document.getElementById('user-card-name').textContent = user.nombre || 'Usuario'
  document.getElementById('user-card-email').textContent = user.email
  
  const rolBadge = document.getElementById('role-badge')
  const rolTexto = user.tipoOperador 
    ? `${user.rol.toUpperCase()} - ${user.tipoOperador.replace(/_/g, ' ').toUpperCase()}`
    : user.rol.toUpperCase()
  rolBadge.textContent = rolTexto
  rolBadge.className = `role-badge rol-${user.rol}`
  
  // Actualizar saludo
  document.getElementById('user-greeting').textContent = `Bienvenido, ${user.nombre || 'Usuario'}`
  
  // Ocultar tabs según rol
  const isSoporte = user.rol === 'soporte'
  const isOperador = user.rol === 'operador'
  const isAdmin = user.rol === 'administrador'
  
  // Operadores no ven eventos ni gestión de usuarios
  if (isOperador) {
    document.getElementById('nav-eventos').style.display = 'none'
    document.getElementById('nav-usuarios').style.display = 'none'
  }
  
  // Soporte ve eventos pero no gestión de usuarios
  if (isSoporte) {
    document.getElementById('nav-usuarios').style.display = 'none'
    document.getElementById('nav-eventos').style.display = 'flex'
  }
  
  // Admin ve todo
  if (isAdmin) {
    document.getElementById('nav-usuarios').style.display = 'flex'
    document.getElementById('nav-eventos').style.display = 'flex'
  }
  
  console.log(`👤 Usuario: ${user.nombre} - Rol: ${user.rol}${user.tipoOperador ? ' - Tipo: ' + user.tipoOperador : ''}`)
}

// Función para renovar el access token usando el refresh token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    console.log('❌ No hay refresh token')
    window.location.href = '/pages/login.html'
    return null
  }
  
  try {
    console.log('🔄 Renovando access token...')
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    const json = await res.json()
    
    if (json.success) {
      localStorage.setItem('access_token', json.accessToken)
      localStorage.setItem('refresh_token', json.refreshToken)
      
      // ⭐ IMPORTANTE: Actualizar también los datos del usuario
      if (json.user) {
        const currentUser = getUserData() || {}
        const updatedUser = {
          ...currentUser,
          ...json.user,
          // Asegurar que tipoOperador se preserve
          tipoOperador: json.user.tipoOperador || currentUser.tipoOperador
        }
        localStorage.setItem('user_data', JSON.stringify(updatedUser))
        console.log('✅ Token renovado y usuario actualizado:', updatedUser)
      } else {
        console.log('✅ Access token renovado')
      }
      
      return json.accessToken
    } else {
      console.log('❌ Error renovando token:', json.error)
      localStorage.clear()
      window.location.href = '/pages/login.html'
      return null
    }
  } catch (e) {
    console.error('❌ Error en refresh:', e)
    localStorage.clear()
    window.location.href = '/pages/login.html'
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

// Cargar clientes (filtrados por responsable)
async function loadClientes() {
    try {
        console.log('🔄 Iniciando carga de clientes...');
        const url = `${API_URL}/clientes?t=${Date.now()}`;
        console.log('📡 URL de petición:', url);
        
        const response = await fetchWithAuth(url);
        console.log('📨 Response status:', response.status);
        
        const result = await response.json();
        console.log('📊 Respuesta completa:', result);
        console.log('📊 Clientes recibidos:', result.data?.length || 0);
        
        if (result.success && result.data && result.data.length > 0) {
            todosClientes = result.data;
            console.log('✅ Clientes guardados en todosClientes:', todosClientes.length);
            actualizarEstadisticasClientes();
            mostrarClientesFiltrados(tipoFiltroActual);
        } else {
            console.warn('⚠️ No hay clientes o la respuesta falló');
            todosClientes = [];
            actualizarEstadisticasClientes();
            document.getElementById('clientes-content').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No hay clientes asignados</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
        document.getElementById('clientes-content').innerHTML = 
            '<div class="empty-state"><p>Error cargando datos</p></div>';
    }
}

// Actualizar estadísticas de clientes
function actualizarEstadisticasClientes() {
    const total = todosClientes.length;
    const hogar = todosClientes.filter(c => c.tipoCliente === 'hogar').length;
    const negocio = todosClientes.filter(c => c.tipoCliente !== 'hogar').length;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const clientesHoy = todosClientes.filter(c => {
        const fechaRegistro = new Date(c.fechaRegistro);
        fechaRegistro.setHours(0, 0, 0, 0);
        return fechaRegistro.getTime() === hoy.getTime();
    }).length;
    
    document.getElementById('totalClientes').textContent = total;
    document.getElementById('clientesHogar').textContent = hogar;
    document.getElementById('clientesNegocio').textContent = negocio;
    document.getElementById('clientesHoy').textContent = clientesHoy;
}

// Filtrar clientes por tipo
function filtrarClientesPorTipo(tipo) {
    console.log('🔍 Filtrando clientes por tipo:', tipo);
    console.log('📊 Total clientes disponibles:', todosClientes.length);
    
    tipoFiltroActual = tipo;
    
    // Actualizar clases activas en las cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const cardSeleccionado = document.querySelector(`[data-tipo="${tipo}"]`);
    if (cardSeleccionado) {
        cardSeleccionado.classList.add('active');
    } else {
        console.warn('⚠️ No se encontró card con data-tipo:', tipo);
    }
    
    mostrarClientesFiltrados(tipo);
}

// Mostrar clientes filtrados
function mostrarClientesFiltrados(tipo) {
    let clientesFiltrados = todosClientes;
    
    if (tipo === 'hogar') {
        clientesFiltrados = todosClientes.filter(c => c.tipoCliente === 'hogar');
    } else if (tipo === 'negocio') {
        clientesFiltrados = todosClientes.filter(c => 
            c.tipoCliente === 'tienda' || 
            c.tipoCliente === 'asadero' || 
            c.tipoCliente === 'restaurante_estandar' || 
            c.tipoCliente === 'restaurante_premium' || 
            c.tipoCliente === 'mayorista'
        );
    } else if (tipo === 'hoy') {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        clientesFiltrados = todosClientes.filter(c => {
            const fechaRegistro = new Date(c.fechaRegistro);
            fechaRegistro.setHours(0, 0, 0, 0);
            return fechaRegistro.getTime() === hoy.getTime();
        });
    }
    
    const container = document.getElementById('clientes-content');
    const responsableMap = {
        'coordinador_masivos': 'Coord. Masivos',
        'director_comercial': 'Dir. Comercial',
        'ejecutivo_horecas': 'Ejec. Horecas',
        'mayorista': 'Mayorista'
    };
    
    if (clientesFiltrados.length > 0) {
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Teléfono</th>
                        <th>Tipo</th>
                        <th>Nombre Negocio</th>
                        <th>Ciudad</th>
                        <th>Responsable</th>
                        <th>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientesFiltrados.map(cliente => {
                        const responsableTexto = cliente.responsable 
                            ? responsableMap[cliente.responsable] || cliente.responsable 
                            : '-';
                        
                        return `
                            <tr class="clickable-row" onclick="verDetalleCliente('${cliente.telefono}')">
                                <td>${cliente.telefono || '-'}</td>
                                <td><span class="badge badge-${cliente.tipoCliente}">${cliente.tipoCliente.toUpperCase()}</span></td>
                                <td>${cliente.nombreNegocio || '-'}</td>
                                <td>${cliente.ciudad || '-'}</td>
                                <td><span class="badge badge-info">${responsableTexto}</span></td>
                                <td>${new Date(cliente.fechaRegistro).toLocaleDateString('es-CO')}</td>
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
                <p>No hay clientes en esta categoría</p>
            </div>
        `;
    }
}

// Variable global para almacenar todos los pedidos
let todosPedidos = [];
let estadoFiltroActual = 'todos';

// Cargar pedidos
async function loadPedidos() {
    const container = document.getElementById('pedidos-content');
    
    // Mostrar loading
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <p>Cargando pedidos...</p>
        </div>
    `;
    
    try {
        console.log('📋 Iniciando carga de pedidos...')
        console.log('📋 URL:', `${API_URL}/pedidos`)
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        
        const response = await fetchWithAuth(`${API_URL}/pedidos?t=${Date.now()}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('📋 Respuesta recibida:', response.status)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json();
        console.log('📋 Resultado:', result)
        
        if (result.success && result.data) {
            // Guardar todos los pedidos
            todosPedidos = result.data;
            
            // Actualizar estadísticas
            actualizarEstadisticasPedidos(todosPedidos);
            
            // Mostrar pedidos según el filtro actual
            mostrarPedidosFiltrados(estadoFiltroActual);
        } else {
            console.log('ℹ️ No hay pedidos para mostrar')
            todosPedidos = [];
            actualizarEstadisticasPedidos([]);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No hay pedidos registrados aún</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        
        let errorMsg = 'Error cargando pedidos. Por favor, recarga la página.';
        if (error.name === 'AbortError') {
            errorMsg = 'Tiempo de espera agotado. Verifica tu conexión e intenta de nuevo.';
        }
        
        container.innerHTML = 
            `<div class="empty-state"><p>❌ ${errorMsg}</p></div>`;
    }
}

// Actualizar estadísticas de pedidos
function actualizarEstadisticasPedidos(pedidos) {
    const total = pedidos.length;
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const enProceso = pedidos.filter(p => p.estado === 'en_proceso').length;
    const atendidos = pedidos.filter(p => p.estado === 'atendido').length;
    const cancelados = pedidos.filter(p => p.estado === 'cancelado').length;
    
    document.getElementById('totalPedidos').textContent = total;
    document.getElementById('pedidosPendientes').textContent = pendientes;
    document.getElementById('pedidosEnProceso').textContent = enProceso;
    document.getElementById('pedidosAtendidos').textContent = atendidos;
    document.getElementById('pedidosCancelados').textContent = cancelados;
}

// Filtrar pedidos por estado
function filtrarPedidosPorEstado(estado) {
    console.log('🔍 Filtrando pedidos por estado:', estado);
    console.log('📊 Total pedidos disponibles:', todosPedidos.length);
    
    estadoFiltroActual = estado;
    
    // Actualizar clases activas en las cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const cardSeleccionado = document.querySelector(`[data-estado="${estado}"]`);
    if (cardSeleccionado) {
        cardSeleccionado.classList.add('active');
    } else {
        console.warn('⚠️ No se encontró card con data-estado:', estado);
    }
    
    // Mostrar pedidos filtrados
    mostrarPedidosFiltrados(estado);
}

// Mostrar pedidos filtrados
function mostrarPedidosFiltrados(estado) {
    console.log('📋 Mostrando pedidos filtrados - Estado:', estado);
    console.log('📊 Total de pedidos:', todosPedidos.length);
    
    const container = document.getElementById('pedidos-content');
    
    // Filtrar pedidos según el estado
    let pedidosFiltrados = estado === 'todos' 
        ? todosPedidos 
        : todosPedidos.filter(p => p.estado === estado);
    
    console.log('📋 Pedidos filtrados:', pedidosFiltrados.length);
    
    if (pedidosFiltrados.length > 0) {
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID Pedido</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosFiltrados.map(pedido => {
                        const productos = Array.isArray(pedido.productos) 
                            ? pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')
                            : pedido.productos;
                        
                        const estadoClass = {
                            'pendiente': 'badge-warning',
                            'en_proceso': 'badge-info',
                            'atendido': 'badge-success',
                            'cancelado': 'badge-danger'
                        }[pedido.estado] || 'badge-secondary';
                        
                        const estadoTexto = {
                            'pendiente': 'PENDIENTE',
                            'en_proceso': 'EN PROCESO',
                            'atendido': 'ATENDIDO',
                            'cancelado': 'CANCELADO'
                        }[pedido.estado] || pedido.estado.toUpperCase();
                        
                        return `
                            <tr class="clickable-row" onclick="verDetallePedido('${pedido._id}')">
                                <td><strong>${pedido.idPedido || 'N/A'}</strong></td>
                                <td>${pedido.nombreNegocio || pedido.personaContacto || '-'}</td>
                                <td style="max-width: 350px; white-space: normal;">${productos}</td>
                                <td><strong>$${(pedido.total || 0).toLocaleString('es-CO')}</strong></td>
                                <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
                                <td>${new Date(pedido.fechaPedido).toLocaleDateString('es-CO')}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else {
        const mensajePorEstado = {
            'todos': 'No hay pedidos registrados',
            'pendiente': 'No hay pedidos pendientes',
            'en_proceso': 'No hay pedidos en proceso',
            'atendido': 'No hay pedidos atendidos',
            'cancelado': 'No hay pedidos cancelados'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>${mensajePorEstado[estado] || 'No hay pedidos'}</p>
            </div>
        `;
    }
}

// Ver detalle de pedido
async function verDetallePedido(pedidoId) {
    try {
        const response = await fetchWithAuth(`${API_URL}/pedidos/${pedidoId}`);
        const result = await response.json();
        
        if (result.success) {
            const pedido = result.data;
            
            const estadoClass = {
                'pendiente': 'badge-warning',
                'en_proceso': 'badge-info',
                'atendido': 'badge-success',
                'cancelado': 'badge-danger'
            }[pedido.estado] || 'badge-secondary';
            
            const estadoTexto = {
                'pendiente': 'PENDIENTE',
                'en_proceso': 'EN PROCESO',
                'atendido': 'ATENDIDO',
                'cancelado': 'CANCELADO'
            }[pedido.estado] || pedido.estado.toUpperCase();
            
            // Obtener datos del usuario actual
            const user = getUserData();
            const tipoOperadorTexto = {
                'coordinador_masivos': 'Coordinador de Masivos',
                'director_comercial': 'Director Comercial',
                'ejecutivo_horecas': 'Ejecutivo de Horecas',
                'mayorista': 'Asesor de Mayoristas'
            };
            const nombreOperador = tipoOperadorTexto[user?.tipoOperador] || 'Asesor Comercial';
            
            // Determinar acciones disponibles según el estado
            let botonesAccion = '';
            if (pedido.estado === 'pendiente') {
                botonesAccion = `
                    <button class="btn-tomar-pedido" onclick="tomarPedido('${pedido._id}')">
                        📦 Tomar Pedido
                    </button>
                `;
            } else if (pedido.estado === 'en_proceso') {
                botonesAccion = `
                    <div class="botones-proceso">
                        <button class="btn-completar" onclick="completarPedido('${pedido._id}')">
                            ✅ Marcar como Atendido
                        </button>
                        <button class="btn-cancelar" onclick="cancelarPedido('${pedido._id}')">
                            ❌ Cancelar Pedido
                        </button>
                    </div>
                `;
            }
            
            // Generar mensaje para el cliente
            const productosTexto = pedido.productos.map(p => 
                `- ${p.cantidad} ${p.nombre} ($${p.precioUnitario.toLocaleString('es-CO')} c/u)`
            ).join('\n');
            
            const mensajeParaCliente = `Hola, soy tu asesor de Avellano, más específicamente ${nombreOperador}. Yo seré el encargado de que tu pedido con ID *${pedido.idPedido}* sea entregado correctamente.

📍 *Dirección de entrega:* ${pedido.direccion || 'No especificada'}, ${pedido.ciudad || ''}

📦 *Tu pedido consta de:*
${productosTexto}

💰 *Total: $${pedido.total.toLocaleString('es-CO')}*

En breve me pondré en contacto contigo para confirmar los detalles y coordinar la entrega. ¡Gracias por tu preferencia! 🐓`;

            const mensajeEncoded = encodeURIComponent(mensajeParaCliente);
            const telefonoLimpio = pedido.telefono.replace(/\D/g, '');
            const whatsappLink = `https://wa.me/${telefonoLimpio}?text=${mensajeEncoded}`;
            
            const modalContent = `
                <div class="pedido-detalle">
                    <!-- Header -->
                    <div class="pedido-header">
                        <div class="pedido-header-content">
                            <h2 class="pedido-id">${pedido.idPedido}</h2>
                            <span class="badge ${estadoClass} badge-large">${estadoTexto}</span>
                        </div>
                        <div class="pedido-fecha">
                            📅 ${new Date(pedido.fechaPedido).toLocaleDateString('es-CO', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                    
                    <!-- Información del Cliente -->
                    <div class="pedido-section">
                        <h3 class="section-title">👤 Información del Cliente</h3>
                        <div class="info-grid-pedido">
                            <div class="info-item">
                                <span class="info-label">Negocio:</span>
                                <span class="info-value">${pedido.nombreNegocio || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Persona de Contacto:</span>
                                <span class="info-value">${pedido.personaContacto || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Teléfono:</span>
                                <span class="info-value">${pedido.telefono}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Tipo:</span>
                                <span class="info-value">${pedido.tipoCliente.replace(/_/g, ' ').toUpperCase()}</span>
                            </div>
                            <div class="info-item full-width">
                                <span class="info-label">📍 Dirección:</span>
                                <span class="info-value">${pedido.direccion || 'No especificada'}, ${pedido.ciudad || ''}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Productos -->
                    <div class="pedido-section">
                        <h3 class="section-title">📦 Productos del Pedido</h3>
                        <table class="productos-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pedido.productos.map(p => `
                                    <tr>
                                        <td><strong>${p.nombre}</strong></td>
                                        <td class="text-center">${p.cantidad}</td>
                                        <td class="text-right">$${p.precioUnitario.toLocaleString('es-CO')}</td>
                                        <td class="text-right"><strong>$${p.subtotal.toLocaleString('es-CO')}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="3"><strong>TOTAL</strong></td>
                                    <td class="text-right"><strong class="total-price">$${pedido.total.toLocaleString('es-CO')}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <!-- Coordinador Asignado -->
                    <div class="pedido-section">
                        <h3 class="section-title">👨‍💼 Coordinador Asignado</h3>
                        <div class="coordinador-info">
                            <div class="coordinador-nombre">${pedido.coordinadorAsignado}</div>
                            <div class="coordinador-tel">📞 ${pedido.telefonoCoordinador}</div>
                        </div>
                    </div>
                    
                    ${pedido.notas ? `
                    <div class="pedido-section">
                        <h3 class="section-title">📝 Notas</h3>
                        <div class="pedido-notas">${pedido.notas}</div>
                    </div>
                    ` : ''}
                    
                    <!-- Mensaje para el Cliente -->
                    ${pedido.estado === 'en_proceso' ? `
                    <div class="pedido-section mensaje-cliente-section">
                        <h3 class="section-title">💬 Mensaje para el Cliente</h3>
                        <div class="mensaje-container">
                            <textarea id="mensajeCliente" class="mensaje-textarea" oninput="actualizarLinkWhatsApp('${telefonoLimpio}')">${mensajeParaCliente}</textarea>
                            <div class="mensaje-botones">
                                <button class="btn-copiar" onclick="copiarMensaje()">
                                    📋 Copiar Mensaje
                                </button>
                                <a id="whatsappLink" href="${whatsappLink}" target="_blank" class="btn-whatsapp">
                                    💬 Abrir en WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Botones de Acción -->
                    ${botonesAccion ? `
                    <div class="pedido-acciones">
                        ${botonesAccion}
                    </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('modalTitle').textContent = `Pedido ${pedido.idPedido}`;
            document.getElementById('modalBody').innerHTML = modalContent;
            document.getElementById('modalConversacion').classList.add('active');
        }
    } catch (error) {
        console.error('Error cargando detalle de pedido:', error);
        alert('❌ Error cargando detalle del pedido');
    }
}

// Tomar pedido (cambiar a "en_proceso")
async function tomarPedido(pedidoId) {
    if (!confirm('¿Deseas tomar este pedido? Se cambiará el estado a "En Proceso" y se notificará al cliente por WhatsApp')) {
        return;
    }
    
    try {
        // Primero obtener los datos del pedido
        const pedidoResponse = await fetchWithAuth(`${API_URL}/pedidos/${pedidoId}`);
        const pedidoData = await pedidoResponse.json();
        
        if (!pedidoData.success) {
            alert(`❌ Error: ${pedidoData.error}`);
            return;
        }
        
        const pedido = pedidoData.data;
        
        // Actualizar el estado del pedido
        const response = await fetchWithAuth(`${API_URL}/pedidos/${pedidoId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'en_proceso' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Enviar mensaje de WhatsApp al cliente
            const mensaje = 'Su pedido ya está siendo atendido por un asesor comercial. En breve se comunicará con usted para confirmar el pedido y realizar el pago del mismo. ¡Gracias por su preferencia! 🐓';
            
            try {
                const whatsappResponse = await fetchWithAuth(`${API_URL}/whatsapp/enviar-mensaje`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefono: pedido.telefono,
                        mensaje: mensaje
                    })
                });
                
                const whatsappResult = await whatsappResponse.json();
                
                if (whatsappResult.success) {
                    alert('✅ Pedido tomado exitosamente y cliente notificado por WhatsApp');
                } else {
                    alert('✅ Pedido tomado exitosamente. ⚠️ No se pudo enviar notificación por WhatsApp');
                    console.error('Error enviando WhatsApp:', whatsappResult.error);
                }
            } catch (whatsappError) {
                console.error('Error enviando mensaje de WhatsApp:', whatsappError);
                alert('✅ Pedido tomado exitosamente. ⚠️ Error enviando notificación por WhatsApp');
            }
            
            cerrarModalConversacion();
            loadPedidos();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error tomando pedido:', error);
        alert('❌ Error al tomar el pedido');
    }
}

// Completar pedido (cambiar a "atendido")
async function completarPedido(pedidoId) {
    if (!confirm('¿Marcar este pedido como ATENDIDO?')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/pedidos/${pedidoId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'atendido' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Pedido marcado como atendido');
            cerrarModalConversacion();
            loadPedidos();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error completando pedido:', error);
        alert('❌ Error al completar el pedido');
    }
}

// Cancelar pedido
async function cancelarPedido(pedidoId) {
    const motivo = prompt('¿Por qué deseas cancelar este pedido?');
    if (!motivo) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}/pedidos/${pedidoId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'cancelado', notasCancelacion: motivo })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Pedido cancelado');
            cerrarModalConversacion();
            loadPedidos();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error cancelando pedido:', error);
        alert('❌ Error al cancelar el pedido');
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

// Variable global para almacenar datos de conversación actual
let conversacionActual = null;
let seccionActivaConv = 'pedidos';

// Ver detalle de conversación
async function verDetalleConversacion(telefono) {
    try {
        const response = await fetchWithAuth(`${API_URL}/conversaciones/${telefono}`);
        const result = await response.json();
        
        if (result.success) {
            conversacionActual = result.data;
            const conv = result.data;
            const nombreDisplay = conv.nombreNegocio || conv.nombreCliente || telefono;
            
            // Actualizar título del modal
            document.getElementById('modalTitle').textContent = 
                `Conversación con ${nombreDisplay}`;
            
            // Obtener pedidos del cliente
            const pedidosResponse = await fetchWithAuth(`${API_URL}/pedidos?telefono=${telefono}`);
            const pedidosData = await pedidosResponse.json();
            const pedidosCliente = pedidosData.success ? pedidosData.data : [];
            
            // Separar interacciones importantes
            const interaccionesImportantes = conv.interaccionesImportantes || [];
            const registros = interaccionesImportantes.filter(i => i.tipo === 'registro');
            const contactos = interaccionesImportantes.filter(i => i.tipo === 'contacto_asesor');
            
            // Calcular estadísticas de interacciones
            const totalMensajes = conv.mensajes?.length || 0;
            const ultimaInteraccion = conv.fechaUltimoMensaje ? 
                new Date(conv.fechaUltimoMensaje).toLocaleString('es-CO') : 'Sin registro';
            
            // Construir contenido del modal
            let modalContent = `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: var(--avellano-red); margin-bottom: 15px;">
                        📊 Resumen de Interacciones
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div class="stat-card filtro-card filtro-pedidos active" onclick="mostrarSeccionConversacion('pedidos')" data-seccion="pedidos" style="cursor: pointer;">
                            <div class="stat-value">${pedidosCliente.length}</div>
                            <div class="stat-label">Pedidos</div>
                        </div>
                        <div class="stat-card filtro-card filtro-registros" onclick="mostrarSeccionConversacion('registros')" data-seccion="registros" style="cursor: pointer;">
                            <div class="stat-value">${registros.length}</div>
                            <div class="stat-label">Registros</div>
                        </div>
                        <div class="stat-card filtro-card filtro-contactos" onclick="mostrarSeccionConversacion('contactos')" data-seccion="contactos" style="cursor: pointer;">
                            <div class="stat-value">${contactos.length}</div>
                            <div class="stat-label">Contactos</div>
                        </div>
                    </div>
                </div>
                
                <!-- Contenedor dinámico para las secciones -->
                <div id="seccion-contenido-conversacion">
            `;
            
            // Almacenar datos para uso posterior
            conversacionActual.pedidosCliente = pedidosCliente;
            conversacionActual.registros = registros;
            conversacionActual.contactos = contactos;
            conversacionActual.totalMensajes = totalMensajes;
            conversacionActual.ultimaInteraccion = ultimaInteraccion;
            
            // Mostrar sección inicial (Pedidos)
            modalContent += generarSeccionPedidos(pedidosCliente);
            
            modalContent += `
                </div>
                
                <!-- Información adicional del cliente -->
                <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="color: var(--avellano-red); margin-bottom: 10px;">📈 Estadísticas de Interacción</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div><strong>Total de mensajes:</strong> ${totalMensajes}</div>
                        <div><strong>Última interacción:</strong> ${ultimaInteraccion}</div>
                    </div>
                </div>
            `;
            
            // Mostrar modal
            document.getElementById('modalBody').innerHTML = modalContent;
            document.getElementById('modalConversacion').classList.add('active');
        }
    } catch (error) {
        console.error('Error cargando detalle de conversación:', error);
        alert('❌ Error cargando detalle de conversación');
    }
}

// Función para cambiar entre secciones en el modal de conversación
function mostrarSeccionConversacion(seccion) {
    if (!conversacionActual) return;
    
    seccionActivaConv = seccion;
    
    // Actualizar clases activas en las cards
    document.querySelectorAll('[data-seccion]').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-seccion="${seccion}"]`).classList.add('active');
    
    // Generar contenido según la sección
    let contenido = '';
    if (seccion === 'pedidos') {
        contenido = generarSeccionPedidos(conversacionActual.pedidosCliente);
    } else if (seccion === 'registros') {
        contenido = generarSeccionRegistros(conversacionActual.registros, conversacionActual);
    } else if (seccion === 'contactos') {
        contenido = generarSeccionContactos(conversacionActual.contactos);
    }
    
    document.getElementById('seccion-contenido-conversacion').innerHTML = contenido;
}

// Generar sección de pedidos con historial detallado colapsable
function generarSeccionPedidos(pedidos) {
    if (!pedidos || pedidos.length === 0) {
        return `
            <div class="empty-state" style="padding: 40px;">
                <div class="empty-state-icon">📦</div>
                <p>No hay pedidos registrados para este cliente</p>
            </div>
        `;
    }
    
    const estadoMap = {
        'pendiente': { icon: '⏳', color: '#f59e0b', label: 'Pendiente' },
        'en_proceso': { icon: '🔄', color: '#3b82f6', label: 'En Proceso' },
        'atendido': { icon: '✅', color: '#22c55e', label: 'Atendido' },
        'cancelado': { icon: '❌', color: '#ef4444', label: 'Cancelado' }
    };
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--avellano-red); margin-bottom: 15px;">📦 Historial de Pedidos</h4>
    `;
    
    pedidos.forEach((pedido, index) => {
        const estadoInfo = estadoMap[pedido.estado] || { icon: '❓', color: '#999', label: pedido.estado };
        const productos = pedido.productos || [];
        const pedidoId = `pedido-${index}`;
        
        html += `
            <div class="pedido-historial-card" style="margin-bottom: 15px; background: white; border-left: 4px solid ${estadoInfo.color}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header clickeable -->
                <div onclick="togglePedidoDetalle('${pedidoId}')" style="padding: 15px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <strong style="font-size: 16px;">${pedido.idPedido}</strong>
                                <span style="background: ${estadoInfo.color}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">
                                    ${estadoInfo.icon} ${estadoInfo.label}
                                </span>
                            </div>
                            <div style="margin-top: 8px; font-size: 13px; color: #666;">
                                📋 ${productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ') || 'Sin productos'}
                            </div>
                        </div>
                        <div style="text-align: right; display: flex; align-items: center; gap: 15px;">
                            <div>
                                <div style="font-size: 18px; font-weight: bold; color: var(--avellano-red);">
                                    $${(pedido.total || 0).toLocaleString('es-CO')}
                                </div>
                                <div style="font-size: 12px; color: #666; margin-top: 3px;">
                                    ${new Date(pedido.fechaPedido).toLocaleDateString('es-CO')}
                                </div>
                            </div>
                            <div id="${pedidoId}-icon" style="font-size: 24px; color: #999; transition: transform 0.3s;">
                                ▼
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Detalle colapsable -->
                <div id="${pedidoId}" style="max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out;">
                    <div style="padding: 0 15px 15px 15px; border-top: 1px solid #e5e7eb;">`;
        
        // Timeline de estados
        if (pedido.historialEstados && pedido.historialEstados.length > 0) {
            html += `
                        <div style="margin-top: 15px;">
                            <strong style="font-size: 14px; color: #374151; display: block; margin-bottom: 15px;">
                                📊 Historial Completo de Atención
                            </strong>
                            <div style="position: relative; padding-left: 40px;">
                                <!-- Línea vertical -->
                                <div style="position: absolute; left: 15px; top: 10px; bottom: 10px; width: 2px; background: linear-gradient(to bottom, ${estadoMap['pendiente']?.color}, ${estadoMap[pedido.estado]?.color});"></div>
            `;
            
            pedido.historialEstados.forEach((cambio, idx) => {
                const estadoCambio = estadoMap[cambio.estado] || { icon: '❓', color: '#999', label: cambio.estado };
                const isFirst = idx === 0;
                const isLast = idx === pedido.historialEstados.length - 1;
                
                html += `
                                <div style="position: relative; margin-bottom: ${isLast ? '0' : '20px'}; padding: 12px; background: ${isLast ? 'linear-gradient(135deg, ' + estadoCambio.color + '15, ' + estadoCambio.color + '05)' : '#f9fafb'}; border-radius: 8px; border: 1px solid ${estadoCambio.color}30;">
                                    <!-- Punto en la línea -->
                                    <div style="position: absolute; left: -34px; top: 15px; width: 12px; height: 12px; background: ${estadoCambio.color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 2px ${estadoCambio.color}40;"></div>
                                    
                                    <div style="display: flex; align-items: start; gap: 12px;">
                                        <div style="font-size: 28px; line-height: 1;">
                                            ${estadoCambio.icon}
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: ${estadoCambio.color}; font-size: 14px; margin-bottom: 4px;">
                                                ${estadoCambio.label}
                                            </div>
                                            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                                                📅 ${new Date(cambio.fecha).toLocaleString('es-CO', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            ${cambio.operadorEmail ? `
                                                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding: 6px 10px; background: white; border-radius: 6px; width: fit-content;">
                                                    <span style="font-size: 16px;">👤</span>
                                                    <div>
                                                        <div style="font-size: 11px; color: #999;">Atendido por:</div>
                                                        <div style="font-size: 12px; font-weight: 500; color: #374151;">
                                                            ${cambio.operadorEmail}
                                                        </div>
                                                    </div>
                                                </div>
                                            ` : `
                                                <div style="font-size: 11px; color: #999; padding: 4px 8px; background: white; border-radius: 4px; width: fit-content;">
                                                    ⚙️ Sistema automático
                                                </div>
                                            `}
                                            ${cambio.nota ? `
                                                <div style="margin-top: 8px; padding: 8px 12px; background: white; border-left: 3px solid ${estadoCambio.color}; border-radius: 4px;">
                                                    <div style="font-size: 11px; color: #999; margin-bottom: 2px;">💬 Nota:</div>
                                                    <div style="font-size: 12px; color: #374151; font-style: italic;">
                                                        ${cambio.nota}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                `;
            });
            
            html += `
                            </div>
                        </div>
            `;
        } else {
            html += `
                        <div style="margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 6px; text-align: center; color: #999;">
                            No hay historial de estados disponible
                        </div>
            `;
        }
        
        // Motivo de cancelación
        if (pedido.estado === 'cancelado' && pedido.notasCancelacion) {
            html += `
                        <div style="margin-top: 15px; padding: 12px; background: #fee2e2; border-radius: 6px; border-left: 3px solid #ef4444;">
                            <div style="display: flex; align-items: start; gap: 10px;">
                                <span style="font-size: 24px;">❌</span>
                                <div>
                                    <div style="font-size: 13px; font-weight: 600; color: #dc2626; margin-bottom: 4px;">
                                        Motivo de Cancelación:
                                    </div>
                                    <div style="font-size: 13px; color: #991b1b;">
                                        ${pedido.notasCancelacion}
                                    </div>
                                </div>
                            </div>
                        </div>
            `;
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

// Función para expandir/colapsar detalles del pedido
function togglePedidoDetalle(pedidoId) {
    const detalle = document.getElementById(pedidoId);
    const icon = document.getElementById(pedidoId + '-icon');
    
    if (detalle.style.maxHeight && detalle.style.maxHeight !== '0px') {
        // Colapsar
        detalle.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Expandir
        detalle.style.maxHeight = detalle.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    }
}

// Generar sección de registros
function generarSeccionRegistros(registros, conversacion) {
    const fechaRegistro = conversacion.clienteInfo?.fechaRegistro;
    const ultimaInteraccion = conversacion.ultimaInteraccion;
    const totalMensajes = conversacion.totalMensajes;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--avellano-red); margin-bottom: 15px;">📝 Información de Registro</h4>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div class="info-item-registro">
                        <div style="font-size: 13px; color: #666; margin-bottom: 5px;">📅 Fecha de Registro</div>
                        <div style="font-size: 16px; font-weight: 500; color: #1f2937;">
                            ${fechaRegistro ? new Date(fechaRegistro).toLocaleString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'No disponible'}
                        </div>
                    </div>
                    
                    <div class="info-item-registro">
                        <div style="font-size: 13px; color: #666; margin-bottom: 5px;">🕐 Última Interacción</div>
                        <div style="font-size: 16px; font-weight: 500; color: #1f2937;">
                            ${ultimaInteraccion}
                        </div>
                    </div>
                </div>
                
                <div style="padding: 15px; background: #f8f9fa; border-radius: 6px; margin-top: 15px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 13px; color: #666;">💬 Total de Interacciones</div>
                            <div style="font-size: 24px; font-weight: bold; color: var(--avellano-red); margin-top: 5px;">
                                ${totalMensajes}
                            </div>
                        </div>
                        <div style="font-size: 48px; opacity: 0.3;">📊</div>
                    </div>
                </div>
    `;
    
    if (registros && registros.length > 0) {
        html += `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <strong style="font-size: 14px; color: #666;">📋 Eventos de Registro:</strong>
                    <div style="margin-top: 10px;">
        `;
        
        registros.forEach(registro => {
            html += `
                <div style="padding: 12px; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 13px; font-weight: 500; color: #166534;">
                        ${registro.contenido || 'Registro completado'}
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        ${new Date(registro.timestamp).toLocaleString('es-CO')}
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Generar sección de contactos
function generarSeccionContactos(contactos) {
    if (!contactos || contactos.length === 0) {
        return `
            <div class="empty-state" style="padding: 40px;">
                <div class="empty-state-icon">📞</div>
                <p>No hay solicitudes de contacto registradas</p>
            </div>
        `;
    }
    
    let html = `
        <div style="margin-bottom: 20px;">
            <h4 style="color: var(--avellano-red); margin-bottom: 15px;">📞 Solicitudes de Contacto</h4>
    `;
    
    contactos.forEach(contacto => {
        html += `
            <div style="margin-bottom: 15px; padding: 15px; background: white; border-left: 4px solid #8b5cf6; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="margin-bottom: 8px;">
                    <span style="background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">
                        📞 Contacto con Asesor
                    </span>
                </div>
                <div style="font-size: 14px; color: #374151; margin: 10px 0;">
                    ${contacto.contenido || 'Solicitud de contacto'}
                </div>
                <div style="font-size: 12px; color: #666;">
                    📅 ${new Date(contacto.timestamp).toLocaleString('es-CO')}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

// Ver detalle de cliente en modal
async function verDetalleCliente(telefono) {
    try {
        const response = await fetchWithAuth(`${API_URL}/clientes/${telefono}`);
        const result = await response.json();
        
        if (result.success) {
            const cliente = result.data;
            
            const responsableMap = {
                'coordinador_masivos': 'Coordinador de Masivos',
                'director_comercial': 'Director Comercial',
                'ejecutivo_horecas': 'Ejecutivo Horecas',
                'mayorista': 'Coordinador Mayoristas'
            };
            
            const modalContent = `
                <div class="cliente-detalle-modern">
                    <!-- Header mejorado -->
                    <div class="cliente-header-new">
                        <div class="header-icon-large">
                            ${cliente.tipoCliente === 'hogar' ? '🏠' : '🏢'}
                        </div>
                        <div class="header-content">
                            <h2 class="negocio-nombre">${cliente.nombreNegocio || 'Sin nombre'}</h2>
                            <div class="header-badges-new">
                                <span class="badge-pill badge-tipo">${cliente.tipoCliente.replace(/_/g, ' ')}</span>
                                <span class="badge-pill badge-resp">${responsableMap[cliente.responsable] || 'Sin asignar'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sección de contacto destacada -->
                    <div class="section-contacto">
                        <div class="contact-item">
                            <div class="contact-icon">📱</div>
                            <div class="contact-details">
                                <span class="contact-label">Teléfono</span>
                                <span class="contact-value">${cliente.telefono}</span>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-icon">👤</div>
                            <div class="contact-details">
                                <span class="contact-label">Persona de Contacto</span>
                                <span class="contact-value">${cliente.personaContacto || 'No especificado'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Grid de información -->
                    <div class="info-grid-new">
                        <!-- Ubicación -->
                        <div class="info-section">
                            <div class="section-header">
                                <span class="section-icon">📍</span>
                                <h3 class="section-title">Ubicación</h3>
                            </div>
                            <div class="section-body">
                                <div class="info-row">
                                    <span class="info-label">Ciudad:</span>
                                    <span class="info-value">${cliente.ciudad || 'No especificada'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Dirección:</span>
                                    <span class="info-value">${cliente.direccion || 'No especificada'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Fechas -->
                        <div class="info-section">
                            <div class="section-header">
                                <span class="section-icon">📅</span>
                                <h3 class="section-title">Actividad</h3>
                            </div>
                            <div class="section-body">
                                <div class="info-row">
                                    <span class="info-label">Registro:</span>
                                    <span class="info-value">${new Date(cliente.fechaRegistro).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Última interacción:</span>
                                    <span class="info-value">${new Date(cliente.ultimaInteraccion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Productos destacados -->
                    <div class="productos-section">
                        <div class="section-header">
                            <span class="section-icon">📦</span>
                            <h3 class="section-title">Productos de Interés</h3>
                        </div>
                        <div class="productos-content">
                            <p class="productos-text">${cliente.productosInteres || 'No se han especificado productos de interés'}</p>
                        </div>
                    </div>
                    
                    <!-- Stats destacadas -->
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-icon">💬</div>
                            <div class="stat-info">
                                <span class="stat-value">${cliente.conversaciones || 0}</span>
                                <span class="stat-label">Conversaciones</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🔖</div>
                            <div class="stat-info">
                                <span class="stat-value">${cliente._id.substring(0, 8)}...</span>
                                <span class="stat-label">ID Cliente</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('modalTitle').textContent = `${cliente.nombreNegocio || cliente.telefono}`;
            document.getElementById('modalBody').innerHTML = modalContent;
            document.getElementById('modalConversacion').classList.add('active');
        }
    } catch (error) {
        console.error('Error cargando detalle de cliente:', error);
        alert('❌ Error cargando detalle del cliente');
    }
}

// Actualizar link de WhatsApp cuando se edita el mensaje
function actualizarLinkWhatsApp(telefono) {
    const textarea = document.getElementById('mensajeCliente');
    const whatsappLink = document.getElementById('whatsappLink');
    
    if (textarea && whatsappLink) {
        const mensajeEditado = textarea.value;
        const mensajeEncoded = encodeURIComponent(mensajeEditado);
        const nuevoLink = `https://wa.me/${telefono}?text=${mensajeEncoded}`;
        whatsappLink.href = nuevoLink;
    }
}

// Copiar mensaje al portapapeles
function copiarMensaje() {
    const textarea = document.getElementById('mensajeCliente');
    if (textarea) {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // Para móviles
        
        navigator.clipboard.writeText(textarea.value)
            .then(() => {
                // Cambiar temporalmente el texto del botón
                const btn = event.target;
                const textoOriginal = btn.innerHTML;
                btn.innerHTML = '✅ ¡Copiado!';
                btn.style.backgroundColor = '#10b981';
                
                setTimeout(() => {
                    btn.innerHTML = textoOriginal;
                    btn.style.backgroundColor = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Error copiando:', err);
                // Fallback para navegadores antiguos
                try {
                    document.execCommand('copy');
                    alert('✅ Mensaje copiado al portapapeles');
                } catch (e) {
                    alert('❌ No se pudo copiar el mensaje');
                }
            });
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
                        ${result.data.map(user => {
                            // Determinar el texto del rol a mostrar
                            let rolTexto = '';
                            if (user.rol === 'administrador') {
                                rolTexto = 'Administrador';
                            } else if (user.rol === 'soporte') {
                                rolTexto = 'Soporte';
                            } else if (user.rol === 'operador') {
                                const tipoMap = {
                                    'mayorista': 'Mayorista',
                                    'director_comercial': 'Director Comercial',
                                    'coordinador_masivos': 'Coordinador de Masivos',
                                    'ejecutivo_horecas': 'Ejecutivo Horecas'
                                };
                                rolTexto = tipoMap[user.tipoOperador] || 'Operador';
                            }
                            
                            return `
                            <tr>
                                <td>${user.nombre || '-'}</td>
                                <td>${user.email}</td>
                                <td>
                                    <select class="rol-selector" onchange="changeUserRole('${user._id}', this.value)" ${user.rol === 'administrador' ? 'disabled' : ''}>
                                        <option value="administrador" ${user.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                                        <option value="mayorista" ${user.tipoOperador === 'mayorista' ? 'selected' : ''}>Mayorista</option>
                                        <option value="director_comercial" ${user.tipoOperador === 'director_comercial' ? 'selected' : ''}>Director Comercial</option>
                                        <option value="coordinador_masivos" ${user.tipoOperador === 'coordinador_masivos' ? 'selected' : ''}>Coordinador de Masivos</option>
                                        <option value="ejecutivo_horecas" ${user.tipoOperador === 'ejecutivo_horecas' ? 'selected' : ''}>Ejecutivo Horecas</option>
                                        <option value="soporte" ${user.rol === 'soporte' ? 'selected' : ''}>Soporte</option>
                                    </select>
                                </td>
                                <td><span class="badge ${user.activo ? 'badge-success' : 'badge-danger'}">${user.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
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
                        `}).join('')}
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
    
    // Mapear el valor del select al rol y tipoOperador
    let rol = 'operador';
    let tipoOperador = null;
    
    const roleMap = {
        'administrador': { rol: 'administrador', tipoOperador: null },
        'soporte': { rol: 'soporte', tipoOperador: null },
        'mayorista': { rol: 'operador', tipoOperador: 'mayorista' },
        'director_comercial': { rol: 'operador', tipoOperador: 'director_comercial' },
        'coordinador_masivos': { rol: 'operador', tipoOperador: 'coordinador_masivos' },
        'ejecutivo_horecas': { rol: 'operador', tipoOperador: 'ejecutivo_horecas' }
    };
    
    const roleConfig = roleMap[newRole];
    if (!roleConfig) {
        alert('❌ Rol no válido');
        loadUsuarios();
        return;
    }
    
    rol = roleConfig.rol;
    tipoOperador = roleConfig.tipoOperador;
    
    const rolTexto = {
        'administrador': 'Administrador',
        'soporte': 'Soporte',
        'mayorista': 'Mayorista',
        'director_comercial': 'Director Comercial',
        'coordinador_masivos': 'Coordinador de Masivos',
        'ejecutivo_horecas': 'Ejecutivo Horecas'
    }[newRole] || newRole.toUpperCase();
    
    if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${rolTexto}?`)) {
        loadUsuarios() // Recargar para resetear el select
        return
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/usuarios/${userId}/rol`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rol, tipoOperador })
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Rol actualizado exitosamente a ${rolTexto}`)
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

// Buscar usuarios
function buscarUsuarios() {
    const searchTerm = document.getElementById('searchUsuarios').value.toLowerCase();
    const container = document.getElementById('usuarios-content');
    
    // Obtener todas las filas de la tabla
    const rows = container.querySelectorAll('tbody tr');
    
    if (rows.length === 0) return;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ===== GESTIÓN DE AGREGAR USUARIOS =====

// Mostrar modal para agregar usuarios
function mostrarModalAgregarUsuario() {
    if (!hasRole('administrador')) {
        alert('No tienes permisos para agregar usuarios');
        return;
    }
    
    document.getElementById('modalAgregarUsuario').style.display = 'flex';
    limpiarFormularioUsuario();
    cambiarMetodo('individual');
}

// Cerrar modal
function cerrarModalAgregarUsuario() {
    document.getElementById('modalAgregarUsuario').style.display = 'none';
    limpiarFormularioUsuario();
}

// Limpiar formulario
function limpiarFormularioUsuario() {
    document.getElementById('nuevo-nombre').value = '';
    document.getElementById('nuevo-email').value = '';
    document.getElementById('nuevo-password').value = '';
    document.getElementById('nuevo-rol').value = '';
    document.getElementById('archivo-csv').value = '';
    document.getElementById('preview-csv').innerHTML = '';
}

// Cambiar método (individual o CSV)
function cambiarMetodo(metodo) {
    // Actualizar botones
    document.getElementById('btn-individual').classList.remove('active');
    document.getElementById('btn-csv').classList.remove('active');
    document.getElementById(`btn-${metodo}`).classList.add('active');
    
    // Mostrar/ocultar formularios
    document.getElementById('form-individual').style.display = metodo === 'individual' ? 'block' : 'none';
    document.getElementById('form-csv').style.display = metodo === 'csv' ? 'block' : 'none';
}

// Guardar usuario individual
async function guardarUsuarioIndividual() {
    const nombre = document.getElementById('nuevo-nombre').value.trim();
    const email = document.getElementById('nuevo-email').value.trim();
    const password = document.getElementById('nuevo-password').value;
    const rolSeleccionado = document.getElementById('nuevo-rol').value;
    
    if (!nombre || !email || !password || !rolSeleccionado) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    // Mapear el valor del select al rol y tipoOperador
    const roleMap = {
        'administrador': { rol: 'administrador', tipoOperador: null },
        'soporte': { rol: 'soporte', tipoOperador: null },
        'mayorista': { rol: 'operador', tipoOperador: 'mayorista' },
        'director_comercial': { rol: 'operador', tipoOperador: 'director_comercial' },
        'coordinador_masivos': { rol: 'operador', tipoOperador: 'coordinador_masivos' },
        'ejecutivo_horecas': { rol: 'operador', tipoOperador: 'ejecutivo_horecas' }
    };
    
    const roleConfig = roleMap[rolSeleccionado];
    
    try {
        const response = await fetchWithAuth(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                email,
                password,
                rol: roleConfig.rol,
                tipoOperador: roleConfig.tipoOperador
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Usuario creado exitosamente');
            cerrarModalAgregarUsuario();
            loadUsuarios();
        } else {
            alert('❌ Error: ' + (result.error || result.message || 'No se pudo crear el usuario'));
        }
    } catch (error) {
        console.error('Error creando usuario:', error);
        alert('❌ Error de conexión');
    }
}

// Preview de CSV
function previewCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('El archivo CSV está vacío o no tiene el formato correcto');
            return;
        }
        
        const preview = document.getElementById('preview-csv');
        preview.innerHTML = `
            <div class="csv-preview-box">
                <strong>Vista previa (${lines.length - 1} usuarios detectados):</strong>
                <table class="csv-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lines.slice(1, Math.min(6, lines.length)).map(line => {
                            const [nombre, email, , rol] = line.split(',').map(s => s.trim());
                            return `
                                <tr>
                                    <td>${nombre || '-'}</td>
                                    <td>${email || '-'}</td>
                                    <td>${rol || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                        ${lines.length > 6 ? '<tr><td colspan="3" style="text-align: center; color: #666;">...</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
    };
    reader.readAsText(file);
}

// Importar usuarios desde CSV
async function importarUsuariosCSV() {
    const fileInput = document.getElementById('archivo-csv');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor selecciona un archivo CSV');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('El archivo CSV está vacío o no tiene datos');
            return;
        }
        
        // Procesar usuarios
        const usuarios = [];
        const roleMap = {
            'administrador': { rol: 'administrador', tipoOperador: null },
            'soporte': { rol: 'soporte', tipoOperador: null },
            'mayorista': { rol: 'operador', tipoOperador: 'mayorista' },
            'director_comercial': { rol: 'operador', tipoOperador: 'director_comercial' },
            'coordinador_masivos': { rol: 'operador', tipoOperador: 'coordinador_masivos' },
            'ejecutivo_horecas': { rol: 'operador', tipoOperador: 'ejecutivo_horecas' }
        };
        
        for (let i = 1; i < lines.length; i++) {
            const [nombre, email, password, rolSeleccionado] = lines[i].split(',').map(s => s.trim());
            
            if (!nombre || !email || !password || !rolSeleccionado) {
                console.warn(`Línea ${i + 1} incompleta, omitida`);
                continue;
            }
            
            const roleConfig = roleMap[rolSeleccionado];
            if (!roleConfig) {
                console.warn(`Línea ${i + 1}: rol '${rolSeleccionado}' no válido, omitida`);
                continue;
            }
            
            usuarios.push({
                nombre,
                email,
                password,
                rol: roleConfig.rol,
                tipoOperador: roleConfig.tipoOperador
            });
        }
        
        if (usuarios.length === 0) {
            alert('No se encontraron usuarios válidos en el archivo');
            return;
        }
        
        // Enviar usuarios al servidor
        try {
            const response = await fetchWithAuth(`${API_URL}/usuarios/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarios })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`✅ ${result.data.creados} usuarios creados exitosamente${result.data.errores > 0 ? `\n⚠️ ${result.data.errores} usuarios con errores` : ''}`);
                cerrarModalAgregarUsuario();
                loadUsuarios();
            } else {
                alert('❌ Error: ' + (result.error || result.message || 'No se pudieron importar los usuarios'));
            }
        } catch (error) {
            console.error('Error importando usuarios:', error);
            alert('❌ Error de conexión');
        }
    };
    
    reader.readAsText(file);
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
    window.location.href = '/pages/login.html';
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
    
    // Cargar datos del tab
    if (tabName === 'usuarios') {
        loadUsuarios();
    } else if (tabName === 'eventos') {
        loadEventos();
    }
}

// Cargar todo
function loadAll() {
    console.log('🔄 Actualizando datos...', new Date().toLocaleTimeString());
    loadStats();
    loadClientes();
    
    // Solo cargar si el usuario tiene permisos
    if (hasRole('administrador', 'operador', 'soporte')) {
        loadPedidos();
        loadConversaciones();
    }
    
    // Cargar eventos si es admin o soporte
    if (hasRole('administrador', 'soporte')) {
        // Solo recargar si la pestaña de eventos está activa
        const eventosTab = document.getElementById('eventos-tab');
        if (eventosTab && eventosTab.classList.contains('active')) {
            loadEventos();
        }
    }
}

// ==================== FUNCIONES DE BÚSQUEDA Y FILTROS ====================

// Variables globales para almacenar datos originales
let clientesOriginales = [];
let pedidosOriginales = [];
let conversacionesOriginales = [];

// ===== BÚSQUEDA Y FILTROS PARA CLIENTES =====
function buscarClientes() {
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    
    if (!searchTerm) {
        // Si no hay término de búsqueda, mostrar todos los clientes según el filtro actual
        mostrarClientesFiltrados(tipoFiltroActual);
        return;
    }
    
    const filtered = todosClientes.filter(cliente => {
        return (
            (cliente.telefono || '').toLowerCase().includes(searchTerm) ||
            (cliente.nombreNegocio || '').toLowerCase().includes(searchTerm) ||
            (cliente.ciudad || '').toLowerCase().includes(searchTerm) ||
            (cliente.nombre || '').toLowerCase().includes(searchTerm)
        );
    });
    
    renderizarClientes(filtered);
}

function aplicarFiltrosClientes() {
    let filtered = [...todosClientes];
    
    const ordenarFecha = document.getElementById('ordenarFechaCliente').checked;
    
    if (ordenarFecha) {
        filtered.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
    }
    
    // Aplicar búsqueda también
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(cliente => {
            return (
                (cliente.telefono || '').toLowerCase().includes(searchTerm) ||
                (cliente.nombreNegocio || '').toLowerCase().includes(searchTerm) ||
                (cliente.ciudad || '').toLowerCase().includes(searchTerm)
            );
        });
    }
    
    renderizarClientes(filtered);
}

function renderizarClientes(clientes) {
    const container = document.getElementById('clientes-content');
    const responsableMap = {
        'coordinador_masivos': 'Coord. Masivos',
        'director_comercial': 'Dir. Comercial',
        'ejecutivo_horecas': 'Ejec. Horecas',
        'mayorista': 'Mayorista'
    };
    
    if (clientes.length > 0) {
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Teléfono</th>
                        <th>Tipo</th>
                        <th>Nombre Negocio</th>
                        <th>Ciudad</th>
                        <th>Responsable</th>
                        <th>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientes.map(cliente => {
                        const responsableTexto = cliente.responsable 
                            ? responsableMap[cliente.responsable] || cliente.responsable 
                            : '-';
                        
                        return `
                            <tr class="clickable-row" onclick="verDetalleCliente('${cliente.telefono}')">
                                <td>${cliente.telefono || '-'}</td>
                                <td><span class="badge badge-${cliente.tipoCliente}">${cliente.tipoCliente.toUpperCase()}</span></td>
                                <td>${cliente.nombreNegocio || '-'}</td>
                                <td>${cliente.ciudad || '-'}</td>
                                <td><span class="badge badge-info">${responsableTexto}</span></td>
                                <td>${new Date(cliente.fechaRegistro).toLocaleDateString('es-CO')}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No se encontraron clientes con los criterios de búsqueda</p>
            </div>
        `;
    }
}

// ===== BÚSQUEDA Y FILTROS PARA PEDIDOS =====
function buscarPedidos() {
    const searchTerm = document.getElementById('searchPedidos').value.toLowerCase();
    
    if (!searchTerm) {
        // Si no hay término de búsqueda, mostrar todos los pedidos según el estado actual
        mostrarPedidosFiltrados(estadoFiltroActual);
        return;
    }
    
    // Filtrar pedidos por búsqueda
    const filtered = todosPedidos.filter(pedido => {
        return (
            (pedido.idPedido || '').toLowerCase().includes(searchTerm) ||
            (pedido.nombreNegocio || '').toLowerCase().includes(searchTerm) ||
            (pedido.productos || []).some(p => p.nombre.toLowerCase().includes(searchTerm))
        );
    });
    
    // Renderizar directamente los pedidos filtrados
    renderizarPedidos(filtered);
}

// Función auxiliar para renderizar pedidos
function renderizarPedidos(pedidosFiltrados) {
    const container = document.getElementById('pedidos-content');
    
    if (pedidosFiltrados.length > 0) {
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID Pedido</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosFiltrados.map(pedido => {
                        const productos = Array.isArray(pedido.productos) 
                            ? pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')
                            : pedido.productos;
                        
                        const estadoClass = {
                            'pendiente': 'badge-warning',
                            'en_proceso': 'badge-info',
                            'atendido': 'badge-success',
                            'cancelado': 'badge-danger'
                        }[pedido.estado] || 'badge-secondary';
                        
                        const estadoTexto = {
                            'pendiente': 'PENDIENTE',
                            'en_proceso': 'EN PROCESO',
                            'atendido': 'ATENDIDO',
                            'cancelado': 'CANCELADO'
                        }[pedido.estado] || pedido.estado.toUpperCase();
                        
                        return `
                            <tr class="clickable-row" onclick="verDetallePedido('${pedido._id}')">
                                <td><strong>${pedido.idPedido || 'N/A'}</strong></td>
                                <td>${pedido.nombreNegocio || pedido.personaContacto || '-'}</td>
                                <td style="max-width: 350px; white-space: normal;">${productos}</td>
                                <td><strong>$${(pedido.total || 0).toLocaleString('es-CO')}</strong></td>
                                <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
                                <td>${new Date(pedido.fechaPedido).toLocaleDateString('es-CO')}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No se encontraron pedidos con los criterios de búsqueda</p>
            </div>
        `;
    }
}

function aplicarFiltrosPedidos() {
    let filtered = [...todosPedidos];
    
    const ordenarMonto = document.getElementById('filtroPedidoMonto').checked;
    const ordenarFecha = document.getElementById('filtroPedidoFecha').checked;
    
    if (ordenarMonto) {
        filtered.sort((a, b) => b.total - a.total);
    } else if (ordenarFecha) {
        filtered.sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido));
    }
    
    // Aplicar búsqueda también
    const searchTerm = document.getElementById('searchPedidos').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(pedido => {
            return (
                (pedido.idPedido || '').toLowerCase().includes(searchTerm) ||
                (pedido.nombreNegocio || '').toLowerCase().includes(searchTerm) ||
                (pedido.productos || []).some(p => p.nombre.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    mostrarPedidosFiltrados(estadoFiltroActual, filtered);
}

// ===== BÚSQUEDA Y FILTROS PARA CONVERSACIONES =====
function buscarConversaciones() {
    const searchTerm = document.getElementById('searchConversaciones').value.toLowerCase();
    const container = document.getElementById('conversaciones-content');
    
    // Obtener conversaciones desde el DOM actual
    const conversacionCards = Array.from(container.querySelectorAll('.conversacion-card'));
    
    conversacionCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function aplicarFiltrosConversaciones() {
    // Esta función recargaría las conversaciones con los filtros aplicados
    loadConversaciones();
}

// ===== GESTIÓN DE EVENTOS =====
let todosEventos = [];
let clientesParaEvento = [];

// Cargar eventos
async function loadEventos() {
    const container = document.getElementById('eventos-content');
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <p>Cargando eventos...</p>
        </div>
    `;
    
    try {
        const response = await fetchWithAuth(`${API_URL}/eventos`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            todosEventos = result.data;
            mostrarEventos(todosEventos);
        } else {
            todosEventos = [];
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No hay eventos creados aún</p>
                    <button class="btn-primary" onclick="mostrarFormularioEvento()">+ Crear Primer Evento</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p>Error cargando eventos</p>
            </div>
        `;
    }
}

// Mostrar eventos en tabla
function mostrarEventos(eventos) {
    const container = document.getElementById('eventos-content');
    
    if (eventos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No se encontraron eventos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Mensaje</th>
                    <th>Destinatarios</th>
                    <th>Enviados</th>
                    <th>Estado</th>
                    <th>Fecha Creación</th>
                </tr>
            </thead>
            <tbody>
                ${eventos.map(evento => {
                    const estadoBadge = {
                        'borrador': 'badge-info',
                        'enviado': 'badge-success',
                        'enviando': 'badge-warning',
                        'error': 'badge-danger'
                    }[evento.estado] || 'badge-info';
                    
                    return `
                        <tr class="evento-row-clickable" onclick="verDetalleEvento('${evento._id}')" style="cursor: pointer;">
                            <td><strong>${evento.nombre}</strong></td>
                            <td>${evento.mensaje.substring(0, 50)}${evento.mensaje.length > 50 ? '...' : ''}</td>
                            <td>${evento.destinatarios?.total || 0}</td>
                            <td>${evento.destinatarios?.enviados || 0}</td>
                            <td><span class="badge ${estadoBadge}">${evento.estado.toUpperCase()}</span></td>
                            <td>${new Date(evento.fechaCreacion).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Mostrar formulario de evento
async function mostrarFormularioEvento() {
    document.getElementById('form-evento').style.display = 'block';
    document.getElementById('form-evento-titulo').textContent = 'Crear Nuevo Evento';
    
    // Limpiar formulario
    document.getElementById('evento-nombre').value = '';
    document.getElementById('evento-mensaje').value = '';
    document.getElementById('evento-imagen').value = '';
    document.getElementById('preview-imagen').innerHTML = '';
    document.querySelector('input[name="destinatario"][value="todos"]').checked = true;
    
    // Desmarcar todos los checkboxes
    document.querySelectorAll('.ciudad-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.tipo-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filtro-ciudad-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filtro-tipo-checkbox').forEach(cb => cb.checked = false);
    
    // Cargar clientes para calcular destinatarios
    await cargarClientesParaEvento();
    actualizarDestinatarios();
}

// Cerrar formulario
function cerrarFormularioEvento() {
    document.getElementById('form-evento').style.display = 'none';
}

// Cargar clientes disponibles
async function cargarClientesParaEvento() {
    try {
        const response = await fetchWithAuth(`${API_URL}/clientes`);
        const result = await response.json();
        
        if (result.success && result.data) {
            clientesParaEvento = result.data;
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

// Actualizar contador de destinatarios
function actualizarDestinatarios() {
    const tipoDestinatario = document.querySelector('input[name="destinatario"]:checked').value;
    
    // Ocultar todos los selectores
    document.getElementById('selector-ciudad').style.display = 'none';
    document.getElementById('selector-tipo').style.display = 'none';
    document.getElementById('selector-personalizado').style.display = 'none';
    
    let destinatarios = [];
    
    if (tipoDestinatario === 'todos') {
        destinatarios = clientesParaEvento;
    } else if (tipoDestinatario === 'hogar') {
        destinatarios = clientesParaEvento.filter(c => c.tipoCliente === 'hogar');
    } else if (tipoDestinatario === 'ciudad') {
        document.getElementById('selector-ciudad').style.display = 'block';
        const ciudadesSeleccionadas = Array.from(document.querySelectorAll('.ciudad-checkbox:checked')).map(cb => cb.value);
        if (ciudadesSeleccionadas.length > 0) {
            destinatarios = clientesParaEvento.filter(c => ciudadesSeleccionadas.includes(c.ciudad));
        }
    } else if (tipoDestinatario === 'tipo') {
        document.getElementById('selector-tipo').style.display = 'block';
        const tiposSeleccionados = Array.from(document.querySelectorAll('.tipo-checkbox:checked')).map(cb => cb.value);
        if (tiposSeleccionados.length > 0) {
            destinatarios = clientesParaEvento.filter(c => tiposSeleccionados.includes(c.tipoCliente));
        }
    } else if (tipoDestinatario === 'personalizado') {
        document.getElementById('selector-personalizado').style.display = 'block';
        const ciudades = Array.from(document.querySelectorAll('.filtro-ciudad-checkbox:checked')).map(cb => cb.value);
        const tipos = Array.from(document.querySelectorAll('.filtro-tipo-checkbox:checked')).map(cb => cb.value);
        
        destinatarios = clientesParaEvento.filter(c => {
            const cumpleCiudad = ciudades.length === 0 || ciudades.includes(c.ciudad);
            const cumpleTipo = tipos.length === 0 || tipos.includes(c.tipoCliente);
            return cumpleCiudad && cumpleTipo;
        });
    }
    
    document.getElementById('count-destinatarios').textContent = `${destinatarios.length} destinatarios seleccionados`;
}

// Funciones para seleccionar todos
function seleccionarTodasCiudades() {
    const checkboxes = document.querySelectorAll('.ciudad-checkbox');
    const todosSeleccionados = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !todosSeleccionados;
    });
    
    actualizarDestinatarios();
}

function seleccionarTodosTipos() {
    const checkboxes = document.querySelectorAll('.tipo-checkbox');
    const todosSeleccionados = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !todosSeleccionados;
    });
    
    actualizarDestinatarios();
}

function seleccionarTodasCiudadesPersonalizado() {
    const checkboxes = document.querySelectorAll('.filtro-ciudad-checkbox');
    const todosSeleccionados = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !todosSeleccionados;
    });
    
    actualizarDestinatarios();
}

function seleccionarTodosTiposPersonalizado() {
    const checkboxes = document.querySelectorAll('.filtro-tipo-checkbox');
    const todosSeleccionados = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !todosSeleccionados;
    });
    
    actualizarDestinatarios();
}

// Preview de imagen
function previewImagen(event) {
    const preview = document.getElementById('preview-imagen');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 300px; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Guardar y enviar evento
async function guardarEvento() {
    const nombre = document.getElementById('evento-nombre').value.trim();
    const mensaje = document.getElementById('evento-mensaje').value.trim();
    const tipoDestinatario = document.querySelector('input[name="destinatario"]:checked').value;
    const imagenFile = document.getElementById('evento-imagen').files[0];
    
    if (!nombre || !mensaje) {
        alert('Por favor completa el nombre y el mensaje del evento');
        return;
    }
    
    // Obtener filtros según tipo
    let filtros = { tipo: tipoDestinatario };
    
    if (tipoDestinatario === 'ciudad') {
        filtros.ciudades = Array.from(document.querySelectorAll('.ciudad-checkbox:checked')).map(cb => cb.value);
        if (filtros.ciudades.length === 0) {
            alert('Selecciona al menos una ciudad');
            return;
        }
    } else if (tipoDestinatario === 'tipo') {
        filtros.tiposCliente = Array.from(document.querySelectorAll('.tipo-checkbox:checked')).map(cb => cb.value);
        if (filtros.tiposCliente.length === 0) {
            alert('Selecciona al menos un tipo de cliente');
            return;
        }
    } else if (tipoDestinatario === 'personalizado') {
        filtros.ciudades = Array.from(document.querySelectorAll('.filtro-ciudad-checkbox:checked')).map(cb => cb.value);
        filtros.tiposCliente = Array.from(document.querySelectorAll('.filtro-tipo-checkbox:checked')).map(cb => cb.value);
        
        if (filtros.ciudades.length === 0 && filtros.tiposCliente.length === 0) {
            alert('Selecciona al menos una ciudad o un tipo de cliente en modo personalizado');
            return;
        }
    }
    
    // Crear FormData para enviar con imagen
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('mensaje', mensaje);
    formData.append('filtros', JSON.stringify(filtros));
    if (imagenFile) {
        formData.append('imagen', imagenFile);
    }
    
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/eventos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Evento creado y enviado a ${result.data.destinatarios.total} destinatarios`);
            cerrarFormularioEvento();
            loadEventos();
        } else {
            alert('Error creando evento: ' + (result.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error guardando evento:', error);
        alert('Error al guardar el evento');
    }
}

// Ver detalle de evento
async function verDetalleEvento(eventoId) {
    try {
        const response = await fetchWithAuth(`${API_URL}/eventos/${eventoId}`);
        const result = await response.json();
        
        if (result.success) {
            const evento = result.data;
            
            // Crear modal con toda la información
            const modalHTML = `
                <div class="modal-overlay-evento" onclick="cerrarModalEvento()">
                    <div class="modal-content-evento" onclick="event.stopPropagation()">
                        <div class="modal-header-evento">
                            <h2>📋 Detalles del Evento</h2>
                            <button class="modal-close-btn" onclick="cerrarModalEvento()">✕</button>
                        </div>
                        
                        <div class="modal-body-evento">
                            <div class="evento-info-section">
                                <div class="info-row">
                                    <span class="info-label">📝 Nombre:</span>
                                    <span class="info-value"><strong>${evento.nombre}</strong></span>
                                </div>
                                
                                <div class="info-row">
                                    <span class="info-label">💬 Mensaje:</span>
                                    <div class="info-value mensaje-completo">${evento.mensaje.replace(/\n/g, '<br>')}</div>
                                </div>
                                
                                ${evento.imagen ? `
                                    <div class="info-row">
                                        <span class="info-label">🖼️ Imagen:</span>
                                        <div class="info-value">
                                            <img src="${evento.imagen}" alt="Imagen del evento" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="info-row">
                                    <span class="info-label">📊 Estado:</span>
                                    <span class="info-value">
                                        <span class="badge ${
                                            evento.estado === 'enviado' ? 'badge-success' :
                                            evento.estado === 'enviando' ? 'badge-warning' :
                                            evento.estado === 'error' ? 'badge-danger' :
                                            'badge-info'
                                        }">${evento.estado.toUpperCase()}</span>
                                    </span>
                                </div>
                                
                                <div class="info-row">
                                    <span class="info-label">👥 Total Destinatarios:</span>
                                    <span class="info-value"><strong>${evento.destinatarios?.total || 0}</strong></span>
                                </div>
                                
                                <div class="info-row">
                                    <span class="info-label">✅ Enviados:</span>
                                    <span class="info-value"><strong style="color: #28a745;">${evento.destinatarios?.enviados || 0}</strong></span>
                                </div>
                                
                                <div class="info-row">
                                    <span class="info-label">📅 Fecha de Creación:</span>
                                    <span class="info-value">${new Date(evento.fechaCreacion).toLocaleString('es-CO', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                                
                                ${evento.creador ? `
                                    <div class="info-row">
                                        <span class="info-label">👤 Creado por:</span>
                                        <span class="info-value">${evento.creador.nombre || evento.creador.email || 'Sistema'}</span>
                                    </div>
                                ` : ''}
                                
                                ${evento.filtros ? `
                                    <div class="info-row">
                                        <span class="info-label">🎯 Filtros Aplicados:</span>
                                        <div class="info-value">
                                            ${evento.filtros.tipoCliente ? `<span class="filter-tag">Tipo: ${evento.filtros.tipoCliente}</span>` : ''}
                                            ${evento.filtros.ciudad ? `<span class="filter-tag">Ciudad: ${evento.filtros.ciudad}</span>` : ''}
                                            ${evento.filtros.ciudades?.length ? `<span class="filter-tag">Ciudades: ${evento.filtros.ciudades.join(', ')}</span>` : ''}
                                            ${evento.filtros.tipos?.length ? `<span class="filter-tag">Tipos: ${evento.filtros.tipos.join(', ')}</span>` : ''}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${evento.destinatarios?.lista?.length > 0 ? `
                                    <div class="info-row">
                                        <span class="info-label">📱 Números a los que se envió (${evento.destinatarios.lista.length}):</span>
                                        <div class="info-value">
                                            <div class="destinatarios-lista">
                                                ${evento.destinatarios.lista.map(dest => `
                                                    <div class="destinatario-item ${dest.enviado ? 'enviado' : 'pendiente'}">
                                                        <div class="destinatario-info">
                                                            <span class="destinatario-telefono">${dest.telefono}</span>
                                                            ${dest.nombreNegocio ? `<span class="destinatario-nombre">${dest.nombreNegocio}</span>` : ''}
                                                            <span class="destinatario-tipo">${dest.tipoCliente || 'N/A'}</span>
                                                            ${dest.ciudad ? `<span class="destinatario-ciudad">📍 ${dest.ciudad}</span>` : ''}
                                                        </div>
                                                        <div class="destinatario-status">
                                                            ${dest.enviado ? 
                                                                `<span class="status-badge success">✅ Enviado</span>
                                                                ${dest.fechaEnvio ? `<span class="status-fecha">${new Date(dest.fechaEnvio).toLocaleString('es-CO', { 
                                                                    month: 'short', 
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}</span>` : ''}` : 
                                                                `<span class="status-badge pending">⏳ Pendiente</span>`
                                                            }
                                                            ${dest.error ? `<span class="status-badge error">❌ ${dest.error}</span>` : ''}
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="modal-footer-evento">
                            <button class="btn-secondary" onclick="cerrarModalEvento()">Cerrar</button>
                            ${evento.estado === 'borrador' ? `
                                <button class="btn-danger" onclick="eliminarEventoDesdeModal('${evento._id}')">🗑️ Eliminar</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Insertar modal en el DOM
            const modalContainer = document.createElement('div');
            modalContainer.id = 'modal-evento-detalle';
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
        }
    } catch (error) {
        console.error('Error cargando detalle:', error);
        alert('Error al cargar los detalles del evento');
    }
}

// Cerrar modal de evento
function cerrarModalEvento() {
    const modal = document.getElementById('modal-evento-detalle');
    if (modal) {
        modal.remove();
    }
}

// Eliminar evento desde el modal
async function eliminarEventoDesdeModal(eventoId) {
    if (!confirm('¿Estás seguro de eliminar este evento?')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/eventos/${eventoId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            cerrarModalEvento();
            alert('Evento eliminado exitosamente');
            loadEventos();
        }
    } catch (error) {
        console.error('Error eliminando evento:', error);
        alert('Error al eliminar el evento');
    }
}

// Eliminar evento
async function eliminarEvento(eventoId) {
    if (!confirm('¿Estás seguro de eliminar este evento?')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/eventos/${eventoId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Evento eliminado');
            loadEventos();
        }
    } catch (error) {
        console.error('Error eliminando evento:', error);
        alert('Error al eliminar el evento');
    }
}

// Buscar eventos
function buscarEventos() {
    const searchTerm = document.getElementById('searchEventos').value.toLowerCase();
    
    if (!searchTerm) {
        mostrarEventos(todosEventos);
        return;
    }
    
    const eventosFiltrados = todosEventos.filter(evento => {
        return evento.nombre.toLowerCase().includes(searchTerm) ||
               evento.mensaje.toLowerCase().includes(searchTerm);
    });
    
    mostrarEventos(eventosFiltrados);
}

// ===== FUNCIONES DE EXPORTACIÓN =====
function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
    
    // Cerrar el menú al hacer clic fuera
    if (menu.classList.contains('show')) {
        document.addEventListener('click', closeExportMenuOnClickOutside);
    } else {
        document.removeEventListener('click', closeExportMenuOnClickOutside);
    }
}

function closeExportMenuOnClickOutside(event) {
    const menu = document.getElementById('exportMenu');
    const button = event.target.closest('.export-btn');
    const menuElement = event.target.closest('.export-menu');
    
    if (!button && !menuElement) {
        menu.classList.remove('show');
        document.removeEventListener('click', closeExportMenuOnClickOutside);
    }
}

async function exportarDatos(tipo) {
    console.log(`📊 Exportando datos: ${tipo}`);
    
    // Cerrar el menú
    const menu = document.getElementById('exportMenu');
    menu.classList.remove('show');
    
    try {
        let url = '';
        let filename = '';
        
        switch(tipo) {
            case 'clientes':
                url = `${API_URL}/powerbi/clientes`;
                filename = `clientes_${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'pedidos':
                url = `${API_URL}/powerbi/pedidos`;
                filename = `pedidos_${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'conversaciones':
                url = `${API_URL}/powerbi/conversaciones`;
                filename = `conversaciones_${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'estadisticas':
                url = `${API_URL}/powerbi/estadisticas`;
                filename = `estadisticas_${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'todos':
                await exportarTodosDatos();
                return;
            default:
                console.error('Tipo de exportación no válido');
                return;
        }
        
        // Mostrar mensaje de carga
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast-loading';
        loadingToast.innerHTML = `
            <div class="toast-content">
                <span class="spinner">⏳</span>
                <span>Exportando ${tipo}...</span>
            </div>
        `;
        loadingToast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #D1132A 0%, #F2A904 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(loadingToast);
        
        // Realizar petición
        const response = await fetchWithAuth(url);
        console.log('📊 Respuesta del servidor:', response);
        
        // Verificar si la respuesta es válida
        if (!response) {
            document.body.removeChild(loadingToast);
            alert(`Error al obtener datos de ${tipo}`);
            return;
        }
        
        // Verificar si hay datos (puede ser un array vacío, eso es válido)
        const datos = response.data || [];
        const total = response.count || response.total || datos.length;
        
        console.log(`✅ ${total} registros de ${tipo} recibidos`);
        
        // Crear objeto para exportar con metadata
        const exportData = {
            tipo: tipo,
            fecha_exportacion: new Date().toISOString(),
            total_registros: total,
            datos: datos
        };
        
        // Crear y descargar archivo JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        // Remover loading y mostrar éxito
        document.body.removeChild(loadingToast);
        
        const successToast = document.createElement('div');
        successToast.className = 'toast-success';
        successToast.innerHTML = `
            <div class="toast-content">
                <span>✅</span>
                <span>Datos exportados correctamente</span>
            </div>
        `;
        successToast.style.cssText = loadingToast.style.cssText;
        successToast.style.background = 'linear-gradient(135deg, #006633 0%, #94C01F 100%)';
        document.body.appendChild(successToast);
        
        setTimeout(() => {
            document.body.removeChild(successToast);
        }, 3000);
        
        console.log(`✅ Datos exportados: ${filename}`);
    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        alert('Error al exportar datos. Por favor intenta de nuevo.');
    }
}

async function exportarTodosDatos() {
    console.log('📦 Exportando todos los datos...');
    
    try {
        const loadingToast = document.createElement('div');
        loadingToast.className = 'toast-loading';
        loadingToast.innerHTML = `
            <div class="toast-content">
                <span class="spinner">⏳</span>
                <span>Exportando todos los datos...</span>
            </div>
        `;
        loadingToast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #D1132A 0%, #F2A904 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
        `;
        document.body.appendChild(loadingToast);
        
        // Obtener todos los datos en paralelo
        const [clientesRes, pedidosRes, conversacionesRes, estadisticasRes] = await Promise.all([
            fetchWithAuth(`${API_URL}/powerbi/clientes`),
            fetchWithAuth(`${API_URL}/powerbi/pedidos`),
            fetchWithAuth(`${API_URL}/powerbi/conversaciones`),
            fetchWithAuth(`${API_URL}/powerbi/estadisticas`)
        ]);
        
        console.log('📊 Datos recibidos:', { clientesRes, pedidosRes, conversacionesRes, estadisticasRes });
        
        // Crear objeto con todos los datos (extraer solo la data)
        const todosLosDatos = {
            fecha_exportacion: new Date().toISOString(),
            clientes: {
                total: clientesRes.count || 0,
                datos: clientesRes.data || []
            },
            pedidos: {
                total: pedidosRes.count || 0,
                datos: pedidosRes.data || []
            },
            conversaciones: {
                total: conversacionesRes.total || 0,
                datos: conversacionesRes.data || []
            },
            estadisticas: estadisticasRes.data || {}
        };
        
        // Descargar como JSON
        const blob = new Blob([JSON.stringify(todosLosDatos, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `export_completo_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        document.body.removeChild(loadingToast);
        
        const successToast = document.createElement('div');
        successToast.innerHTML = `
            <div class="toast-content">
                <span>✅</span>
                <span>Exportación completa exitosa</span>
            </div>
        `;
        successToast.style.cssText = loadingToast.style.cssText;
        successToast.style.background = 'linear-gradient(135deg, #006633 0%, #94C01F 100%)';
        document.body.appendChild(successToast);
        
        setTimeout(() => {
            document.body.removeChild(successToast);
        }, 3000);
        
        console.log('✅ Exportación completa finalizada');
    } catch (error) {
        console.error('❌ Error en exportación completa:', error);
        alert('Error al exportar todos los datos. Por favor intenta de nuevo.');
    }
}

// Exponer TODAS las funciones globalmente para uso en onclick de HTML
window.toggleExportMenu = toggleExportMenu;
window.exportarDatos = exportarDatos;
window.filtrarClientesPorTipo = filtrarClientesPorTipo;
window.filtrarPedidosPorEstado = filtrarPedidosPorEstado;
window.switchTab = switchTab;
window.mostrarSeccionConversacion = mostrarSeccionConversacion;
window.verDetalleConversacion = verDetalleConversacion;
window.mostrarModalAgregarUsuario = mostrarModalAgregarUsuario;
window.verDetallePedido = verDetallePedido;
window.verDetalleEvento = verDetalleEvento;
window.cerrarModalEvento = cerrarModalEvento;
window.eliminarEventoDesdeModal = eliminarEventoDesdeModal;
window.logout = logout;
window.loadAll = loadAll;
window.buscarClientes = buscarClientes;
window.buscarPedidos = buscarPedidos;
window.buscarConversaciones = buscarConversaciones;
window.buscarEventos = buscarEventos;
window.buscarUsuarios = buscarUsuarios;
window.mostrarFormularioEvento = mostrarFormularioEvento;
window.cerrarFormularioEvento = cerrarFormularioEvento;
window.seleccionarTodasCiudades = seleccionarTodasCiudades;
window.seleccionarTodosTipos = seleccionarTodosTipos;
window.seleccionarTodasCiudadesPersonalizado = seleccionarTodasCiudadesPersonalizado;
window.seleccionarTodosTiposPersonalizado = seleccionarTodosTiposPersonalizado;
window.guardarEvento = guardarEvento;
window.cerrarModalConversacion = cerrarModalConversacion;
window.cerrarModalAgregarUsuario = cerrarModalAgregarUsuario;
window.cambiarMetodo = cambiarMetodo;
window.guardarUsuarioIndividual = guardarUsuarioIndividual;
window.importarUsuariosCSV = importarUsuariosCSV;


// Inicializar al cargar (usando evento ready para asegurar que el DOM esté listo)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  console.log('🚀 Inicializando dashboard...');
  initializeRoleBasedUI();
  loadAll();
  
  // Auto-refresh cada 30 segundos
  setInterval(loadAll, 30000);
  
  console.log('✅ Dashboard iniciado');
}
