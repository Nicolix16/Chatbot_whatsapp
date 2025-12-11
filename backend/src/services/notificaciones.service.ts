import Notificacion from '../models/Notificacion.js'
import Usuario from '../models/Usuario.js'
import type { TipoNotificacion } from '../models/Notificacion.js'

/**
 * Crea una notificación para un usuario específico
 */
export async function crearNotificacion(
  tipo: TipoNotificacion,
  mensaje: string,
  usuarioDestinoId: string,
  usuarioDestinoEmail: string,
  referencia?: { tipo: 'pedido' | 'usuario'; id: string }
) {
  try {
    const notificacion = new Notificacion({
      tipo,
      mensaje,
      usuarioDestinoId,
      usuarioDestinoEmail,
      referencia,
      leida: false
    })

    await notificacion.save()
    console.log(`✅ Notificación creada para ${usuarioDestinoEmail}: ${mensaje}`)
    return notificacion
  } catch (error) {
    console.error('❌ Error creando notificación:', error)
    throw error
  }
}

/**
 * Notifica a los operadores correspondientes cuando llega un nuevo pedido
 * Lógica: Si el cliente es mayorista → notificar operador mayorista, etc.
 */
export async function notificarNuevoPedido(
  pedidoId: string,
  tipoCliente: string,
  nombreCliente?: string
) {
  try {
    console.log(`📢 Iniciando notificación de pedido: tipo=${tipoCliente}, nombre=${nombreCliente}`)
    
    // Mapeo de tipo de cliente a tipo de operador
    // Basado en los tipos reales: 'hogar', 'tienda', 'asadero', 'restaurante_estandar', 'restaurante_premium', 'mayorista'
    const mapeoTipoOperador: Record<string, string> = {
      'hogar': 'hogares', // Usuario con rol 'hogares'
      'mayorista': 'mayorista',
      'restaurante_premium': 'ejecutivo_horecas',
      'tienda': 'director_comercial',
      'asadero': 'director_comercial',
      'restaurante_estandar': 'director_comercial'
    }

    // Determinar el tipo de operador según el tipo de cliente
    let tipoOperadorRequerido = mapeoTipoOperador[tipoCliente.toLowerCase()]

    if (!tipoOperadorRequerido) {
      console.warn(`⚠️ Tipo de cliente no mapeado: ${tipoCliente}`)
      // Intentar con el valor tal cual (por si viene 'coordinador_masivos' directamente)
      tipoOperadorRequerido = tipoCliente.toLowerCase()
    }

    console.log(`🔍 Buscando operadores con tipo: ${tipoOperadorRequerido}`)

    let usuarios: any[] = []

    // Si es hogar, buscar usuarios con rol 'hogares'
    if (tipoOperadorRequerido === 'hogares') {
      usuarios = await Usuario.find({ 
        rol: 'hogares', 
        activo: true 
      }).lean()
      console.log(`👥 Encontrados ${usuarios.length} usuarios con rol 'hogares'`)
    } else {
      // Buscar operadores del tipo correspondiente que estén activos
      usuarios = await Usuario.find({ 
        rol: 'operador', 
        tipoOperador: tipoOperadorRequerido,
        activo: true 
      }).lean()
      console.log(`👥 Encontrados ${usuarios.length} operadores tipo '${tipoOperadorRequerido}'`)
    }

    if (usuarios.length === 0) {
      console.warn(`⚠️ No se encontraron operadores activos para tipo: ${tipoOperadorRequerido}`)
      return []
    }

    const notificaciones = []

    for (const usuario of usuarios) {
      const mensaje = nombreCliente 
        ? `Nuevo pedido de ${nombreCliente} (${tipoCliente})`
        : `Nuevo pedido de cliente tipo ${tipoCliente}`

      const notificacion = await crearNotificacion(
        'nuevo_pedido',
        mensaje,
        usuario._id.toString(),
        usuario.email,
        { tipo: 'pedido', id: pedidoId }
      )

      notificaciones.push(notificacion)
    }

    console.log(`📢 ${notificaciones.length} notificaciones enviadas para nuevo pedido`)
    return notificaciones
  } catch (error) {
    console.error('❌ Error notificando nuevo pedido:', error)
    throw error
  }
}

/**
 * Notifica a todos los administradores cuando se desactiva un usuario
 */
export async function notificarUsuarioDesactivado(usuarioAfectadoEmail: string, usuarioAfectadoNombre?: string) {
  try {
    console.log(`📢 Notificando desactivación de usuario: ${usuarioAfectadoEmail}`)
    
    // Buscar todos los administradores activos
    const administradores = await Usuario.find({ 
      rol: 'administrador', 
      activo: true 
    }).lean()

    console.log(`👥 Encontrados ${administradores.length} administradores activos`)

    if (administradores.length === 0) {
      console.warn('⚠️ No se encontraron administradores activos')
      return []
    }

    const notificaciones = []

    for (const admin of administradores) {
      const mensaje = usuarioAfectadoNombre
        ? `Usuario ${usuarioAfectadoNombre} (${usuarioAfectadoEmail}) ha sido desactivado`
        : `Usuario ${usuarioAfectadoEmail} ha sido desactivado`

      const notificacion = await crearNotificacion(
        'usuario_desactivado',
        mensaje,
        admin._id.toString(),
        admin.email
      )

      notificaciones.push(notificacion)
    }

    console.log(`📢 ${notificaciones.length} notificaciones enviadas para usuario desactivado`)
    return notificaciones
  } catch (error) {
    console.error('❌ Error notificando usuario desactivado:', error)
    throw error
  }
}

/**
 * Notifica a todos los administradores cuando se elimina un usuario
 */
export async function notificarUsuarioEliminado(usuarioAfectadoEmail: string, usuarioAfectadoNombre?: string) {
  try {
    console.log(`📢 Notificando eliminación de usuario: ${usuarioAfectadoEmail}`)
    
    // Buscar todos los administradores activos
    const administradores = await Usuario.find({ 
      rol: 'administrador', 
      activo: true 
    }).lean()

    console.log(`👥 Encontrados ${administradores.length} administradores activos`)

    if (administradores.length === 0) {
      console.warn('⚠️ No se encontraron administradores activos')
      return []
    }

    const notificaciones = []

    for (const admin of administradores) {
      const mensaje = usuarioAfectadoNombre
        ? `Usuario ${usuarioAfectadoNombre} (${usuarioAfectadoEmail}) ha sido eliminado`
        : `Usuario ${usuarioAfectadoEmail} ha sido eliminado`

      const notificacion = await crearNotificacion(
        'usuario_eliminado',
        mensaje,
        admin._id.toString(),
        admin.email
      )

      notificaciones.push(notificacion)
    }

    console.log(`📢 ${notificaciones.length} notificaciones enviadas para usuario eliminado`)
    return notificaciones
  } catch (error) {
    console.error('❌ Error notificando usuario eliminado:', error)
    throw error
  }
}

/**
 * Obtiene todas las notificaciones de un usuario
 */
export async function obtenerNotificacionesUsuario(usuarioId: string, soloNoLeidas: boolean = false) {
  try {
    const filtro: any = { usuarioDestinoId: usuarioId }
    
    if (soloNoLeidas) {
      filtro.leida = false
    }

    const notificaciones = await Notificacion.find(filtro)
      .sort({ createdAt: -1 })
      .limit(50) // Últimas 50 notificaciones
      .lean()

    return notificaciones
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error)
    throw error
  }
}

/**
 * Marca una notificación como leída
 */
export async function marcarComoLeida(notificacionId: string) {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      notificacionId,
      { leida: true },
      { new: true }
    )

    return notificacion
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error)
    throw error
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function marcarTodasComoLeidas(usuarioId: string) {
  try {
    const resultado = await Notificacion.updateMany(
      { usuarioDestinoId: usuarioId, leida: false },
      { leida: true }
    )

    return resultado
  } catch (error) {
    console.error('❌ Error marcando todas como leídas:', error)
    throw error
  }
}
