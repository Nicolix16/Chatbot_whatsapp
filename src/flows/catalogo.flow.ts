import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import Cliente from '../models/Cliente.js'
import Pedido from '../models/Pedido.js'
import Conversacion from '../models/Conversacion.js'

type Database = typeof MongoAdapter

// Catálogos de productos según tipo de cliente
const CATALOGO = {
  mayorista: [
    { nombre: 'Pollo Entero (Caja 10 unidades)', precio: 180000 },
    { nombre: 'Presas Mixtas (Caja 20kg)', precio: 160000 },
    { nombre: 'Pechuga (Caja 15kg)', precio: 195000 },
    { nombre: 'Muslos (Caja 20kg)', precio: 140000 },
    { nombre: 'Alitas (Caja 15kg)', precio: 120000 },
  ],
  tienda: [
    { nombre: 'Pollo Entero', precio: 19000 },
    { nombre: 'Presas Mixtas (kg)', precio: 18000 },
    { nombre: 'Pechuga (kg)', precio: 22000 },
    { nombre: 'Muslos (kg)', precio: 16000 },
    { nombre: 'Alitas (kg)', precio: 14000 },
  ],
  asadero: [
    { nombre: 'Pollo Entero', precio: 19000 },
    { nombre: 'Presas Mixtas (kg)', precio: 18000 },
    { nombre: 'Pechuga (kg)', precio: 22000 },
    { nombre: 'Muslos (kg)', precio: 16000 },
    { nombre: 'Alitas (kg)', precio: 14000 },
    { nombre: 'Menudencias (kg)', precio: 8000 },
  ],
  restaurante_estandar: [
    { nombre: 'Pollo Entero', precio: 20000 },
    { nombre: 'Pechuga Fileteada (kg)', precio: 24000 },
    { nombre: 'Muslos y Contramuslos (kg)', precio: 17000 },
    { nombre: 'Alitas (kg)', precio: 15000 },
  ],
  restaurante_premium: [
    { nombre: 'Pollo Orgánico Entero', precio: 32000 },
    { nombre: 'Pechuga Orgánica Fileteada (kg)', precio: 38000 },
    { nombre: 'Cortes Premium (kg)', precio: 35000 },
    { nombre: 'Alitas Premium (kg)', precio: 25000 },
  ],
}

// Función para obtener contacto del coordinador
function obtenerCoordinador(tipoCliente: string, ciudad?: string): { nombre: string; telefono: string } {
  const ciudadNorm = ciudad?.toLowerCase() || ''
  
  if (tipoCliente === 'mayorista') {
    return { nombre: 'Coordinador Mayoristas', telefono: '573214057410' }
  }
  
  if (tipoCliente === 'restaurante_premium') {
    return { nombre: 'Ejecutivo Horecas', telefono: '573138479027' }
  }

  const municipiosMeta = [
    'acacías', 'acacias', 'barranca de upía', 'barranca de upia', 
    'guamal', 'san martín', 'san martin', 'cubarral', 'granada',
    'puerto lópez', 'puerto lopez', 'puerto gaitán', 'puerto gaitan',
    'paratebueno', 'maya', 'villanueva', 'monterrey', 'aguazul',
    'tauramena', 'yopal', 'paz de ariporo', 'trinidad', 'hato corozal',
    'tame', 'san josé del guaviare', 'san jose del guaviare'
  ]
  
  const esMunicipio = municipiosMeta.some(m => ciudadNorm.includes(m))
  
  // Hogar siempre va a Coordinador de Masivos
  if (tipoCliente === 'hogar') {
    return { nombre: 'Coordinador de Masivos', telefono: '573232747647' }
  }
  
  if (esMunicipio) {
    return { nombre: 'Coordinador de Masivos', telefono: '573232747647' }
  }
  
  if (['tienda', 'asadero', 'restaurante_estandar'].includes(tipoCliente)) {
    return { nombre: 'Director Comercial', telefono: '573108540251' }
  }
  
  return { nombre: 'Director Comercial', telefono: '573108540251' }
}

// Función para generar ID único de pedido
function generarIdPedido(): string {
  const fecha = new Date()
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `AV-${year}${month}${day}-${random}`
}

// Generar enlace de WhatsApp con mensaje predefinido
function generarEnlaceWhatsApp(
  numeroCoordinador: string,
  nombreCliente: string,
  tipoCliente: string,
  ciudad: string,
  direccion: string,
  productos: any[],
  total: number
): string {
  const listaProductos = productos
    .map(p => `  • ${p.cantidad}x ${p.nombre} - $${p.subtotal.toLocaleString('es-CO')}`)
    .join('\n')
  
  const mensaje = `🛒 *NUEVO PEDIDO - AVELLANO*

👤 *Cliente:* ${nombreCliente}
📋 *Tipo:* ${tipoCliente.toUpperCase()}
📍 *Ciudad:* ${ciudad}
🏠 *Dirección:* ${direccion}

*PRODUCTOS SOLICITADOS:*
${listaProductos}

💰 *TOTAL:* $${total.toLocaleString('es-CO')}

Por favor, contactar al cliente para coordinar la entrega.`

  const mensajeCodificado = encodeURIComponent(mensaje)
  return `https://wa.me/${numeroCoordinador}?text=${mensajeCodificado}`
}

// Mostrar catálogo según tipo de cliente
export async function mostrarCatalogo(ctx: any, flowDynamic: any, tipoCliente: string) {
  const catalogo = CATALOGO[tipoCliente as keyof typeof CATALOGO] || CATALOGO.tienda
  
  const listaCatalogo = catalogo
    .map((p, i) => `${i + 1}. ${p.nombre} - $${p.precio.toLocaleString('es-CO')}`)
    .join('\n')
  
  await flowDynamic([
    `📋 *CATÁLOGO - TIENDA*`,
    '',
    listaCatalogo,
    '',
    '📝 *Para realizar tu pedido, envía los productos con cantidad:*',
    'Ejemplo: 2 Pollo Entero, 3 Alitas',
  ].join('\n'))
  
  await flowDynamic([
    {
      body: 'Si no deseas hacer pedido:',
      buttons: [
        { body: 'Cancelar' },
      ],
    },
  ])
}

// Procesar el pedido del usuario
export async function procesarPedido(ctx: any, state: any, flowDynamic: any, tipoCliente: string) {
  const texto = ctx.body
  const catalogo = CATALOGO[tipoCliente as keyof typeof CATALOGO] || CATALOGO.tienda
  
  // Extraer productos del texto (formato: "2 Pollo Entero, 3 Alitas")
  const lineas = texto.split(/,|y/).map((l: string) => l.trim())
  const carrito: any[] = []
  
  for (const linea of lineas) {
    const match = linea.match(/(\d+)\s*(.+)/)
    if (match) {
      const cantidad = parseInt(match[1])
      const nombreProducto = match[2].trim().toLowerCase()
      
      const producto = catalogo.find(p => 
        p.nombre.toLowerCase().includes(nombreProducto) || 
        nombreProducto.includes(p.nombre.toLowerCase().split(' ')[0])
      )
      
      if (producto) {
        carrito.push({
          nombre: producto.nombre,
          cantidad,
          precioUnitario: producto.precio,
          subtotal: cantidad * producto.precio,
        })
      }
    }
  }
  
  if (carrito.length === 0) {
    await flowDynamic([
      '❌ No pude identificar los productos. Por favor intenta de nuevo.',
      '',
      'Recuerda el formato: *cantidad producto*',
      'Ejemplo: 2 Pollo Entero, 3 Alitas',
    ].join('\n'))
    return
  }
  
  // Guardar en el estado
  const myState = state.getMyState()
  const carritoActual = myState.carrito || []
  const nuevoCarrito = [...carritoActual, ...carrito]
  await state.update({ carrito: nuevoCarrito })
  
  // Calcular total acumulado de todo el carrito
  const totalAcumulado = nuevoCarrito.reduce((sum: number, item: any) => sum + item.subtotal, 0)
  
  // Resumen de productos recién agregados
  const resumenNuevos = carrito
    .map(p => `  • ${p.cantidad}x ${p.nombre} - $${p.subtotal.toLocaleString('es-CO')}`)
    .join('\n')
  
  // Resumen completo del carrito
  const resumenCompleto = nuevoCarrito
    .map((p: any) => `  • ${p.cantidad}x ${p.nombre} - $${p.subtotal.toLocaleString('es-CO')}`)
    .join('\n')
  
  await flowDynamic([
    '✅ *Productos agregados:*',
    '',
    resumenNuevos,
  ].join('\n'))
  
  await flowDynamic([
    '',
    '🛒 *CARRITO COMPLETO:*',
    '',
    resumenCompleto,
    '',
    `💰 *TOTAL:* $${totalAcumulado.toLocaleString('es-CO')}`,
    '',
    '📝 *¿Deseas agregar más productos?*',
    'Escribe los productos con cantidad (Ejemplo: 2 Pollo Entero, 3 Alitas)',
    '',
    '✅ Escribe *"Finalizar"* cuando termines tu pedido',
    '❌ Escribe *"Cancelar"* para cancelar',
  ].join('\n'))
}

// Finalizar el pedido y guardarlo en la base de datos
export async function finalizarPedido(ctx: any, state: any, flowDynamic: any, tipoCliente: string) {
  const user = ctx.from
  const myState = state.getMyState()
  const carrito = myState.carrito || []
  
  if (carrito.length === 0) {
    await flowDynamic('❌ No tienes productos en tu carrito.')
    return
  }
  
  // Obtener datos del cliente
  const cliente = await Cliente.findOne({ telefono: user })
  
  if (!cliente) {
    await flowDynamic('❌ Error: No se encontró tu información. Por favor regístrate primero.')
    return
  }
  
  const total = carrito.reduce((sum: number, item: any) => sum + item.subtotal, 0)
  
  // Obtener coordinador asignado
  const coordinador = obtenerCoordinador(tipoCliente, cliente.ciudad)
  
  // Generar ID único para el pedido
  const idPedido = generarIdPedido()
  
  // Crear lista detallada de productos
  const productosDetalle = carrito.map((p: any) => ({
    nombre: p.nombre,
    cantidad: p.cantidad,
    precioUnitario: p.precioUnitario,
    subtotal: p.subtotal,
  }))
  
  // Guardar pedido en la base de datos
  const nuevoPedido = new Pedido({
    idPedido: idPedido,
    telefono: user,
    tipoCliente: tipoCliente,
    nombreNegocio: cliente.nombreNegocio || 'Sin nombre',
    ciudad: cliente.ciudad || 'Sin especificar',
    direccion: cliente.direccion || 'Sin especificar',
    personaContacto: cliente.personaContacto || 'Sin especificar',
    productos: productosDetalle,
    total: total,
    coordinadorAsignado: coordinador.nombre,
    telefonoCoordinador: coordinador.telefono,
    estado: 'pendiente',
    fechaPedido: new Date(),
    historialEstados: [{
      estado: 'pendiente',
      fecha: new Date(),
      nota: 'Pedido recibido desde el chatbot'
    }]
  })
  
  try {
    await nuevoPedido.save()
    console.log(`✅ Pedido guardado en BD: ${idPedido} - Total: $${total}`)
    
    // Guardar también en el historial de conversaciones
    await Conversacion.findOneAndUpdate(
      { telefono: user },
      {
        $push: {
          interaccionesImportantes: {
            tipo: 'pedido',
            contenido: `Pedido #${idPedido} - Total: $${total.toLocaleString('es-CO')} - Productos: ${carrito.map((p: any) => `${p.cantidad}x ${p.nombre}`).join(', ')}`,
            timestamp: new Date()
          }
        },
        $set: {
          fechaUltimoMensaje: new Date()
        }
      },
      { upsert: true }
    )
    
  } catch (error) {
    console.error('❌ Error guardando pedido:', error)
    await flowDynamic('❌ Hubo un error al procesar tu pedido. Por favor intenta nuevamente.')
    return
  }
  
  // Resumen del pedido
  const resumenPedido = carrito
    .map((p: any) => `  • ${p.cantidad}x ${p.nombre} - $${p.subtotal.toLocaleString('es-CO')}`)
    .join('\n')
  
  await flowDynamic([
    '✅ PEDIDO RECIBIDO EXITOSAMENTE ✅',
    '',
    `📋 ID de Pedido: ${idPedido}`,
    '',
    '📦 Resumen de tu pedido:',
    resumenPedido,
    '',
    `💰 TOTAL: $${total.toLocaleString('es-CO')}`,
    '',
    '─────────────────────────',
    '',
    '✅ Estamos procesando tu pedido',
    '',
    `👨‍💼 Un Asesor Comercial se contactará contigo pronto para atender tu solicitud y coordinar la entrega.`,
    '',
    `📞 Coordinador asignado: ${coordinador.nombre}`,
    `📱 Teléfono: ${coordinador.telefono}`,
    '',
    '⏰ Tiempo estimado de contacto: 15-30 minutos (horario laboral)',
    '',
    '─────────────────────────',
    '',
    `🔖 Recuerda guardar tu ID de pedido: ${idPedido}`,
    '',
    '✅ ¡Gracias por confiar en Avellano! 💛',
    '',
    '💬 Si necesitas algo más, escribe "menú" para volver al inicio.',
  ].join('\n'))
  
  console.log(`📨 Pedido confirmado - ID: ${idPedido}`)
}

  // Flujo para finalizar pedido
export const finalizarFlow = addKeyword<Provider, Database>([
  'finalizar',
  'Finalizar',
]).addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
  const user = ctx.from
  const myState = state.getMyState()
  const tipoCliente = myState.tipoCliente || 'hogar'
  
  await finalizarPedido(ctx, state, flowDynamic, tipoCliente)
  
  // Mostrar opciones al finalizar
  await flowDynamic([
    {
      body: '¿Deseas hacer algo más?',
      buttons: [
        { body: 'Pedido' },
        { body: 'Volver menú' },
      ]
    }
  ])
})

// Flujo para cancelar pedido
export const cancelarFlow = addKeyword<Provider, Database>([
  'cancelar',
  'Cancelar',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  const myState = state.getMyState()
  const carrito = myState.carrito || []
  
  if (carrito.length === 0) {
    await flowDynamic('Tu carrito ya estaba vacío.')
    return
  }
  
  // Limpiar el carrito
  await state.update({ carrito: [] })
  
  await flowDynamic([
    '❌ PEDIDO CANCELADO ❌',
    '',
    'Entendemos que cambies de opinión. Aquí en Avellano 🐔 siempre te esperamos con los mejores productos.',
    '',
    '💭 Tu opinión es importante para nosotros.',
    '',
    '🎁 Te animamos a que nos visites pronto. Tenemos muchas sorpresas para ti.',
    '',
    '¡Gracias por considerarnos! 💛',
    '',
    '👋 Esperamos verte de nuevo pronto en Avellano',
  ].join('\n'))
  
  // Mostrar opciones
  await flowDynamic([
    {
      body: '¿Deseas hacer algo más?',
      buttons: [
        { body: 'Pedido' },
        { body: 'Recetas' },
        { body: 'Volver menú' },
      ]
    }
  ])
})

// Flujo para consultar estado del pedido
export const consultarPedidoFlow = addKeyword<Provider, Database>([
  'consultar',
  'Consultar',
]).addAction(async (ctx, { flowDynamic }) => {
  await flowDynamic('Ingresa tu ID de pedido (ejemplo: AV-20251208-9828)')
})
.addAnswer('', { capture: true }, async (ctx, { flowDynamic, endFlow }) => {
  const idPedido = ctx.body.trim().toUpperCase()
  const user = ctx.from
  
  console.log(`[Consulta] Usuario ${user} consulta pedido: ${idPedido}`)
  
  try {
    // Buscar el pedido en la base de datos
    const pedido = await Pedido.findOne({ idPedido: idPedido })
    
    if (!pedido) {
      await flowDynamic('No se encontró ese pedido en el sistema.')
    } else {
      // Mostrar información del pedido
      const estado = pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)
      const productosInfo = pedido.productos
        .map((p: any) => `• ${p.cantidad}x ${p.nombre}`)
        .join('\n')
      
      await flowDynamic([
        '✅ ESTADO DE TU PEDIDO',
        '',
        `ID: ${idPedido}`,
        `Estado: ${estado}`,
        '',
        'Productos:',
        productosInfo,
        '',
        `Total: $${pedido.total.toLocaleString('es-CO')}`,
        `Coordinador: ${pedido.coordinadorAsignado}`,
        `Teléfono: ${pedido.telefonoCoordinador.replace(/^57/, '')}`,
      ].join('\n'))
    }
    
  } catch (error) {
    console.error('Error consultando pedido:', error)
    await flowDynamic('Hubo un error consultando el pedido.')
  }
  
  // Mostrar opción de volver al menú
  await flowDynamic([
    {
      body: '¿Deseas hacer algo más?',
      buttons: [
        { body: 'Volver menú' },
      ]
    }
  ])
})
