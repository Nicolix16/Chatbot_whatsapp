import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const hogarFlow = addKeyword<Provider, Database>([
  '1',
  '1. Hogar',
  'hogar',
  '🏠 Hogar',
  'Hogar',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)

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