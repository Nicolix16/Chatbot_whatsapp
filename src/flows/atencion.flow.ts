import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const clienteFlow = addKeyword<Provider, Database>([
  '📞 Atención',
  'Atención'
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '📞 *Atención al Cliente - Avellano*',
        '',
        '¡Estamos aquí para ayudarte! 💛',
        '',
        '¿Cómo podemos asistirte hoy?',
      ].join('\n'),
      buttons: [
        { body: 'Contactar asesor' },
        { body: 'Info general' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const contactarAsesorFlow = addKeyword<Provider, Database>([
  'Contactar asesor',
  'contactar asesor',
  'Hablar con asesor',
  'hablar con asesor',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '🤝 Perfecto, un asesor comercial se comunicará contigo pronto.',
        '',
        'Horario de atención:',
        '📅 Lun-Vie: 8:00 AM - 6:00 PM',
        '📅 Sábados: 8:00 AM - 2:00 PM',
        '',
        'También puedes llamarnos al: 📞 310-232-5151',
      ].join('\n'),
      buttons: [
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const infoGeneralFlow = addKeyword<Provider, Database>([
  'Info general',
  'info general',
  'Información general',
  'información general',
  'informacion general',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        'ℹ️ *Información General - Avellano*',
        '',
        '🐔 Somos una empresa colombiana dedicada a ofrecer productos de la más alta calidad.',
        '',
        '📞 Línea de atención: 310-232-5151',
        '📧 Email: info@avellano.com',
        '📱 Instagram: @AvellanoColombia',
        '',
        '🕒 Horario:',
        'Lun-Vie: 8:00 AM - 6:00 PM',
        'Sábados: 8:00 AM - 2:00 PM',
      ].join('\n'),
      buttons: [
        { body: 'Contactar asesor' },
        { body: 'Volver menú' },
      ],
    },
  ])
})