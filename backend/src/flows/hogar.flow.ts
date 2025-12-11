import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'
import Cliente from '../models/Cliente.js'
import { procesarPedido, finalizarPedido } from './catalogo.flow.js'

type Database = typeof MongoAdapter

export const hogarFlow = addKeyword<Provider, Database>([
  '🏠 Hogar',
  'Hogar',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)

  // Verificar si el cliente ya existe y tiene datos completos
  try {
    const cliente = await Cliente.findOne({ telefono: user })
    
    if (cliente && cliente.tipoCliente === 'hogar' && cliente.nombre && cliente.direccion && cliente.ciudad) {
      // Cliente hogar ya registrado con datos completos
      cliente.ultimaInteraccion = new Date()
      cliente.conversaciones += 1
      await cliente.save()
      
      console.log('✅ Cliente hogar existente con datos completos')
      
      await flowDynamic([
        {
          body: [
            `¡Hola de nuevo, ${cliente.nombre}! 🏠`,
            '',
            'Puedes hacer tu pedido directamente aquí.',
          ].join('\n'),
          buttons: [
            { body: 'Ver catálogo' },
            { body: 'Volver menú' },
          ],
        },
      ])
    } else {
      // Cliente nuevo o sin datos de hogar - pedir información
      await state.update({ esperandoDatosHogar: true })
      
      await flowDynamic([
        '¡Perfecto! Eres cliente hogar 🏠',
        '',
        'Para hacer tu pedido necesito algunos datos:',
        '',
        'Por favor envía la siguiente información:',
        '',
        '*Nombre:* Tu nombre completo',
        '*Ciudad:* Ciudad donde vives',
        '*Dirección:* Dirección de entrega',
        '',
        '*Ejemplo:*',
        'Nombre: María García',
        'Ciudad: Villavicencio',
        'Dirección: Cra 30 #25-40',
      ].join('\n'))
    }
  } catch (error) {
    console.error('❌ Error verificando cliente hogar:', error)
    await flowDynamic('❌ Ocurrió un error. Por favor intenta de nuevo.')
  }
})
.addAnswer(
  '',
  { capture: true },
  async (ctx, { flowDynamic, state }) => {
    const myState = state.getMyState() || {}
    
    if (!myState.esperandoDatosHogar) {
      console.log('[hogarFlow] No esperando datos, ignorando...')
      return
    }
    
    const user = ctx.from
    const datos = ctx.body
    
    try {
      // Extraer datos del mensaje
      const lineas = datos.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
      const nombre = lineas[0]?.replace(/Nombre.*:|:/g, '').trim() || ''
      const ciudad = lineas[1]?.replace(/Ciudad.*:|:/g, '').trim() || ''
      const direccion = lineas[2]?.replace(/Dirección.*:|Direccion.*:|:/g, '').trim() || ''
      
      if (!nombre || !ciudad || !direccion) {
        await flowDynamic([
          '❌ Por favor proporciona todos los datos en el formato indicado:',
          '',
          'Nombre: Tu nombre',
          'Ciudad: Tu ciudad',
          'Dirección: Tu dirección',
        ].join('\n'))
        return
      }
      
      // Guardar o actualizar cliente
      let cliente = await Cliente.findOne({ telefono: user })
      
      if (cliente) {
        // Actualizar cliente existente
        console.log('📂 Actualizando cliente existente')
        cliente.nombre = nombre
        cliente.ciudad = ciudad
        cliente.direccion = direccion
        cliente.tipoCliente = 'hogar'
        cliente.responsable = 'encargado_hogares'
        cliente.nombreNegocio = undefined // Limpiar datos de negocio si existieran
        cliente.ultimaInteraccion = new Date()
        cliente.conversaciones += 1
        await cliente.save()
      } else {
        // Cliente nuevo
        cliente = new Cliente({
          telefono: user,
          nombre: nombre,
          tipoCliente: 'hogar',
          ciudad: ciudad,
          direccion: direccion,
          politicasAceptadas: myState.politicasAceptadas || true,
          fechaAceptacionPoliticas: myState.politicasAceptadasFecha || new Date(),
          fechaRegistro: new Date(),
          ultimaInteraccion: new Date(),
          conversaciones: 1,
        })
        await cliente.save()
      }
      
      await state.update({ 
        esperandoDatosHogar: false,
        clienteExistente: null
      })
      
      console.log('✅ Cliente hogar registrado exitosamente:', { nombre, ciudad, direccion })
      
      await flowDynamic([
        {
          body: [
            `¡Gracias, ${nombre}! ✅`,
            '',
            'Tus datos han sido registrados correctamente.',
            '',
            'Ahora puedes hacer tu pedido.',
          ].join('\n'),
          buttons: [
            { body: 'Ver catálogo' },
            { body: 'Volver menú' },
          ],
        },
      ])
    } catch (error) {
      console.error('❌ Error guardando cliente hogar:', error)
      await flowDynamic('❌ Ocurrió un error guardando tus datos. Por favor intenta de nuevo.')
    }
  }
)
.addAnswer(
  '',
  { capture: true },
  async (ctx, { flowDynamic, state, gotoFlow }) => {
    const myState = state.getMyState() || {}
    
    // Solo procesar si estamos esperando confirmación de cambio
    if (!myState.esperandoConfirmacionCambio) {
      return
    }
    
    const user = ctx.from
    const respuesta = ctx.body.toLowerCase().trim()
    const buttonReply = (ctx as any).title_button_reply?.toLowerCase() || ''
    
    console.log('[hogarFlow] Confirmación cambio - Respuesta:', respuesta, 'Button:', buttonReply)
    
    try {
      // Verificar si acepta el cambio
      const acepta = 
        respuesta.includes('sí') ||
        respuesta.includes('si') ||
        respuesta.includes('cambiar') ||
        buttonReply.includes('sí') ||
        buttonReply.includes('cambiar')
      
      if (acepta) {
        // Usuario acepta cambiar a hogar
        await state.update({
          esperandoConfirmacionCambio: false,
          esperandoDatosHogar: true,
          clienteExistente: myState.clienteExistente
        })
        
        await flowDynamic([
          '✅ *Perfecto*',
          '',
          'Cambiaremos tu cuenta a *Hogar*.',
          '',
          'Por favor envía tus nuevos datos:',
          '',
          '*Nombre:* Tu nombre completo',
          '*Ciudad:* Ciudad donde vives',
          '*Dirección:* Dirección de entrega',
          '',
          '*Ejemplo:*',
          'Nombre: María García',
          'Ciudad: Villavicencio',
          'Dirección: Cra 30 #25-40',
        ].join('\n'))
      } else {
        // Usuario decide no cambiar
        await state.update({
          esperandoConfirmacionCambio: false,
          esperandoDatosHogar: false,
          clienteExistente: null
        })
        
        const cliente = myState.clienteExistente
        await flowDynamic([
          '✅ *Entendido*',
          '',
          `Mantendremos tu cuenta como *${cliente.tipoCliente}*`,
          cliente.nombreNegocio ? `(${cliente.nombreNegocio})` : '',
          '',
          'Regresando al menú principal...',
        ].filter(Boolean).join('\n'))
        
        // Esperar un momento y redirigir al menú
        await new Promise(resolve => setTimeout(resolve, 1500))
        const { actionRouterFlow } = await import('./router.flow.js')
        return gotoFlow(actionRouterFlow)
      }
    } catch (error) {
      console.error('❌ Error procesando confirmación:', error)
      await flowDynamic('❌ Ocurrió un error. Por favor intenta de nuevo.')
      await state.update({
        esperandoConfirmacionCambio: false,
        esperandoDatosHogar: false
      })
    }
  }
)

export const hacerPedidoFlow = addKeyword<Provider, Database>([
  'Ver catálogo',
  'ver catálogo',
  'ver catalogo',
  'BTN_VER_CATALOGO'
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  // Verificar tipo de cliente desde la base de datos
  const cliente = await Cliente.findOne({ telefono: user })
  let tipoCliente = 'hogar' // Por defecto
  
  if (cliente && cliente.tipoCliente) {
    tipoCliente = cliente.tipoCliente
    console.log(`[hacerPedidoFlow] Cliente encontrado - Tipo: ${tipoCliente}`)
  } else {
    console.log('[hacerPedidoFlow] Cliente no encontrado, usando tipo hogar por defecto')
  }
  
  // Si NO es hogar, redirigir a verCatalogoFlow de negocios
  if (tipoCliente !== 'hogar') {
    console.log(`[hacerPedidoFlow] Cliente es ${tipoCliente}, mostrando catálogo de negocios`)
    
    // Usar el flujo de negocios
    await state.update({ 
      tipoNegocio: tipoCliente,
      esperandoPedido: true,
      carrito: []
    })
    
    // Importar y llamar a mostrarCatalogo directamente
    const { mostrarCatalogo } = await import('./catalogo.flow.js')
    await mostrarCatalogo(ctx, flowDynamic, tipoCliente)
    await state.update({ esperandoPedido: true })
    return
  }
  
  // Si es hogar, continuar con el flujo normal
  await state.update({ 
    tipoCliente: 'hogar',
    esperandoPedido: true,
    carrito: []
  })
  
  // Importar y mostrar catálogo para hogar
  const { mostrarCatalogo } = await import('./catalogo.flow.js')
  await mostrarCatalogo(ctx, flowDynamic, 'hogar')
  await state.update({ esperandoPedido: true })
})
.addAnswer(
  '',
  { capture: true },
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const myState = state.getMyState() || {}
    const texto = ctx.body.toLowerCase().trim()
    const buttonReply = (ctx as any).title_button_reply?.toLowerCase() || ''
    const listReply = (ctx as any).title_list_reply?.toLowerCase() || ''
    
    console.log(`[hacerPedidoFlow] Texto: "${texto}"`)
    console.log(`[hacerPedidoFlow] Estado - esperandoPedido: ${myState.esperandoPedido}, tipoCliente: ${myState.tipoCliente}`)
    
    // Verificar si el estado es válido (debe estar esperando pedido)
    if (!myState.esperandoPedido) {
      console.log('[hacerPedidoFlow] No está esperando pedido, ignorando...')
      return
    }
    
    // Obtener el tipo de cliente (puede ser hogar o tipo de negocio)
    const tipoCliente = myState.tipoCliente || myState.tipoNegocio || 'hogar'
    console.log(`[hacerPedidoFlow] Tipo de cliente para pedido: ${tipoCliente}`)
    
    // Detectar si quiere finalizar
    const quiereFinalizar = 
      texto === 'finalizar' ||
      texto.includes('finalizar') ||
      buttonReply.includes('finalizar') ||
      listReply.includes('finalizar')
    
    // Si el usuario quiere finalizar
    if (quiereFinalizar) {
      console.log('[hacerPedidoFlow] ✅ Usuario quiere finalizar')
      const carrito = myState.carrito || []
      
      if (carrito.length === 0) {
        await flowDynamic('❌ No tienes productos en tu carrito. Por favor agrega productos primero.')
        return gotoFlow(hacerPedidoFlow)
      }
      
      console.log(`[hacerPedidoFlow] 📨 Finalizando pedido para tipo: ${tipoCliente}`)
      await finalizarPedido(ctx, state, flowDynamic, tipoCliente)
      
      // Limpiar estado
      await state.update({ 
        carrito: [], 
        esperandoPedido: false,
        tipoCliente: null,
        tipoNegocio: null
      })
      console.log('[hacerPedidoFlow] 🧹 Estado limpiado')
      return
    }
    
    // Si el usuario quiere cancelar
    if (texto.includes('cancelar') || buttonReply.includes('cancelar')) {
      console.log('[hacerPedidoFlow] Usuario canceló el pedido')
      await state.update({ carrito: [], esperandoPedido: false, tipoCliente: null, tipoNegocio: null })
      
      await flowDynamic([
        {
          body: '❌ Pedido cancelado. ¿Qué deseas hacer ahora?',
          buttons: [
            { body: 'Volver menú' },
          ]
        }
      ])
      return
    }
    
    // Procesar productos (agregar al carrito)
    console.log('[hacerPedidoFlow] ✅ Procesando productos...')
    await procesarPedido(ctx, state, flowDynamic, tipoCliente)
  }
)