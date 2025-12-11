import mongoose from 'mongoose'
import { getEnvVar } from './environment.js'

export async function connectDatabase(maxRetries = 5, retryDelay = 5000) {
  const MONGO_URI = getEnvVar('MONGO_URI', 'mongodb://localhost:27017/avellano-chatbot')
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intentando conectar a MongoDB (intento ${attempt}/${maxRetries})...`)
      
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000, // 10 segundos timeout
        socketTimeoutMS: 45000, // 45 segundos socket timeout
        family: 4 // Forzar IPv4 (evita problemas de DNS con IPv6)
      })
      
      console.log('✅ MongoDB conectado exitosamente')
      console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}`)
      console.log(`🌐 Host: ${mongoose.connection.host}`)
      return
      
    } catch (error: any) {
      console.error(`❌ Error conectando API a MongoDB (intento ${attempt}/${maxRetries}):`, error)
      
      if (attempt === maxRetries) {
        console.error('\n⚠️ IMPORTANTE: Verifica lo siguiente:')
        console.error('1. ¿La variable MONGO_URI está configurada correctamente?')
        console.error('2. ¿MongoDB Atlas tiene tu IP en la whitelist?')
        console.error('3. ¿Tienes conexión a internet estable?')
        console.error('4. ¿El usuario/contraseña de MongoDB son correctos?\n')
        
        // No salir del proceso, permitir que la app funcione sin DB
        console.error('⚠️ La aplicación continuará SIN conexión a MongoDB')
        return
      }
      
      console.log(`⏳ Reintentando en ${retryDelay / 1000} segundos...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
}

export async function disconnectDatabase() {
  try {
    await mongoose.disconnect()
    console.log('👋 MongoDB desconectado')
  } catch (error) {
    console.error('Error desconectando MongoDB:', error)
  }
}
