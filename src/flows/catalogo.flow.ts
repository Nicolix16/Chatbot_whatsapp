import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import Cliente from '../models/Cliente.js'
import Pedido from '../models/Pedido.js'

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
  
  if (esMunicipio) {
    return { nombre: 'Coordinador de Masivos', telefono: '573232747647' }
  }
  
  if (['tienda', 'asadero', 'restaurante_estandar'].includes(tipoCliente)) {
    return { nombre: 'Director Comercial', telefono: '573108540251' }
  }
  
  return { nombre: 'Director Comercial', telefono: '573108540251' }
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
    `📋 *CATÁLOGO - ${tipoCliente.toUpperCase()}*`,
    '',
    listaCatalogo,
    '',
    '📝 Para realizar tu pedido, envía los productos con cantidad:',
    'Ejemplo: 2 Pollo Entero, 3 Alitas',
    '',
    'O escribe "Finalizar" cuando termines.',
  ].join('\n'))
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
        nombreProducto.includes(p.nombre.toLowerCase())
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
    await flowDynamic('No pude identificar los productos. Por favor intenta de nuevo.')
    return
  }
  
  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  
  // Guardar en el estado
  const myState = state.getMyState()
  const carritoActual = myState.carrito || []
  await state.update({ carrito: [...carritoActual, ...carrito] })
  
  const resumen = carrito
    .map(p => `• ${p.cantidad}x ${p.nombre} - $${p.subtotal.toLocaleString('es-CO')}`)
    .join('\n')
  
  await flowDynamic([
    '✅ *Productos agregados:*',
    '',
    resumen,
    '',
    `💰 Subtotal: $${total.toLocaleString('es-CO')}`,
    '',
    '¿Deseas agregar más productos o finalizar el pedido?',
    '',
    'Escribe "Finalizar" para completar tu pedido o envía más productos.',
  ].join('\n'))
}

// Finalizar el pedido y generar enlace de WhatsApp
export async function finalizarPedido(ctx: any, state: any, flowDynamic: any, tipoCliente: string) {
  const user = ctx.from
  const myState = state.getMyState()
  const carrito = myState.carrito || []
  
  if (carrito.length === 0) {
    await flowDynamic('No tienes productos en tu carrito.')
    return
  }
  
  // Obtener datos del cliente
  const cliente = await Cliente.findOne({ telefono: user })
  
  if (!cliente) {
    await flowDynamic('Error: No se encontró tu información. Por favor regístrate primero.')
    return
  }
  
  const total = carrito.reduce((sum: number, item: any) => sum + item.subtotal, 0)
  
  // Obtener coordinador asignado
  const coordinador = obtenerCoordinador(tipoCliente, cliente.ciudad)
  
  // Guardar pedido en la base de datos
  const nuevoPedido = new Pedido({
    telefono: user,
    tipoCliente: tipoCliente,
    nombreNegocio: cliente.nombreNegocio,
    ciudad: cliente.ciudad,
    direccion: cliente.direccion,
    personaContacto: cliente.personaContacto,
    productos: carrito.map((p: any) => `${p.cantidad}x ${p.nombre}`).join(', '),
    total: total,
    coordinadorAsignado: coordinador.nombre,
    telefonoCoordinador: coordinador.telefono,
    estado: 'pendiente',
    fechaPedido: new Date(),
  })
  
  await nuevoPedido.save()
  console.log(`✅ Pedido guardado: ${user} - Total: $${total}`)
    
  // Generar enlace de WhatsApp para el coordinador
  const enlaceCoordinador = generarEnlaceWhatsApp(
    coordinador.telefono,
    cliente.nombreNegocio || cliente.personaContacto || user,
    tipoCliente,
    cliente.ciudad || 'No especificada',
    cliente.direccion || 'No especificada',
    carrito,
    total
  )
  
  // Generar enlace para que el cliente contacte al coordinador
  const mensajeCliente = `Hola, soy ${cliente.nombreNegocio || cliente.personaContacto}. Realicé un pedido por WhatsApp y me gustaría coordinar la entrega.`
  const enlaceCliente = `https://wa.me/${coordinador.telefono}?text=${encodeURIComponent(mensajeCliente)}`
  
  // Resumen del pedido
  const resumenPedido = carrito
    .map((p: any) => `• ${p.cantidad}x ${p.nombre} - $${p.subtotal.toLocaleString('es-CO')}`)
    .join('\n')
  
  await flowDynamic([
    '🎉 *¡PEDIDO CONFIRMADO!*',
    '',
    '📋 *Resumen:*',
    resumenPedido,
    '',
    `💰 *TOTAL:* $${total.toLocaleString('es-CO')}`,
    '',
    `👨‍💼 *Tu coordinador asignado:* ${coordinador.nombre}`,
    `📞 *Teléfono:* ${coordinador.telefono}`,
    '',
    '🔗 *Haz clic aquí para contactar a tu coordinador:*',
    enlaceCliente,
    '',
    'El coordinador recibirá automáticamente los detalles de tu pedido y se comunicará contigo pronto.',
    '',
    '¡Gracias por tu compra! 🐔💛',
  ].join('\n'))
  
  // Limpiar el carrito
  await state.update({ carrito: [], esperandoPedido: false })
  
  console.log(`📨 Enlace generado para coordinador: ${enlaceCoordinador}`)
  console.log(`📱 Enlace enviado al cliente: ${enlaceCliente}`)
}
