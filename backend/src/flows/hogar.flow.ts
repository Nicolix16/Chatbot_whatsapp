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
            'Puedes ver nuestro catálogo completo aquí (incluye el costo del domicilio):',
            '👉 https://wa.me/c/573102325151',
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
        // Si el cliente ya existe con otro tipo, no sobrescribir - crear alerta
        if (cliente.tipoCliente && cliente.tipoCliente !== 'hogar') {
          await flowDynamic([
            '⚠️ *ATENCIÓN*',
            '',
            `Ya estás registrado como cliente *${cliente.tipoCliente}*.`,
            '',
            'Si deseas cambiar tu tipo de cliente a Hogar, contacta con soporte:',
            '📞 https://wa.me/573102325151',
            '',
            'Mientras tanto, puedes usar tu cuenta actual.',
          ].join('\n'))
          await state.update({ esperandoDatosHogar: false })
          return
        }
        
        // Si ya es hogar, solo actualizar datos
        cliente.nombre = nombre
        cliente.ciudad = ciudad
        cliente.direccion = direccion
        cliente.ultimaInteraccion = new Date()
        cliente.conversaciones += 1
        await cliente.save()
      } else {
        cliente = new Cliente({
          telefono: user,
          nombre: nombre,
          tipoCliente: 'hogar',
          ciudad: ciudad,
          direccion: direccion,
          fechaRegistro: new Date(),
          ultimaInteraccion: new Date(),
          conversaciones: 1,
        })
        await cliente.save()
      }
      
      await state.update({ esperandoDatosHogar: false })
      
      console.log('✅ Cliente hogar registrado exitosamente:', { nombre, ciudad, direccion })
      
      await flowDynamic([
        {
          body: [
            `¡Gracias, ${nombre}! ✅`,
            '',
            'Tus datos han sido registrados correctamente.',
            '',
            'Puedes ver nuestro catálogo completo aquí (incluye el costo del domicilio):',
            '👉 https://wa.me/c/573102325151',
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

export const hacerPedidoFlow = addKeyword<Provider, Database>([
  'Ver catálogo',
  'ver catálogo',
  'ver catalogo',
  'BTN_VER_CATALOGO'
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  // Inicializar estado para hogar
  await state.update({ 
    tipoCliente: 'hogar',
    esperandoPedido: true,
    carrito: []
  })
  
  await flowDynamic([
    '🛒 *Vamos a crear tu pedido hogar*',
    '',
    'Por favor indica qué productos deseas.',
    '',
    '*Formato:* cantidad producto',
    '*Ejemplo:* 2 Pollo Entero, 3 Alitas, 1 Pechuga',
    '',
    '✅ Escribe *"Finalizar"* cuando termines',
    '❌ Escribe *"Cancelar"* para cancelar',
  ].join('\n'))
})
.addAnswer(
  '',
  { capture: true },
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const myState = state.getMyState()
    const texto = ctx.body.toLowerCase().trim()
    const buttonReply = (ctx as any).title_button_reply?.toLowerCase() || ''
    const listReply = (ctx as any).title_list_reply?.toLowerCase() || ''
    
    console.log(`[hacerPedidoFlow] Texto: "${texto}"`)
    console.log(`[hacerPedidoFlow] Estado - esperandoPedido: ${myState.esperandoPedido}, tipoCliente: ${myState.tipoCliente}`)
    
    if (!myState.esperandoPedido || myState.tipoCliente !== 'hogar') {
      console.log('[hacerPedidoFlow] Estado inválido, ignorando...')
      return
    }
    
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
      
      console.log('[hacerPedidoFlow] 📨 Finalizando pedido hogar...')
      await finalizarPedido(ctx, state, flowDynamic, 'hogar')
      
      // Limpiar estado
      await state.update({ 
        carrito: [], 
        esperandoPedido: false,
        tipoCliente: null 
      })
      console.log('[hacerPedidoFlow] 🧹 Estado limpiado')
      return
    }
    
    // Si el usuario quiere cancelar
    if (texto.includes('cancelar')) {
      console.log('[hacerPedidoFlow] Usuario canceló el pedido')
      await state.update({ carrito: [], esperandoPedido: false, tipoCliente: null })
      await flowDynamic('❌ Pedido cancelado. ¿En qué más puedo ayudarte?')
      return
    }
    
    // Procesar productos (agregar al carrito)
    console.log('[hacerPedidoFlow] ✅ Procesando productos...')
    await procesarPedido(ctx, state, flowDynamic, 'hogar')
  }
)