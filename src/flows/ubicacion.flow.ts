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
        '📍 *¿Dónde nos encuentras?*',
        '',
        '🏙️ *En Villavicencio:*',
        '• 7 de Agosto',
        '• Reliquia',
        '• La Rochela',
        '• Porfía',
        '• Madrigal',
        '• Morichal',
        '• Villamelida',
        '• Coralina',
        '',
        '🌆 *Fuera de Villavicencio:*',
        '• Acacias',
        '• Granada',
        '• Puerto López',
        '• Villanueva',
        '• San José del Guaviare',
        '',
        '📞 Villavicencio: 310-232-5151',
        '📞 Fuera de Villavicencio: 323-274-7647',
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
    '🏪 *Nuestras Sucursales - Almacenes Avellano*',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '🏙️ *EN VILLAVICENCIO:*',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '📍 *7 de Agosto*',
    '📌 CARRERA 38 # 26B-40',
    'https://maps.app.goo.gl/gikVjDW7KPxyKbog8',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *Reliquia*',
    '📌 MZ 19 CS 3',
    'https://maps.app.goo.gl/MQ3jQriTfdG8oq6S8',
    '🕒 Horario: Lun-Sáb 6:00 AM - 7:00 PM',
    '',
    '📍 *La Rochela*',
    'https://maps.app.goo.gl/f9jmx8QausbKkohs9',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *Porfía*',
    '📌 CRA 43 #51 -27 PORFIA',
    'https://maps.app.goo.gl/XsY8UfyJK3fMViNu5',
    '🕒 Horario: Lun-Sáb 6:00 AM - 7:00 PM',
    '',
    '📍 *Porfía 2*',
    '📌 K 43 # 51 SUR 11',
    'https://maps.app.goo.gl/XsY8UfyJK3fMViNu5',
    '🕒 Horario: Lun-Sáb 6:00 AM - 7:00 PM',
    '',
    '📍 *Madrigal*',
    '📌 CALLE 38 A # 16B-62',
    'https://maps.app.goo.gl/4FHaiEtWC1RyKR3r7',
    '🕒 Horario: Lun-Sáb 6:00 AM - 7:00 PM',
    '',
    '📍 *Morichal*',
    '📌 CRA 18 ESTE 38-16 MZ52CS15',
    'https://maps.app.goo.gl/itK96rDeZTLyDsd67',
    '🕒 Horario: Lun-Sáb 6:00 AM - 7:00 PM',
    '',
    '📍 *Villamelida*',
    '📌 CRA 11E 16-28 SUR LC 2',
    'https://maps.app.goo.gl/dwMjUaTU5R7Bjzeo7',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *Coralina*',
    '📌 CRA 32C -17 SEQUICENTENARIO',
    'https://maps.app.goo.gl/3kwMJCaQGeSNVpxVA',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '🌆 *FUERA DE VILLAVICENCIO:*',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '📍 *Acacias*',
    '📌 CALLE 14 # 19-04',
    'https://maps.app.goo.gl/MHd4jRmPbvifobbz8',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *Granada*',
    '📌 CALLE 18 # 13-97 LC 1',
    'https://maps.app.goo.gl/DPGGKn5HWpYaqykc8',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *Puerto López*',
    '📌 CALLE 5 # 7-17',
    'https://maps.app.goo.gl/i7hGceR2V8TL5JC27',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *Villanueva*',
    '📌 CL 15 # 12 02',
    'https://maps.app.goo.gl/PjJbFFFiMSToiF9p6',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '📍 *San José del Guaviare*',
    '📌 CRA 20 # 10-24 PORVENIR',
    'https://maps.app.goo.gl/hCG8MSmfMFUpPphT8',
    '🕒 Horario: Lun-Sáb 8:00 AM - 6:00 PM',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    '📞 *Villavicencio:* 310-232-5151',
    '📞 *Fuera de Villavicencio:* 323-274-7647',
  ].join('\n'))
  
  await flowDynamic([
    {
      body: '¿Deseas hacer algo más?',
      buttons: [
        { body: 'Ver ubicación' },
        { body: 'Volver menú' },
      ],
    },
  ])
})