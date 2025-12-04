const TIEMPO_INACTIVIDAD = 60 * 1000 * 10 // 10 minutos

const mensajeCierre = [
  '💛 Gracias por contactar a *Avellano*.',
  '¡Recuerda que alimentar es amar! 🐔',
  'Te esperamos pronto.',
].join('\n')

const temporizadores = new Map<string, NodeJS.Timeout>()

export async function reiniciarTemporizador(user: string, flowDynamic: any) {
  if (temporizadores.has(user)) {
    clearTimeout(temporizadores.get(user)!)
  }
  
  const timer = setTimeout(async () => {
    await flowDynamic(mensajeCierre)
    temporizadores.delete(user)
  }, TIEMPO_INACTIVIDAD)
  
  temporizadores.set(user, timer)
}