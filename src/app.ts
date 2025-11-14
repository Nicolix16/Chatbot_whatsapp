import * as dotenv from 'dotenv'
import { EVENTS, createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot'
import { join } from 'path'
import { MongoAdapter } from '@builderbot/database-mongo'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import mongoose from 'mongoose'
import Cliente from './models/Cliente'

dotenv.config()
const PORT = process.env.PORT ? Number(process.env.PORT) : 3008
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/avellano-chatbot'

// Type alias para compatibilidad
type Database = typeof MongoAdapter

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
    const listId = (ctx as any).id_list_reply || ''
    const text = String(title).trim()
    const id = String(listId).trim()
    console.info(`[action] title:"${text}" id:"${id}" type:${ctx.type}`)

    const t = text.toLowerCase()
    
    console.log(`🔀 Router activado con texto: "${t}"`)
    
    // Router por texto de botones
    if (t === '🛒 pedido' || t === 'pedido') {
      console.log('➡️ Redirigiendo a pedidoFlow')
      return gotoFlow(pedidoFlow)
    }
    if (t === '📖 recetas' || t === 'recetas') return gotoFlow(recetasFlow)
    if (t === '📞 atención' || t === 'atención' || t === 'atencion') return gotoFlow(clienteFlow)
    if (t === '🏠 hogar' || t === 'hogar') return gotoFlow(hogarFlow)
    if (t === '💼 negocios' || t === 'negocios') {
      console.log('➡️ Redirigiendo a negociosFlow')
      return gotoFlow(negociosFlow)
    }
    if (t.includes('encuéntranos') || t.includes('encuentranos')) return gotoFlow(encuentranosFlow)
    if (t.includes('volver menú') || t.includes('volver menu')) return gotoFlow(volverMenuFlow)
    if (t.includes('hacer pedido')) return gotoFlow(hacerPedidoFlow)
    if (t.includes('enviar info')) {
      console.log('➡️ Redirigiendo a enviarInfoNegocioFlow')
      return gotoFlow(enviarInfoNegocioFlow)
    }
    if (t.includes('hablar con asesor') || t.includes('contactar asesor')) return gotoFlow(contactarAsesorFlow)
    if (t.includes('info general')) return gotoFlow(infoGeneralFlow)
    if (t.includes('ver ubicación') || t.includes('ver ubicacion')) return gotoFlow(verUbicacionFlow)
    if (t.includes('ver sucursales')) return gotoFlow(verSucursalesFlow)
    if (t.includes('🍗 pollo') || t === 'pollo' || t === '🍗 pollo') return gotoFlow(recetasPolloFlow)
    if (t.includes('🥩 carnes') || t === 'carnes' || t === '🥩 carnes') return gotoFlow(recetasCarnesFlow)
  }
)

// 🛒 Flujo para realizar pedido (muestra tipo de cliente con botones)
const pedidoFlow = addKeyword<Provider, Database>(['Pedido', 'pedido', '🛒 Pedido', 'realizar pedido'])
  .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
    const user = ctx.from
    console.info(`[flow] Pedido triggered by ${user} -> text: "${ctx.body}"`)
    console.log('🛒 pedidoFlow: Iniciando flujo de pedido')
    console.log('🛒 pedidoFlow: ctx.body =', ctx.body)
    console.log('🛒 pedidoFlow: ctx.type =', ctx.type)

    // Reiniciamos el temporizador (si es parte de tu lógica)
    await reiniciarTemporizador(user, flowDynamic)

    console.log('🛒 pedidoFlow: Enviando mensaje con botones')

    // Mensaje corto + luego botones (con pequeño delay) para evitar que WhatsApp ignore un
    // interactivo inmediatamente después de otro interactivo
    await flowDynamic([
      {
        body: [
          'Perfecto, vamos a crear tu pedido 🛒',
          '',
          'Antes de continuar, por favor indícanos tu tipo de cliente 👇🐔',
        ].join('\n'),
        buttons: [
          { body: '🏠 Hogar' },
          { body: '💼 Negocios' },
          { body: '📍 Encuéntranos' },
        ],
      },
    ])
    
    console.log('🛒 pedidoFlow: Mensaje enviado, flujo completado')
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
        { body: 'Volver menú' },
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

// 💼 Flujo para cliente Negocios
const negociosFlow = addKeyword<Provider, Database>([
  '2',
  '2. Negocios',
  'negocios',
  '💼 Negocios',
]).addAction(async (ctx, { flowDynamic }) => {
  const user = ctx.from
  await reiniciarTemporizador(user, flowDynamic)
  await flowDynamic([
    {
      body: [
        '¡Excelente! Atiendo a negocios como tiendas, asaderos, pollerías, restaurantes estándar, comidas rápidas, carnicerías, etc.',
        '',
        'Por favor comparte los siguientes datos para enviarte tu cotización personalizada:',
        '• Nombre del negocio',
        '• Ciudad o zona',
        '• Persona de contacto',
        '• Productos de interés',
        '',
        'Un asesor comercial se comunicará contigo',
      ].join('\n'),
      buttons: [
        { body: 'Enviar info' },
        { body: 'Volver menú' },
      ],
    },
  ])
})

// 📝 Flujo para enviar información de negocios
const enviarInfoNegocioFlow = addKeyword<Provider, Database>([
  'Enviar info',
  'enviar info',
  'Enviar información',
  'enviar información',
  'enviar informacion',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  
  console.log(`📝 enviarInfoNegocioFlow: ctx.body = "${ctx.body}"`)
  console.log(`📝 enviarInfoNegocioFlow: Verificando si coincide con "Enviar info"...`)
  
  // Verificar que el texto coincida
  const texto = ctx.body.toLowerCase()
  if (!texto.includes('enviar info') && !texto.includes('enviar información') && !texto.includes('enviar informacion')) {
    console.log(`⏭️ enviarInfoNegocioFlow: Texto no coincide, saliendo...`)
    return
  }
  
  console.log(`✅ enviarInfoNegocioFlow: Texto coincide, continuando...`)
  
  await reiniciarTemporizador(user, flowDynamic)
  
  console.log(`🏢 enviarInfoNegocioFlow activado para: ${user}`)
  
  // Marcar que esperamos los datos del negocio
  await state.update({ esperandoDatosNegocio: true })
  
  console.log('✅ Estado actualizado: esperandoDatosNegocio = true')
  
  await flowDynamic([
    '¡Perfecto! 📝',
    '',
    'Por favor envíame los datos de tu negocio en un solo mensaje:',
    '',
    '🏢 Nombre del negocio:',
    '📍 Ciudad o zona:',
    '👤 Persona de contacto:',
    '🛒 Productos de interés:',
    '',
    'Ejemplo:',
    '🏢 Asadero El Sabor',
    '📍 Bogotá - Chapinero',
    '👤 Juan Pérez',
    '🛒 Pollo, alitas, muslos',
  ].join('\n'))
})

// 💾 Flujo para capturar y guardar datos del negocio
const capturarDatosNegocioFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState()
    
    console.log('🔍 capturarDatosNegocioFlow activado')
    console.log('🔍 Estado:', myState)
    console.log('🔍 ctx.body:', ctx.body)
    
    // Solo procesar si estamos esperando datos del negocio
    if (!myState || !myState.esperandoDatosNegocio) {
      console.log('⏭️ No estamos esperando datos, saliendo...')
      return
    }
    
    const user = ctx.from
    const datosNegocio = ctx.body
    
    console.log(`📝 Procesando datos de negocio para: ${user}`)
    console.log(`📝 Datos recibidos: ${datosNegocio}`)
    
    try {
      // Buscar si el cliente ya existe
      let cliente = await Cliente.findOne({ telefono: user })
      
      if (cliente) {
        console.log(`📂 Cliente existente encontrado: ${user}`)
        // Actualizar cliente existente
        cliente.tipoCliente = 'negocio'
        cliente.productosInteres = datosNegocio
        cliente.ultimaInteraccion = new Date()
        cliente.conversaciones += 1
        await cliente.save()
      } else {
        console.log(`🆕 Creando nuevo cliente: ${user}`)
        // Crear nuevo cliente
        cliente = new Cliente({
          telefono: user,
          tipoCliente: 'negocio',
          productosInteres: datosNegocio,
          fechaRegistro: new Date(),
          ultimaInteraccion: new Date(),
          conversaciones: 1,
        })
        await cliente.save()
      }
      
      // Limpiar estado
      await state.update({ esperandoDatosNegocio: false })
      
      await flowDynamic([
        '✅ ¡Información recibida y guardada!',
        '',
        '📋 Datos registrados:',
        datosNegocio,
        '',
        '👨‍💼 Un asesor comercial revisará tu solicitud y se comunicará contigo pronto.',
        '',
        '📞 También puedes llamarnos: 310-232-5151',
      ].join('\n'))
      
      console.log(`✅ Cliente guardado en BD: ${user}`)
      
    } catch (error) {
      console.error('❌ Error guardando en BD:', error)
      await flowDynamic('Hubo un error al guardar tu información. Por favor intenta de nuevo.')
    }
  })

// 🤝 Flujo para contactar con asesor
const contactarAsesorFlow = addKeyword<Provider, Database>([
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

// 🗺️ Flujo para ver ubicación
const verUbicacionFlow = addKeyword<Provider, Database>([
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

// 🏪 Flujo para ver sucursales
const verSucursalesFlow = addKeyword<Provider, Database>([
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

// 📖 Flujo de recetas
const recetasFlow = addKeyword<Provider, Database>(['📖 Recetas', 'Recetas']).addAction(
  async (ctx, { flowDynamic }) => {
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
  }
)

// 🍗 Flujo de recetas de pollo
const recetasPolloFlow = addKeyword<Provider, Database>(['🍗 Pollo', 'Pollo', 'recetas pollo']).addAction(
  async (ctx, { flowDynamic }) => {
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
  }
)

// 🥩 Flujo de recetas de carnes
const recetasCarnesFlow = addKeyword<Provider, Database>(['🥩 Carnes', 'Carnes', 'recetas carnes']).addAction(
  async (ctx, { flowDynamic }) => {
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
  }
)

// ☎️ Flujo de atención al cliente
const clienteFlow = addKeyword<Provider, Database>(['📞 Atención', 'Atención']).addAction(
  async (ctx, { flowDynamic }) => {
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
  }
)

// ℹ️ Flujo de información general
const infoGeneralFlow = addKeyword<Provider, Database>([
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

// 🔧 Configuración del bot
const main = async () => {
  // 🔌 Conectar Mongoose a MongoDB
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Mongoose conectado a MongoDB')
  } catch (error) {
    console.error('❌ Error conectando Mongoose a MongoDB:', error)
    process.exit(1)
  }

  const adapterFlow = createFlow([
    capturarDatosNegocioFlow, // PRIMERO para capturar datos cuando el estado está activo
    welcomeFlow,
    pedidoFlow,
    hogarFlow,
    hacerPedidoFlow,
    volverMenuFlow,
    negociosFlow,
    enviarInfoNegocioFlow,
    contactarAsesorFlow,
    encuentranosFlow,
    verUbicacionFlow,
    verSucursalesFlow,
    recetasFlow,
    recetasPolloFlow,
    recetasCarnesFlow,
    clienteFlow,
    infoGeneralFlow,
    actionRouterFlow,
  ])

  const adapterProvider = createProvider(Provider, {
    jwtToken: process.env.JWT_TOKEN,
    numberId: process.env.NUMBER_ID,
    verifyToken: process.env.VERIFY_TOKEN,
    version: process.env.PROVIDER_VERSION,
  })

  const adapterDB = new MongoAdapter({
    dbUri: MONGO_URI,
    dbName: 'avellano-chatbot',
  })

  const { httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })

  httpServer(PORT)
  console.log(`✅ Bot Avellano ejecutándose en el puerto ${PORT}`)
  console.log(`📊 Base de datos MongoDB conectada`)
}

main()
