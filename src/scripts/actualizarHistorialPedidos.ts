import mongoose from 'mongoose'
import Pedido from '../models/Pedido.js'
import dotenv from 'dotenv'

dotenv.config()

async function actualizarHistorialPedidos() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI || ''
    await mongoose.connect(mongoUri)
    console.log('✅ Conectado a MongoDB')

    // Obtener todos los pedidos
    const pedidos = await Pedido.find({})
    console.log(`📦 Encontrados ${pedidos.length} pedidos`)

    let actualizados = 0

    for (const pedido of pedidos) {
      // Si no tiene historialEstados o está vacío, crear uno con el estado actual
      if (!pedido.historialEstados || pedido.historialEstados.length === 0) {
        pedido.historialEstados = [{
          estado: pedido.estado,
          fecha: pedido.fechaPedido,
          nota: `Estado inicial: ${pedido.estado}`
        }]

        await pedido.save()
        actualizados++
        console.log(`✅ Actualizado pedido ${pedido.idPedido}`)
      }
    }

    console.log(`\n✅ Proceso completado: ${actualizados} pedidos actualizados de ${pedidos.length} totales`)
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

actualizarHistorialPedidos()
