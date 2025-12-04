import { addKeyword, EVENTS } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'
import { reiniciarTemporizador } from './utils/temporizador.js'
import Cliente from '../models/Cliente.js'

type Database = typeof MongoAdapter

export const negociosFlow = addKeyword<Provider, Database>([
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

export const enviarInfoNegocioFlow = addKeyword<Provider, Database>([
  'Enviar info',
  'enviar info',
  'Enviar información',
  'enviar información',
  'enviar informacion',
]).addAction(async (ctx, { flowDynamic, state }) => {
  const user = ctx.from
  
  console.log(`📝 enviarInfoNegocioFlow: ctx.body = "${ctx.body}"`)
  
  const texto = ctx.body.toLowerCase()
  if (!texto.includes('enviar info') && !texto.includes('enviar información') && !texto.includes('enviar informacion')) {
    console.log(`⏭️ enviarInfoNegocioFlow: Texto no coincide, saliendo...`)
    return
  }
  
  console.log(`✅ enviarInfoNegocioFlow: Texto coincide, continuando...`)
  
  await reiniciarTemporizador(user, flowDynamic)
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

export const capturarDatosNegocioFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState()
    
    console.log('🔍 capturarDatosNegocioFlow activado')
    console.log('🔍 Estado:', myState)
    
    if (!myState || !myState.esperandoDatosNegocio) {
      console.log('⏭️ No estamos esperando datos, saliendo...')
      return
    }
    
    const user = ctx.from
    const datosNegocio = ctx.body
    
    console.log(`📝 Procesando datos de negocio para: ${user}`)
    
    try {
      let cliente = await Cliente.findOne({ telefono: user })
      
      if (cliente) {
        console.log(`📂 Cliente existente encontrado: ${user}`)
        cliente.tipoCliente = 'negocio'
        cliente.productosInteres = datosNegocio
        cliente.ultimaInteraccion = new Date()
        cliente.conversaciones += 1
        await cliente.save()
      } else {
        console.log(`🆕 Creando nuevo cliente: ${user}`)
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