import { addKeyword, EVENTS } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { MongoAdapter } from '@builderbot/database-mongo'

type Database = typeof MongoAdapter

export const actionRouterFlow = addKeyword<Provider, Database>([
  EVENTS.ACTION,
  'Pedido',
  'pedido',
  '🛒 Pedido'
]).addAction(async (ctx, { gotoFlow }) => {
  const title = (ctx as any).title_button_reply || (ctx as any).title_list_reply || ctx.body || ''
  const text = String(title).trim().toLowerCase()
  
  console.info(`[router] Texto: "${text}" | Tipo: ${ctx.type}`)
  
  // Importaciones dinámicas para evitar dependencias circulares
  const { pedidoFlow } = await import('./pedido.flow.js')
  const { recetasFlow, recetasPolloFlow, recetasCarnesFlow } = await import('./recetas.flow.js')
  const { clienteFlow, contactarAsesorFlow, infoGeneralFlow } = await import('./atencion.flow.js')
  const { hogarFlow, hacerPedidoFlow } = await import('./hogar.flow.js')
  const { negociosFlow, enviarInfoNegocioFlow } = await import('./negocios.flow.js')
  const { encuentranosFlow, verUbicacionFlow, verSucursalesFlow } = await import('./ubicacion.flow.js')
  const { volverMenuFlow } = await import('./navigation.flow.js')
  
  // Router por texto de botones
  if (text === '🛒 pedido' || text === 'pedido') return gotoFlow(pedidoFlow)
  if (text === '📖 recetas' || text === 'recetas') return gotoFlow(recetasFlow)
  if (text === '📞 atención' || text === 'atención' || text === 'atencion') return gotoFlow(clienteFlow)
  if (text === '🏠 hogar' || text === 'hogar') return gotoFlow(hogarFlow)
  if (text === '💼 negocios' || text === 'negocios') return gotoFlow(negociosFlow)
  if (text.includes('encuéntranos') || text.includes('encuentranos')) return gotoFlow(encuentranosFlow)
  if (text.includes('volver menú') || text.includes('volver menu')) return gotoFlow(volverMenuFlow)
  if (text.includes('hacer pedido')) return gotoFlow(hacerPedidoFlow)
  if (text.includes('enviar info')) return gotoFlow(enviarInfoNegocioFlow)
  if (text.includes('hablar con asesor') || text.includes('contactar asesor')) return gotoFlow(contactarAsesorFlow)
  if (text.includes('info general')) return gotoFlow(infoGeneralFlow)
  if (text.includes('ver ubicación') || text.includes('ver ubicacion')) return gotoFlow(verUbicacionFlow)
  if (text.includes('ver sucursales')) return gotoFlow(verSucursalesFlow)
  if (text.includes('🍗 pollo') || text === 'pollo') return gotoFlow(recetasPolloFlow)
  if (text.includes('🥩 carnes') || text === 'carnes') return gotoFlow(recetasCarnesFlow)
})