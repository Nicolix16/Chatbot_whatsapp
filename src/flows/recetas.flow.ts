import { addKeyword } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'

type Database = typeof MongoAdapter

export const recetasFlow = addKeyword<Provider, Database>([
  '📖 Recetas',
  'Recetas'
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '👩‍🍳 *¡Descubre nuestras deliciosas recetas!* 🍗',
        '',
        'Selecciona una categoría para ver recetas increíbles:',
      ].join('\n'),
      buttons: [
        { body: '🍗 Pollo' },
        { body: '🥩 Carnes' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const recetasPolloFlow = addKeyword<Provider, Database>([
  '🍗 Pollo',
  'Pollo',
  'recetas pollo'
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '🍗 *Recetas de Pollo Avellano*',
        '',
        '1️⃣ Pollo al Horno con Hierbas',
        '2️⃣ Alitas BBQ Picantes',
        '3️⃣ Pechuga a la Plancha',
        '4️⃣ Pollo Apanado Crujiente',
        '',
        '📲 Visita nuestro Instagram @AvellanoColombia para ver las recetas completas.',
      ].join('\n'),
      buttons: [
        { body: '🥩 Carnes' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

export const recetasCarnesFlow = addKeyword<Provider, Database>([
  '🥩 Carnes',
  'Carnes',
  'recetas carnes'
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  
  await flowDynamic([
    {
      body: [
        '🥩 *Recetas de Carnes Avellano*',
        '',
        '1️⃣ Lomo de Cerdo al Vino',
        '2️⃣ Carne Asada Marinada',
        '3️⃣ Costillas BBQ',
        '4️⃣ Chuletas a la Parrilla',
        '',
        '📲 Visita nuestro Instagram @AvellanoColombia para ver las recetas completas.',
      ].join('\n'),
      buttons: [
        { body: '🍗 Pollo' },
        { body: 'Volver menú' },
      ],
    },
  ])
})