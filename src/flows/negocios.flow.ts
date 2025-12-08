import { addKeyword, EVENTS } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'
import Cliente from '../models/Cliente.js'
import Conversacion from '../models/Conversacion.js'
import { mostrarCatalogo, procesarPedido, finalizarPedido } from './catalogo.flow.js'

type Database = typeof MongoAdapter

// Función para determinar el responsable según tipo y ubicación
function obtenerResponsable(tipoNegocio: string, ciudad?: string): { 
  tipo: 'coordinador_masivos' | 'director_comercial' | 'ejecutivo_horecas' | 'mayorista',
  nombre: string,
  telefono: string 
} {
  const ciudadNorm = ciudad?.toLowerCase() || ''
  
  // Mayoristas -> siempre mayorista
  if (tipoNegocio === 'mayorista') {
    return { 
      tipo: 'mayorista',
      nombre: 'Coordinador Mayoristas',
      telefono: '3214057410'
    }
  }
  
  // Hoteles, Casinos, Restaurantes Premium -> Ejecutivo Horecas
  if (tipoNegocio === 'restaurante_premium') {
    return { 
      tipo: 'ejecutivo_horecas',
      nombre: 'Ejecutivo Horecas',
      telefono: '3138479027'
    }
  }
  
  // Negocios fuera de Villavicencio -> Coordinador de Masivos
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
    return { 
      tipo: 'coordinador_masivos',
      nombre: 'Coordinador de Masivos',
      telefono: '3232747647'
    }
  }
  
  // Tiendas, Asaderos, Restaurantes en Villavicencio -> Director Comercial
  if (['tienda', 'asadero', 'restaurante_estandar'].includes(tipoNegocio)) {
    return { 
      tipo: 'director_comercial',
      nombre: 'Director Comercial',
      telefono: '3108540251'
    }
  }
  
  // Por defecto -> Director Comercial
  return { 
    tipo: 'director_comercial',
    nombre: 'Director Comercial',
    telefono: '3108540251'
  }
}

// Función auxiliar para guardar datos de negocio
async function guardarDatosNegocio(ctx: any, state: any, flowDynamic: any, tipoNegocio: string) {
  const user = ctx.from
  const datosNegocio = ctx.body
  
  console.log(`📝 Guardando datos de negocio para: ${user}`)
  console.log(`📝 Tipo: ${tipoNegocio}`)
  console.log(`📝 Datos: ${datosNegocio}`)
  
  try {
    // Extraer datos del mensaje
    const lineas = datosNegocio.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
    const nombreNegocio = lineas[0]?.replace(/🏢|Nombre.*:|:/g, '').trim() || ''
    const ciudad = lineas[1]?.replace(/📍|Ciudad.*:|:/g, '').trim() || ''
    const direccion = lineas[2]?.replace(/🏠|Dirección.*:|Direccion.*:|:/g, '').trim() || ''
    const personaContacto = lineas[3]?.replace(/👤|Persona.*:|:/g, '').trim() || ''
    const productosInteres = lineas[4]?.replace(/🛒|Productos.*:|:/g, '').trim() || ''
    
    // Determinar responsable comercial
    const responsableInfo = obtenerResponsable(tipoNegocio, ciudad)
    
    // Guardar en Cliente
    let cliente = await Cliente.findOne({ telefono: user })
    
    if (cliente) {
      console.log(`📂 Cliente existente: ${user}`)
      cliente.tipoCliente = tipoNegocio as any
      cliente.nombreNegocio = nombreNegocio
      cliente.ciudad = ciudad
      cliente.direccion = direccion
      cliente.responsable = responsableInfo.tipo
      cliente.personaContacto = personaContacto
      cliente.productosInteres = productosInteres
      cliente.ultimaInteraccion = new Date()
      cliente.conversaciones += 1
      await cliente.save()
    } else {
      console.log(`🆕 Nuevo cliente: ${user}`)
      cliente = new Cliente({
        telefono: user,
        tipoCliente: tipoNegocio,
        nombreNegocio: nombreNegocio,
        ciudad: ciudad,
        direccion: direccion,
        responsable: responsableInfo.tipo,
        personaContacto: personaContacto,
        productosInteres: productosInteres,
        fechaRegistro: new Date(),
        ultimaInteraccion: new Date(),
        conversaciones: 1,
      })
      await cliente.save()
    }
    
    // Guardar en Conversacion
    await Conversacion.findOneAndUpdate(
      { telefono: user },
      {
        $push: {
          mensajes: {
            rol: 'usuario',
            mensaje: datosNegocio,
            timestamp: new Date(),
            tipoInteraccion: 'registro'
          },
          interaccionesImportantes: {
            tipo: 'registro',
            contenido: datosNegocio,
            timestamp: new Date()
          }
        },
        $set: {
          nombreNegocio: datosNegocio.split('\n')[0]?.replace(/🏢|:/g, '').trim(),
          fechaUltimoMensaje: new Date()
        }
      },
      { upsert: true }
    )
    
    await state.update({ esperandoDatosNegocio: false, tipoNegocio: tipoNegocio })
    
    await flowDynamic([
      '✅ ¡Información recibida y guardada!',
      '',
      '📋 Datos registrados:',
      datosNegocio,
      '',
      '👨‍💼 Un asesor comercial revisará tu solicitud y se comunicará contigo pronto.',
      '',
      `📞 ${responsableInfo.nombre}: ${responsableInfo.telefono}`,
    ].join('\n'))
    
    // Mostrar opción de ver catálogo
    await flowDynamic([
      {
        body: '¿Deseas ver nuestro catálogo de productos?',
        buttons: [
          { body: 'Ver catálogo' },
          { body: 'Volver menú' },
        ]
      }
    ])
    
    console.log(`✅ Cliente guardado: ${user} como ${tipoNegocio} - Responsable: ${responsableInfo.tipo}`)
    
  } catch (error) {
    console.error('❌ Error guardando en BD:', error)
    await flowDynamic('Hubo un error al guardar tu información. Por favor intenta de nuevo.')
  }
}

export const negociosFlow = addKeyword<Provider, Database>([
  '2',
  '2. Negocios',
  'negocios',
  '💼 Negocios',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '💼 Excelente! Atiendo diferentes tipos de negocios',
        '',
        'Por favor selecciona el tipo de negocio que mejor se ajuste a tu establecimiento:',
      ].join('\n'),
      buttons: [
        { body: '🏪 Tiendas' },
        { body: '🍗 Asaderos' },
        { body: '🍽️ Restaurantes Estándar' },
      ],
    },
  ])

  await flowDynamic([
    {
      body: 'O también atendemos:',
      buttons: [
        { body: '⭐ Restaurantes Premium' },
        { body: '📦 Mayoristas' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

// Flujos para cada tipo de negocio
export const tiendasFlow = addKeyword<Provider, Database>([
  'Tiendas',
  'tiendas',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await state.update({ esperandoDatosNegocio: true, tipoNegocio: 'tienda' })
  
  await flowDynamic([
    '¡Perfecto! Atendemos tiendas de barrio 🏪',
    '',
    'Por favor envíame los siguientes datos en un solo mensaje:',
    '',
    '🏢 Nombre de la tienda:',
    '📍 Ciudad:',
    '🏠 Dirección:',
    '👤 Persona de contacto:',
    '🛒 Productos de interés:',
    '',
    'Ejemplo:',
    '🏢 Tienda La Esquina',
    '📍 Villavicencio',
    '🏠 Calle 12 #34-56 Barrio Kennedy',
    '👤 María López',
    '🛒 Pollo entero, presas',
  ].join('\n'))
})
.addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {
  await guardarDatosNegocio(ctx, state, flowDynamic, 'tienda')
  return endFlow()
})

export const asaderosFlow = addKeyword<Provider, Database>([
  'Asaderos',
  'asaderos',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await state.update({ esperandoDatosNegocio: true, tipoNegocio: 'asadero' })
  
  await flowDynamic([
    '¡Excelente! Atendemos asaderos y pollerías 🍗',
    '',
    'Por favor envíame los siguientes datos en un solo mensaje:',
    '',
    '🏢 Nombre del asadero:',
    '📍 Ciudad:',
    '🏠 Dirección:',
    '👤 Persona de contacto:',
    '🛒 Productos de interés:',
    '',
    'Ejemplo:',
    '🏢 Asadero El Pollo Dorado',
    '📍 Acacías',
    '🏠 Carrera 5 #10-20 Centro',
    '👤 Carlos Gómez',
    '🛒 Pollo, alitas, muslos',
  ].join('\n'))
})
.addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {
  await guardarDatosNegocio(ctx, state, flowDynamic, 'asadero')
  return endFlow()
})

export const restaurantesEstandarFlow = addKeyword<Provider, Database>([
  'Restaurantes Estándar',
  'restaurantes estándar',
  'restaurantes estandar',
  'Restaurantes',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await state.update({ esperandoDatosNegocio: true, tipoNegocio: 'restaurante_estandar' })
  
  await flowDynamic([
    'Atendemos restaurantes estándar',
    '',
    'Por favor envíame los siguientes datos en un solo mensaje:',
    '',
    '🏢 Nombre del restaurante:',
    '📍 Ciudad:',
    '🏠 Dirección:',
    '👤 Persona de contacto:',
    '🛒 Productos de interés:',
    '',
    'Ejemplo:',
    '🏢 Restaurante El Buen Sabor',
    '📍 Villavicencio',
    '🏠 Avenida 40 #25-30 Barrio La Grama',
    '👤 Ana Martínez',
    '🛒 Pollo, vísceras, pechuga',
  ].join('\n'))
})
.addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {
  await guardarDatosNegocio(ctx, state, flowDynamic, 'restaurante_estandar')
  return endFlow()
})

export const restaurantePremiumFlow = addKeyword<Provider, Database>([
  'Restaurantes Premium',
  'restaurantes premium',
  'restaurantes p',
  'Restaurantes P',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await state.update({ esperandoDatosNegocio: true, tipoNegocio: 'restaurante_premium' })
  
  await flowDynamic([
    '¡Excelente elección! Atendemos restaurantes premium',
    '',
    'Por favor envíame los siguientes datos en un solo mensaje:',
    '',
    '🏢 Nombre del restaurante:',
    '📍 Ciudad:',
    '🏠 Dirección:',
    '👤 Persona de contacto:',
    '🛒 Productos de interés:',
    '',
    'Ejemplo:',
    '🏢 Restaurante Gourmet Plaza',
    '📍 Villavicencio',
    '🏠 Calle 15 #40-50 Centro Comercial Unicentro',
    '👤 Luis Rodríguez',
    '🛒 Pollo orgánico, cortes especiales',
  ].join('\n'))
})
.addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {
  await guardarDatosNegocio(ctx, state, flowDynamic, 'restaurante_premium')
  return endFlow()
})

export const mayoristasFlow = addKeyword<Provider, Database>([
  'Mayoristas',
  'mayoristas',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await state.update({ esperandoDatosNegocio: true, tipoNegocio: 'mayorista' })
  
  await flowDynamic([
    'Perfecto! Atendemos mayoristas',
    '',
    'Por favor envíame los siguientes datos en un solo mensaje:',
    '',
    '🏢 Nombre de la empresa:',
    '📍 Ciudad:',
    '🏠 Dirección:',
    '👤 Persona de contacto:',
    '🛒 Productos de interés:',
    '',
    'Ejemplo:',
    '🏢 Distribuidora Central',
    '📍 Bogotá',
    '🏠 Calle 80 #100-20 Bodega 5',
    '👤 Pedro Sánchez',
    '🛒 Pollo entero, presas - Volumen: 500-1000 kg/mes',
  ].join('\n'))
})
.addAnswer('', { capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {
  await guardarDatosNegocio(ctx, state, flowDynamic, 'mayorista')
  return endFlow()
})

// Flujos obsoletos mantenidos por compatibilidad
export const enviarInfoNegocioFlow = addKeyword<Provider, Database>(['OBSOLETO_NO_USAR'])
  .addAction(async () => {})

export const capturarDatosNegocioFlow = addKeyword<Provider, Database>(['OBSOLETO_NO_USAR'])
  .addAction(async () => {})

// Flujo para ver catálogo y manejar pedidos completos
export const verCatalogoFlow = addKeyword<Provider, Database>([
  'Ver catálogo',
  'ver catálogo',
  'ver catalogo',
  'Ver catalogo',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  const myState = state.getMyState()
  const tipoNegocio = myState.tipoNegocio
  
  console.log(`[verCatalogoFlow] Iniciado por usuario: ${user}`)
  console.log(`[verCatalogoFlow] Tipo de negocio: ${tipoNegocio}`)
  
  if (!tipoNegocio) {
    await flowDynamic('⚠️ Primero debes registrarte como cliente de negocios.')
    return
  }
  
  await reiniciarTemporizador(user, flowDynamic)
  await mostrarCatalogo(ctx, flowDynamic, tipoNegocio)
  await state.update({ esperandoPedido: true })
  console.log('[verCatalogoFlow] Estado actualizado - esperandoPedido: true')
})
.addAnswer(
  '✍️ Escribe tus productos (Ejemplo: 2 Pollo Entero, 3 Alitas):',
  { capture: true },
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const myState = state.getMyState()
    const texto = ctx.body.toLowerCase().trim()
    const buttonReply = (ctx as any).title_button_reply?.toLowerCase() || ''
    const listReply = (ctx as any).title_list_reply?.toLowerCase() || ''
    
    console.log(`[verCatalogoFlow] Texto recibido: "${texto}"`)
    console.log(`[verCatalogoFlow] Button reply: "${buttonReply}", List reply: "${listReply}"`)
    console.log(`[verCatalogoFlow] Estado - esperandoPedido: ${myState.esperandoPedido}`)
    
    if (!myState.esperandoPedido || !myState.tipoNegocio) {
      console.log('[verCatalogoFlow] Estado inválido, ignorando...')
      return
    }
    
    // MEJORADO: Detectar "Finalizar" con múltiples variaciones
    const quiereFinalizar = 
      texto === 'finalizar' ||
      texto.includes('finalizar') ||
      buttonReply.includes('finalizar') ||
      listReply.includes('finalizar')
    
    // Si el usuario quiere finalizar
    if (quiereFinalizar) {
      console.log('[verCatalogoFlow] ✅ Usuario quiere finalizar')
      const carrito = myState.carrito || []
      if (carrito.length === 0) {
        await flowDynamic('❌ No tienes productos en tu carrito aún. Por favor agrega productos primero.')
        return gotoFlow(capturarProductosContinuoFlow)
      }
      
      console.log('[verCatalogoFlow] 📨 Finalizando pedido...')
      await finalizarPedido(ctx, state, flowDynamic, myState.tipoNegocio)
      
      // Limpiar estado completamente
      await state.update({ 
        carrito: [], 
        esperandoPedido: false,
        tipoNegocio: null 
      })
      console.log('[verCatalogoFlow] 🧹 Estado limpiado - Flujo finalizado correctamente')
      // No hacer return aquí, dejar que el flujo termine naturalmente
      return // Terminar el flujo
    }
    
    // Si el usuario quiere cancelar
    if (texto.includes('cancelar')) {
      console.log('[verCatalogoFlow] Usuario canceló el pedido')
      await state.update({ carrito: [], esperandoPedido: false })
      await flowDynamic('❌ Pedido cancelado. ¿En qué más puedo ayudarte?')
      return
    }
    
    // Procesar productos
    console.log('[verCatalogoFlow] ✅ Procesando productos...')
    await procesarPedido(ctx, state, flowDynamic, myState.tipoNegocio)
    
    // Ir al flujo que permite agregar más productos continuamente
    console.log('[verCatalogoFlow] Redirigiendo a capturarProductosContinuoFlow')
    return gotoFlow(capturarProductosContinuoFlow)
  }
)

// Flujo continuo para capturar productos (permite agregar múltiples veces sin botones)
export const capturarProductosContinuoFlow = addKeyword<Provider, Database>(['CAPTURAR_PRODUCTOS_CONTINUO'])
.addAnswer(
  '',
  { capture: true },
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const myState = state.getMyState()
    const texto = ctx.body.toLowerCase().trim()
    const buttonReply = (ctx as any).title_button_reply?.toLowerCase() || ''
    const listReply = (ctx as any).title_list_reply?.toLowerCase() || ''
    
    console.log(`[capturarProductosContinuoFlow] Texto recibido: "${texto}"`)
    console.log(`[capturarProductosContinuoFlow] Button reply: "${buttonReply}", List reply: "${listReply}"`)
    console.log(`[capturarProductosContinuoFlow] Estado - esperandoPedido: ${myState.esperandoPedido}, tipoNegocio: ${myState.tipoNegocio}`)
    
    if (!myState.esperandoPedido || !myState.tipoNegocio) {
      console.log('[capturarProductosContinuoFlow] Estado inválido, ignorando...')
      return
    }
    
    // MEJORADO: Detectar "Finalizar" con múltiples variaciones
    const quiereFinalizar = 
      texto === 'finalizar' ||
      texto.includes('finalizar') ||
      buttonReply.includes('finalizar') ||
      listReply.includes('finalizar')
    
    // Si el usuario quiere finalizar
    if (quiereFinalizar) {
      console.log('[capturarProductosContinuoFlow] ✅ Usuario quiere finalizar')
      const carrito = myState.carrito || []
      if (carrito.length === 0) {
        await flowDynamic('❌ No tienes productos en tu carrito aún. Por favor agrega productos primero.')
        return gotoFlow(capturarProductosContinuoFlow)
      }
      
      console.log('[capturarProductosContinuoFlow] 📨 Finalizando pedido...')
      await finalizarPedido(ctx, state, flowDynamic, myState.tipoNegocio)
      
      // Limpiar estado completamente
      await state.update({ 
        carrito: [], 
        esperandoPedido: false,
        tipoNegocio: null 
      })
      console.log('[capturarProductosContinuoFlow] 🧹 Estado limpiado - Pedido finalizado exitosamente')
      
      // NO redirigir a ningún flujo, simplemente terminar
      // El usuario puede escribir "menú" o cualquier comando para iniciar una nueva interacción
      return // Finaliza el flujo aquí
    }
    
    // Si el usuario quiere cancelar
    if (texto.includes('cancelar')) {
      console.log('[capturarProductosContinuoFlow] Usuario canceló el pedido')
      await state.update({ carrito: [], esperandoPedido: false })
      await flowDynamic('❌ Pedido cancelado. ¿En qué más puedo ayudarte?')
      // Terminar sin redirigir
      return
    }
    
    // Procesar productos (agregar al carrito existente)
    console.log('[capturarProductosContinuoFlow] ✅ Procesando productos...')
    await procesarPedido(ctx, state, flowDynamic, myState.tipoNegocio)
    
    // Volver a este mismo flujo para permitir agregar más productos
    console.log('[capturarProductosContinuoFlow] Listo para recibir más productos')
    return gotoFlow(capturarProductosContinuoFlow)
  }
)

// Mantener flujos antiguos para compatibilidad (deprecated)
export const capturarProductosFlow = capturarProductosContinuoFlow
export const esperarAccionFlow = capturarProductosContinuoFlow

// Flujo para agregar productos al carrito - DESHABILITADO para evitar bug event_welcome
// Las funciones mostrarCatalogo, procesarPedido y finalizarPedido se llaman directamente desde verCatalogoFlow
export const agregarProductosFlow = addKeyword<Provider, Database>(['NUNCA_SE_ACTIVARA'])
  .addAction(async () => {})