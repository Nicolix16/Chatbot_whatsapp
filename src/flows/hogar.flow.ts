import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'
import Cliente from '../models/Cliente.js'

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
    
    console.log(`✅ Cliente hogar registrado/actualizado: ${user}`)
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
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await flowDynamic('Genial 🛒, ¿qué producto deseas pedir? Por favor indica nombre y cantidad.')
})