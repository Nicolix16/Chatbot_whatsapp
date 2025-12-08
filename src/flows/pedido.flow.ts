import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const pedidoFlow = addKeyword<Provider, Database>([
  'Pedido',
  'pedido',
  '🛒 Pedido',
  'realizar pedido'
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  console.info(`[flow] Pedido triggered by ${user} -> text: "${ctx.body}"`)
  console.log('🛒 pedidoFlow: Iniciando flujo de pedido')
  
  await reiniciarTemporizador(user, flowDynamic)

  await flowDynamic([
    {
      body: [
        '🛒 Perfecto, vamos a crear tu pedido',
        '',
        'Antes de continuar, por favor indícanos tu tipo de cliente:',
      ].join('\n'),
      buttons: [
        { body: '🏠 Hogar' },
        { body: '💼 Negocios' },
        { body: '📍 Encuéntranos' },
      ],
    },
  ])

  await flowDynamic([
    {
      body: '¿O prefieres volver al menú principal?',
      buttons: [
        { body: 'Volver menú' },
      ],
    },
  ])
})