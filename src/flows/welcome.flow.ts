import { addKeyword, EVENTS } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const welcomeFlow = addKeyword<Provider, Database>([
  EVENTS.WELCOME,
  'hola',
  'Hola',
  'menu',
  'menú'
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)

  await flowDynamic([
    {
      body: [
        '👋 ¡Hola! Bienvenido(a) a Avellano',
        '',
        'Soy tu asistente virtual  y estoy aquí para ayudarte.',
        'Por favor elige una opción para continuar:',
      ].join('\n'),
      buttons: [
        { body: '🛒 Pedido' },
        { body: '📖 Recetas' },
        { body: '📞 Atención' },
      ],
    },
  ])
})