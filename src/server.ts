import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Cliente from './models/Cliente.js'
import Pedido from './models/Pedido.js'
import Conversacion from './models/Conversacion.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3009 // Puerto diferente al del bot

// Middlewares
app.use(cors())
app.use(express.json())

// Middleware para desactivar caché
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
  next()
})

app.use(express.static(join(__dirname, '../public')))

// Conectar a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/avellano-chatbot'

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ API conectada a MongoDB'))
  .catch((error) => {
    console.error('❌ Error conectando API a MongoDB:', error)
    process.exit(1)
  })

// ========== ENDPOINTS DE LA API ==========

// 📊 Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ fechaRegistro: -1 })
    res.json({
      success: true,
      total: clientes.length,
      data: clientes,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo clientes',
    })
  }
})

// 🔍 Obtener un cliente por teléfono
app.get('/api/clientes/:telefono', async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ telefono: req.params.telefono })
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
      })
    }
    res.json({
      success: true,
      data: cliente,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo cliente',
    })
  }
})

// 📋 Obtener todos los pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ fechaPedido: -1 })
    res.json({
      success: true,
      total: pedidos.length,
      data: pedidos,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo pedidos',
    })
  }
})

// 💬 Obtener todas las conversaciones
app.get('/api/conversaciones', async (req, res) => {
  try {
    const conversaciones = await Conversacion.find().sort({ fechaInicio: -1 })
    res.json({
      success: true,
      total: conversaciones.length,
      data: conversaciones,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo conversaciones',
    })
  }
})

// 📊 Estadísticas generales
app.get('/api/stats', async (req, res) => {
  try {
    const totalClientes = await Cliente.countDocuments()
    const clientesHogar = await Cliente.countDocuments({ tipoCliente: 'hogar' })
    const clientesNegocio = await Cliente.countDocuments({ tipoCliente: 'negocio' })
    const totalPedidos = await Pedido.countDocuments()
    const totalConversaciones = await Conversacion.countDocuments()

    // Clientes registrados hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const clientesHoy = await Cliente.countDocuments({
      fechaRegistro: { $gte: hoy }
    })

    res.json({
      success: true,
      data: {
        clientes: {
          total: totalClientes,
          hogar: clientesHogar,
          negocio: clientesNegocio,
          hoy: clientesHoy,
        },
        pedidos: totalPedidos,
        conversaciones: totalConversaciones,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
    })
  }
})

// Ruta principal - servir la página web
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'))
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Dashboard disponible en: http://localhost:${PORT}`)
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`)
})
