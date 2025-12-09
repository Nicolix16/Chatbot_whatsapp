import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import Pedido from './src/models/Pedido.js'

dotenv.config()

// Función para generar ID único de pedido
function generarIdPedido(): string {
  const fecha = new Date()
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `AV-${year}${month}${day}-${random}`
}

async function crearPedido() {
  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('❌ Falta MONGO_URI en el entorno (.env)')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Conectado a MongoDB')

    // Datos del cliente
    const telefono = '573195710327'
    const nombreNegocio = 'Asadero El Pollo Dorado'
    const ciudad = 'Acacías'
    const direccion = 'Carrera 5 #10-20 Centro'
    const personaContacto = 'Carlos Gómez'

    // Crear el pedido
    const nuevoPedido = {
      idPedido: generarIdPedido(),
      telefono: telefono,
      tipoCliente: 'asadero',
      nombreNegocio: nombreNegocio,
      ciudad: ciudad,
      direccion: direccion,
      personaContacto: personaContacto,
      productos: [
        { nombre: 'Pollo Entero', cantidad: 8, precioUnitario: 19000, subtotal: 152000 },
        { nombre: 'Alitas (kg)', cantidad: 4, precioUnitario: 14000, subtotal: 56000 },
        { nombre: 'Muslos (kg)', cantidad: 3, precioUnitario: 15000, subtotal: 45000 },
      ],
      total: 253000,
      coordinadorAsignado: 'Coordinador Masivos',
      telefonoCoordinador: '573108540252',
      estado: 'pendiente',
      fechaPedido: new Date(),
      notas: 'Cliente nuevo - Asadero en Acacías'
    }

    const pedidoCreado = await Pedido.create(nuevoPedido)
    console.log('✅ Pedido creado exitosamente:')
    console.log(JSON.stringify(pedidoCreado, null, 2))

  } catch (error) {
    console.error('❌ Error al crear el pedido:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Desconectado de MongoDB')
  }
}

crearPedido()
