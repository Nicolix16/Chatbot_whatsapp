// Script para probar el sistema de notificaciones manualmente
import mongoose from 'mongoose'
import Usuario from '../models/Usuario.js'
import Notificacion from '../models/Notificacion.js'
import { notificarNuevoPedido, notificarUsuarioDesactivado, notificarUsuarioEliminado } from '../services/notificaciones.service.js'
import 'dotenv/config'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot'

async function probarNotificaciones() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Conectado a MongoDB\n')

    // Limpiar notificaciones de prueba anteriores
    await Notificacion.deleteMany({ mensaje: /PRUEBA/ })
    console.log('🧹 Notificaciones de prueba anteriores eliminadas\n')

    console.log('=== PRUEBA 1: Notificación de pedido HOGAR ===')
    const notifs1 = await notificarNuevoPedido('test-pedido-hogar-1', 'hogar', 'Juan Pérez (PRUEBA)')
    console.log(`✅ Creadas ${notifs1.length} notificaciones para pedido hogar\n`)

    console.log('=== PRUEBA 2: Notificación de pedido MAYORISTA ===')
    const notifs2 = await notificarNuevoPedido('test-pedido-mayorista-1', 'mayorista', 'Distribuidora XYZ (PRUEBA)')
    console.log(`✅ Creadas ${notifs2.length} notificaciones para pedido mayorista\n`)

    console.log('=== PRUEBA 3: Notificación de pedido RESTAURANTE PREMIUM ===')
    const notifs3 = await notificarNuevoPedido('test-pedido-premium-1', 'restaurante_premium', 'Hotel Luxury (PRUEBA)')
    console.log(`✅ Creadas ${notifs3.length} notificaciones para pedido restaurante_premium\n`)

    console.log('=== PRUEBA 4: Notificación de pedido TIENDA ===')
    const notifs4 = await notificarNuevoPedido('test-pedido-tienda-1', 'tienda', 'Tienda La Esquina (PRUEBA)')
    console.log(`✅ Creadas ${notifs4.length} notificaciones para pedido tienda\n`)

    console.log('=== PRUEBA 5: Notificación de usuario desactivado ===')
    const notifs5 = await notificarUsuarioDesactivado('test@example.com', 'Usuario de PRUEBA')
    console.log(`✅ Creadas ${notifs5.length} notificaciones para usuario desactivado\n`)

    console.log('=== PRUEBA 6: Notificación de usuario eliminado ===')
    const notifs6 = await notificarUsuarioEliminado('test2@example.com', 'Usuario de PRUEBA 2')
    console.log(`✅ Creadas ${notifs6.length} notificaciones para usuario eliminado\n`)

    // Mostrar resumen
    console.log('\n=== RESUMEN DE NOTIFICACIONES CREADAS ===')
    const todasNotificaciones = await Notificacion.find({ mensaje: /PRUEBA/ }).populate('usuarioDestinoEmail')
    console.log(`\nTotal de notificaciones de prueba: ${todasNotificaciones.length}\n`)
    
    todasNotificaciones.forEach(notif => {
      console.log(`📬 ${notif.tipo} → ${notif.usuarioDestinoEmail}`)
      console.log(`   Mensaje: ${notif.mensaje}`)
      console.log(`   Leída: ${notif.leida}`)
      console.log('')
    })

    // Verificar por usuario
    console.log('\n=== NOTIFICACIONES POR USUARIO ===\n')
    const usuarios = await Usuario.find({ activo: true })
    
    for (const usuario of usuarios) {
      const notifsUsuario = await Notificacion.countDocuments({ 
        usuarioDestinoId: usuario._id.toString(),
        mensaje: /PRUEBA/
      })
      
      if (notifsUsuario > 0) {
        console.log(`👤 ${usuario.email} (${usuario.rol}${usuario.tipoOperador ? ` - ${usuario.tipoOperador}` : ''})`)
        console.log(`   📬 ${notifsUsuario} notificaciones de prueba`)
      }
    }

    console.log('\n\n⚠️  Las notificaciones de prueba se mantienen en la BD.')
    console.log('💡 Puedes verlas en el frontend o eliminarlas manualmente.\n')

    await mongoose.disconnect()
    console.log('✅ Desconectado de MongoDB')
  } catch (error) {
    console.error('❌ Error:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

probarNotificaciones()
