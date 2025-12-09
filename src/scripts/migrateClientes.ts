import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import Cliente from '../models/Cliente'

dotenv.config()

// Mapeo de texto de ubicación antigua a tipo de responsable
function convertirUbicacionAResponsable(ubicacion?: string): 'coordinador_masivos' | 'director_comercial' | 'ejecutivo_horecas' | 'mayorista' | null {
  if (!ubicacion) return null
  
  const ubicacionLower = ubicacion.toLowerCase()
  
  if (ubicacionLower.includes('coordinador de masivos') || ubicacionLower.includes('3232747647')) {
    return 'coordinador_masivos'
  }
  
  if (ubicacionLower.includes('director comercial') || ubicacionLower.includes('3108540251')) {
    return 'director_comercial'
  }
  
  if (ubicacionLower.includes('ejecutivo horecas') || ubicacionLower.includes('3138479027')) {
    return 'ejecutivo_horecas'
  }
  
  if (ubicacionLower.includes('mayorista') || ubicacionLower.includes('3214057410')) {
    return 'mayorista'
  }
  
  return null
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('❌ Falta MONGO_URI en el entorno (.env)')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Conectado a MongoDB')

    // Obtener todos los clientes
    const todosClientes = await Cliente.find({})
    console.log(`📊 Total de clientes en BD: ${todosClientes.length}`)
    
    // Obtener todos los clientes que tienen ubicacion usando lean() para acceso directo
    const clientes = await Cliente.find({ ubicacion: { $exists: true, $ne: null } }).lean()
    
    console.log(`📊 Encontrados ${clientes.length} clientes con campo 'ubicacion'`)
    console.log('')
    
    let migrados = 0
    let sinCambios = 0
    
    for (const cliente of clientes) {
      // @ts-ignore - ubicacion puede existir en documentos antiguos
      const ubicacionValue = cliente.ubicacion
      const responsable = convertirUbicacionAResponsable(ubicacionValue)
      
      if (responsable) {
        // Actualizar usando updateOne directamente
        await Cliente.updateOne(
          { _id: cliente._id },
          { 
            $set: { responsable },
            $unset: { ubicacion: '' }
          }
        )
        console.log(`✅ Cliente migrado exitosamente -> ${responsable}`)
        migrados++
      } else {
        console.log(`⚠️ No se pudo determinar responsable para cliente (ubicacion: ${ubicacionValue})`)
        sinCambios++
      }
    }
    
    console.log('')
    console.log('📊 Resumen de migración:')
    console.log(`   ✅ Migrados: ${migrados}`)
    console.log(`   ⚠️ Sin cambios: ${sinCambios}`)
    console.log('')
    console.log('🎉 Migración completada!')
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Error en migración:', err)
    process.exit(1)
  }
}

main()
