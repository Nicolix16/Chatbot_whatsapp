import * as dotenv from 'dotenv'
import { EVENTS, createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot'
import { join } from 'path'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'

dotenv.config()
const PORT = process.env.PORT ? Number(process.env.PORT) : 3008

//  Tiempo de inactividad
const TIEMPO_INACTIVIDAD = 60 * 1000 * 10 // 10 min

//  Mensaje de cierre
const mensajeCierre = [
  '💛 Gracias por contactar a *Avellano*.',
  '¡Recuerda que alimentar es amar! 🐔',
  'Te esperamos pronto.',
].join('\n')

// Mapa para manejar temporizadores por usuario
const temporizadores = new Map<string, NodeJS.Timeout>()

// 📋 Función para reiniciar temporizador
async function reiniciarTemporizador(user: string, flowDynamic: any) {
  if (temporizadores.has(user)) clearTimeout(temporizadores.get(user)!)
  const timer = setTimeout(async () => {
    await flowDynamic(mensajeCierre)
    temporizadores.delete(user)
  }, TIEMPO_INACTIVIDAD)
  temporizadores.set(user, timer)
}

// 📌 Flujo principal de bienvenida
const welcomeFlow = addKeyword<Provider, Database>([EVENTS.WELCOME, 'hola', 'Hola', 'menu', 'menú']).addAction(
  async (ctx, { flowDynamic }) => {
    const user = ctx.from
    await reiniciarTemporizador(user, flowDynamic)

    await flowDynamic([
      {
        body: [
          '👋 ¡Hola! Bienvenido(a) a *Avellano*, donde alimentar es amar 💖🐔',
          '',
          'Soy tu asistente virtual y estoy aquí para ayudarte.',
          'Por favor elige una opción para continuar 👇',
        ].join('\n'),
        buttons: [
          { body: '🛒 Pedido' },
          { body: '📖 Recetas' },
          { body: '📞 Atención' },
        ],
      },
    ])
  }
)

// 🎯 Router para acciones de botones/listas (WhatsApp envía ACTION)
const actionRouterFlow = addKeyword<Provider, Database>([EVENTS.ACTION, 'Pedido', 'pedido', '🛒 Pedido']).addAction(
  async (ctx, { gotoFlow }) => {
    const title = (ctx as any).title_button_reply || (ctx as any).title_list_reply || ctx.body || ''
    const text = String(title).trim()
    console.info(`[action] title:"${text}" type:${ctx.type}`)

    const t = text.toLowerCase()
  if (t === '🛒 pedido' || t === 'pedido') return gotoFlow(pedidoFlow)
    if (t === '📖 recetas' || t === 'recetas') return gotoFlow(recetasFlow)
    if (t === '📞 atención' || t === 'atención' || t === 'atencion') return gotoFlow(clienteFlow)
    if (t === '🏠 hogar' || t === 'hogar') return gotoFlow(hogarFlow)
    if (t === '💼 negocios' || t === 'negocios') return gotoFlow(negociosFlow)
    if (t.includes('encuéntranos') || t.includes('encuentranos')) return gotoFlow(encuentranosFlow)
    if (t.includes('volver al menú principal') || t.includes('volver al menu principal')) return gotoFlow(volverMenuFlow)
  }
)

// 🛒 Flujo para realizar pedido (muestra tipo de cliente con botones)
const pedidoFlow = addKeyword<Provider, Database>(['Pedido', 'pedido', '🛒 Pedido', 'realizar pedido'])
  .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
    const user = ctx.from
    console.info(`[flow] Pedido triggered by ${user} -> text: "${ctx.body}"`)

    // Reiniciamos el temporizador (si es parte de tu lógica)
    await reiniciarTemporizador(user, flowDynamic)

    // Mensaje corto + luego botones (con pequeño delay) para evitar que WhatsApp ignore un
    // interactivo inmediatamente después de otro interactivo
    await flowDynamic('Perfecto, vamos a crear tu pedido 🛒')
    await flowDynamic([
      {
        body: 'Antes de continuar, por favor indícanos tu tipo de cliente 👇🐔',
        delay: 400,
        buttons: [
          { body: '🏠 Hogar' },
          { body: '💼 Negocios' },
          { body: '📍 Encuéntranos - Almacenes Avellano' },
        ],
      },
    ])
  })


// 🏠 Flujo para cliente Hogar
const hogarFlow = addKeyword<Provider, Database>([
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
        { body: ' menú principal' },
      ],
    },
  ])
})

// 🛍️ Flujo para cuando el usuario presiona "Hacer pedido" desde Hogar
const hacerPedidoFlow = addKeyword<Provider, Database>(['Hacer pedido', 'hacer pedido', 'BTN_HACER_PEDIDO']).addAction(
  async (ctx, { flowDynamic }) => {
    const user = ctx.from
    await reiniciarTemporizador(user, flowDynamic)
    await flowDynamic('Genial 🛒, ¿qué producto deseas pedir? Por favor indica nombre y cantidad.')
  }
)

// 🔁 Flujo para volver al menú principal
const volverMenuFlow = addKeyword<Provider, Database>([
  'Volver al menú principal',
  'volver al menú principal',
  'Volver al menu principal',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)

  await flowDynamic([
    {
      body: [
        '👋 ¡Hola! Bienvenido(a) nuevamente a *Avellano*, donde alimentar es amar 💖🐔',
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

// 💼 Flujo para cliente Negocios
const negociosFlow = addKeyword<Provider, Database>([
  '2',
  '2. Negocios',
  'negocios',
  '💼 Negocios',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await flowDynamic(
    'Perfecto — Pedido para *Negocios*. Por favor indícanos el tipo de negocio (tienda, carnicería, asador, restaurante, etc.) y la cantidad aproximada.'
  )
})

// 📍 Flujo para cuando el usuario selecciona "Encuéntranos"
const encuentranosFlow = addKeyword<Provider, Database>([
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
        '📍 Encuéntranos en *Almacenes Avellano*:',
        '📌 Dirección: Calle Falsa 123, Ciudad (ejemplo)',
        '🕒 Horario: Lunes a Sábado 8:00 - 18:00',
        '',
        '¿Deseas que te comparta la ubicación o ver la lista de sucursales?',
      ].join('\n'),
      buttons: [
        { body: 'Compartir ubicación' },
        { body: 'Ver sucursales' },
      ],
    },
  ])
})

// 📖 Flujo de recetas
const recetasFlow = addKeyword<Provider, Database>(['📖 Recetas', 'Recetas']).addAction(
  async (ctx, { flowDynamic }) => {
    const user = ctx.from
    await reiniciarTemporizador(user, flowDynamic)
    await flowDynamic('Aquí tienes nuestras recetas favoritas 👩‍🍳🍗.')
  }
)

// ☎️ Flujo de atención al cliente
const clienteFlow = addKeyword<Provider, Database>(['📞 Atención', 'Atención']).addAction(
  async (ctx, { flowDynamic }) => {
    const user = ctx.from
    await reiniciarTemporizador(user, flowDynamic)
    await flowDynamic('Nuestro equipo de soporte está aquí para ayudarte 💬.')
  }
)

// 🔧 Configuración del bot
const main = async () => {
  const adapterFlow = createFlow([
    welcomeFlow,
    pedidoFlow,
    hogarFlow,
    hacerPedidoFlow,
    volverMenuFlow,
    negociosFlow,
    encuentranosFlow,
    recetasFlow,
    clienteFlow,
    actionRouterFlow,
  ])

  const adapterProvider = createProvider(Provider, {
    jwtToken: process.env.JWT_TOKEN,
    numberId: process.env.NUMBER_ID,
    verifyToken: process.env.VERIFY_TOKEN,
    version: process.env.PROVIDER_VERSION,
  })

  const adapterDB = new Database()

  const { httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })

  httpServer(PORT)
  console.log(`✅ Bot Avellano ejecutándose en el puerto ${PORT}`)
}

main()
