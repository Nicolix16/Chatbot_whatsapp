import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const encuentranosFlow = addKeyword<Provider, Database>([
  '3',
  '3. Encuéntranos',
  '3. Encuéntranos - Almacenes Avellano',
  'encuéntranos',
  'encuentranos',
  '📍 Encuéntranos - Almacenes Avellano',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '📍 *Encuéntranos en Almacenes Avellano*',
        '',
        '🏪 Tenemos varias sucursales para atenderte mejor.',
        '',
        '¿Qué te gustaría hacer?',
      ].join('\n'),
      buttons: [
        { body: 'Ver ubicación' },
        { body: 'Ver sucursales' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const verUbicacionFlow = addKeyword<Provider, Database>([
  'Ver ubicación',
  'ver ubicación',
  'ver ubicacion',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '📍 *Almacén Principal - Avellano*',
        '',
        '📌 Dirección: Carrera 7 # 45-23, Bogotá',
        '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
        '📞 Teléfono: 310-232-5151',
        '',
        '¡Te esperamos! 🐔',
      ].join('\n'),
      buttons: [
        { body: 'Ver sucursales' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const verSucursalesFlow = addKeyword<Provider, Database>([
  'Ver sucursales',
  'ver sucursales',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '🏪 *Nuestras Sucursales:*',
        '',
        '1️⃣ *Almacén Norte*',
        '📍 Calle 170 # 54-32, Bogotá',
        '📞 310-111-2222',
        '',
        '2️⃣ *Almacén Sur*',
        '📍 Av. Américas # 68-45, Bogotá',
        '📞 310-333-4444',
        '',
        '3️⃣ *Almacén Centro*',
        '📍 Carrera 7 # 45-23, Bogotá',
        '📞 310-232-5151',
        '',
        '🕒 Todas: Lun-Sáb 8:00 AM - 6:00 PM',
      ].join('\n'),
      buttons: [
        { body: 'Volver menú' },
      ],
    },
  ])
})