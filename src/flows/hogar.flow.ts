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
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)

  // Guardar o actualizar el tipo de cliente como 'hogar'
  try {
    let cliente = await Cliente.findOne({ telefono: user })
    
    if (cliente) {
      // Solo actualizar si el cliente no es de tipo negocio
      if (!['tienda', 'asadero', 'restaurante_estandar', 'restaurante_premium', 'mayorista'].includes(cliente.tipoCliente)) {
        cliente.tipoCliente = 'hogar'
      }
      cliente.ultimaInteraccion = new Date()
      cliente.conversaciones += 1
      await cliente.save()
    } else {
      // Crear nuevo cliente solo si no existe
      cliente = new Cliente({
        telefono: user,
        tipoCliente: 'hogar',
        fechaRegistro: new Date(),
        ultimaInteraccion: new Date(),
        conversaciones: 1,
      })
      await cliente.save()
    }
    
    console.log('✅ Cliente hogar registrado/actualizado exitosamente')
  } catch (error) {
    console.error('❌ Error guardando cliente hogar:', error)
  }

  await flowDynamic([
    {
      body: [
        '¡Perfecto! Eres cliente hogar 🏠',
        '',
        'Puedes ver nuestro catálogo completo aquí (incluye el costo del domicilio):',
        '👉 https://wa.me/c/573102325151',
      ].join('\n'),
      buttons: [
        { body: 'Hacer pedido' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const hacerPedidoFlow = addKeyword<Provider, Database>([
  'Hacer pedido',
  'hacer pedido',
  'BTN_HACER_PEDIDO'
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
    
    // Volver a este mismo flujo para permitir agregar más productos
    return gotoFlow(hacerPedidoFlow)
  }
)