// Script para verificar configuración de usuarios para notificaciones
import mongoose from 'mongoose'
import Usuario from '../models/Usuario.js'
import 'dotenv/config'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot'

async function verificarUsuarios() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Conectado a MongoDB')
    console.log('\n=== VERIFICACIÓN DE USUARIOS PARA NOTIFICACIONES ===\n')

    // 1. Verificar administradores
    const administradores = await Usuario.find({ rol: 'administrador' })
    console.log(`\n📋 ADMINISTRADORES (${administradores.length}):`)
    administradores.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.nombre || 'Sin nombre'}) - Activo: ${admin.activo}`)
    })

    // 2. Verificar usuarios con rol hogares
    const usuariosHogares = await Usuario.find({ rol: 'hogares' })
    console.log(`\n🏠 USUARIOS ROL HOGARES (${usuariosHogares.length}):`)
    usuariosHogares.forEach(user => {
      console.log(`  - ${user.email} (${user.nombre || 'Sin nombre'}) - Activo: ${user.activo}`)
    })

    // 3. Verificar operadores por tipo
    const tiposOperador = ['mayorista', 'ejecutivo_horecas', 'director_comercial', 'coordinador_masivos']
    
    for (const tipo of tiposOperador) {
      const operadores = await Usuario.find({ rol: 'operador', tipoOperador: tipo })
      console.log(`\n👤 OPERADORES ${tipo.toUpperCase()} (${operadores.length}):`)
      operadores.forEach(op => {
        console.log(`  - ${op.email} (${op.nombre || 'Sin nombre'}) - Activo: ${op.activo}`)
      })
    }

    // 4. Resumen de usuarios activos
    console.log('\n\n=== RESUMEN DE USUARIOS ACTIVOS ===\n')
    
    const adminsActivos = await Usuario.countDocuments({ rol: 'administrador', activo: true })
    const hogaresActivos = await Usuario.countDocuments({ rol: 'hogares', activo: true })
    const mayoristasActivos = await Usuario.countDocuments({ rol: 'operador', tipoOperador: 'mayorista', activo: true })
    const horecasActivos = await Usuario.countDocuments({ rol: 'operador', tipoOperador: 'ejecutivo_horecas', activo: true })
    const directorActivos = await Usuario.countDocuments({ rol: 'operador', tipoOperador: 'director_comercial', activo: true })
    const masivosActivos = await Usuario.countDocuments({ rol: 'operador', tipoOperador: 'coordinador_masivos', activo: true })

    console.log(`✅ Administradores activos: ${adminsActivos}`)
    console.log(`✅ Usuarios hogares activos: ${hogaresActivos}`)
    console.log(`✅ Operadores mayorista activos: ${mayoristasActivos}`)
    console.log(`✅ Operadores ejecutivo_horecas activos: ${horecasActivos}`)
    console.log(`✅ Operadores director_comercial activos: ${directorActivos}`)
    console.log(`✅ Operadores coordinador_masivos activos: ${masivosActivos}`)

    console.log('\n\n=== MAPEO DE NOTIFICACIONES ===\n')
    console.log('📦 Tipo Cliente → Operador Notificado:')
    console.log('  • hogar → Usuarios con rol "hogares"')
    console.log('  • mayorista → Operadores tipo "mayorista"')
    console.log('  • restaurante_premium → Operadores tipo "ejecutivo_horecas"')
    console.log('  • tienda → Operadores tipo "director_comercial"')
    console.log('  • asadero → Operadores tipo "director_comercial"')
    console.log('  • restaurante_estandar → Operadores tipo "director_comercial"')
    
    console.log('\n⚠️  Notificaciones de usuarios → Todos los administradores activos')

    await mongoose.disconnect()
    console.log('\n✅ Desconectado de MongoDB')
  } catch (error) {
    console.error('❌ Error:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

verificarUsuarios()
