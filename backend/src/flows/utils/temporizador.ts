import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TIEMPO_INACTIVIDAD = 60 * 1000 * 5 // 10 minutos

const IMAGEN_URL = 'https://res.cloudinary.com/dualljdpg/image/upload/v1765326331/Avelino_jlga3c.jpg'

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
    try {
      // Enviar imagen desde Cloudinary
      await flowDynamic([
        {
          body: '     ',
          media: IMAGEN_URL,
        }
      ])
    } catch (error) {
      console.log('⚠️ No se pudo enviar la imagen Avelino.jpg:', error)
    }
    
    // Enviar mensaje de cierre
    await flowDynamic(mensajeCierre)
    temporizadores.delete(user)
  }, TIEMPO_INACTIVIDAD)
  
  temporizadores.set(user, timer)
}