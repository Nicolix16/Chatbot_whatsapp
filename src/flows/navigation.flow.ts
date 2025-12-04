import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const volverMenuFlow = addKeyword<Provider, Database>([
  'Volver menú',
  'volver menú',
  'volver menu',
  'Volver al menú',
  'volver al menú',
  'volver al menu',
  'Volver al menú principal',
  'volver al menú principal',
  'Volver al menu principal',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)

  await flowDynamic([
    {
      body: [
        '👋 Bienvenido(a) nuevamente a *Avellano* 💖🐔',
        '',
        'Por favor elige una opción para continuar 👇',
      ].join('\n'),
      buttons: [
        { body: '🛒 Pedido' },
        { body: '📖 Recetas' },
        { body: '📞 Atención' },
      ],
    },
  ])
})