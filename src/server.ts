import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Cliente from './models/Cliente.js'
import Pedido from './models/Pedido.js'
import Conversacion from './models/Conversacion.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Usuario from './models/Usuario.js'
import { verificarToken, soloAdmin, adminOOperario, AuthRequest } from './middleware/auth.js'

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

// Nota: Servimos estáticos DESPUÉS de definir la ruta protegida '/'

// Conectar a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/avellano-chatbot'

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ API conectada a MongoDB'))
  .catch((error) => {
    console.error('❌ Error conectando API a MongoDB:', error)
    process.exit(1)
  })

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret'

// Funciones para generar tokens
function generateAccessToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

function generateRefreshToken(payload: any) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

// ========== ENDPOINTS DE LA API ==========
// ========== ENDPOINTS DE AUTENTICACIÓN ==========
// Endpoint registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, rol, nombre } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y password requeridos' })
    }
    
    // Validar rol
    const rolesValidos = ['administrador', 'operario', 'visitante']
    if (rol && !rolesValidos.includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' })
    }
    
    const existe = await Usuario.findOne({ email })
    if (existe) {
      return res.status(409).json({ success: false, error: 'Usuario ya existe' })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    const user = new Usuario({ 
      email, 
      passwordHash,
      rol: rol || 'visitante',
      nombre: nombre || email.split('@')[0],
      activo: true
    })
    await user.save()
    
    res.json({ 
      success: true, 
      data: { 
        id: user._id, 
        email: user.email, 
        rol: user.rol,
        nombre: user.nombre 
      } 
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error registrando usuario' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y password requeridos' })
    }
    
    const user = await Usuario.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' })
    }
    
    if (!user.activo) {
      return res.status(401).json({ success: false, error: 'Usuario desactivado' })
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' })
    }
    
    const payload = { 
      uid: user._id, 
      email: user.email, 
      rol: user.rol,
      nombre: user.nombre 
    }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)
    
    user.refreshToken = refreshToken
    await user.save()
    
    res.json({ 
      success: true, 
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        rol: user.rol,
        nombre: user.nombre
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error en login' })
  }
})

// Endpoint para renovar access token usando refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ success: false, error: 'Refresh token requerido' })
    
    // Verificar refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any
    
    // Verificar que el token existe en BD
    const user = await Usuario.findById(payload.uid)
    if (!user || user.refreshToken !== refreshToken || !user.activo) {
      return res.status(401).json({ success: false, error: 'Refresh token inválido' })
    }
    
    // Generar nuevos tokens
    const newPayload = { 
      uid: user._id, 
      email: user.email, 
      rol: user.rol,
      nombre: user.nombre 
    }
    const newAccessToken = generateAccessToken(newPayload)
    const newRefreshToken = generateRefreshToken(newPayload)
    
    // Actualizar refresh token en BD
    user.refreshToken = newRefreshToken
    await user.save()
    
    res.json({ 
      success: true, 
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Refresh token inválido o expirado' })
  }
})

// Endpoint para logout: invalidar refresh token
app.post('/api/auth/logout', async (req, res) => {
  try {
    const auth = req.headers.authorization || ''
    const [, token] = auth.split(' ')
    
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET) as any
      const user = await Usuario.findById(payload.uid)
      if (user) {
        user.refreshToken = undefined
        await user.save()
      }
    }
    
    res.json({ success: true })
  } catch (e) {
    res.json({ success: true })
  }
})

// ========== ENDPOINTS PROTEGIDOS ==========

// Endpoint para obtener info del usuario actual
app.get('/api/auth/me', verificarToken, async (req: AuthRequest, res) => {
  try {
    const user = await Usuario.findById(req.user!.uid).select('-passwordHash -refreshToken')
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    res.json({ success: true, data: user })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error obteniendo usuario' })
  }
})

// ========== GESTIÓN DE USUARIOS (Solo Admin) ==========

// Listar todos los usuarios (solo admin)
app.get('/api/usuarios', verificarToken, soloAdmin, async (req: AuthRequest, res) => {
  try {
    const usuarios = await Usuario.find().select('-passwordHash -refreshToken').sort({ createdAt: -1 })
    res.json({ success: true, data: usuarios })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error obteniendo usuarios' })
  }
})

// Actualizar rol de usuario (solo admin)
app.patch('/api/usuarios/:id/rol', verificarToken, soloAdmin, async (req: AuthRequest, res) => {
  try {
    const { rol } = req.body
    const rolesValidos = ['administrador', 'operario', 'visitante']
    
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' })
    }
    
    const user = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol, updatedAt: new Date() },
      { new: true }
    ).select('-passwordHash -refreshToken')
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    
    res.json({ success: true, data: user })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error actualizando rol' })
  }
})

// Activar/Desactivar usuario (solo admin)
app.patch('/api/usuarios/:id/estado', verificarToken, soloAdmin, async (req: AuthRequest, res) => {
  try {
    const { activo } = req.body
    
    const user = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo, updatedAt: new Date() },
      { new: true }
    ).select('-passwordHash -refreshToken')
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    
    res.json({ success: true, data: user })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error actualizando estado' })
  }
})

// Eliminar usuario (solo admin)
app.delete('/api/usuarios/:id', verificarToken, soloAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await Usuario.findByIdAndDelete(req.params.id)
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    
    res.json({ success: true, message: 'Usuario eliminado' })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error eliminando usuario' })
  }
})

// ========== ENDPOINTS DE DATOS ==========

// Ruta dashboard protegida (debe ir ANTES de servir estáticos)
app.get('/', (req, res) => {
  // Si no trae token en query redirigir a login
  const token = req.query.token
  if (!token) return res.redirect('/login.html')
  try {
    jwt.verify(String(token), JWT_SECRET)
    return res.sendFile(join(__dirname, '../public/index.html'))
  } catch {
    return res.redirect('/login.html')
  }
})

// 📊 Clientes - Todos pueden ver, pero con diferentes niveles de detalle
app.get('/api/clientes', verificarToken, async (req: AuthRequest, res) => {
  try {
    const clientes = await Cliente.find().sort({ fechaRegistro: -1 })
    
    // Visitantes solo ven datos básicos
    if (req.user!.rol === 'visitante') {
      const clientesBasicos = clientes.map(c => ({
        tipoCliente: c.tipoCliente,
        fechaRegistro: c.fechaRegistro,
        conversaciones: c.conversaciones
      }))
      return res.json({ success: true, total: clientesBasicos.length, data: clientesBasicos })
    }
    
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

// 🔍 Obtener un cliente por teléfono (solo admin y operario)
app.get('/api/clientes/:telefono', verificarToken, adminOOperario, async (req: AuthRequest, res) => {
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

// 📋 Obtener todos los pedidos (solo admin y operario)
app.get('/api/pedidos', verificarToken, adminOOperario, async (req: AuthRequest, res) => {
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

// 💬 Obtener todas las conversaciones (solo admin y operario)
app.get('/api/conversaciones', verificarToken, adminOOperario, async (req: AuthRequest, res) => {
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

// 📊 Estadísticas generales (todos pueden ver)
app.get('/api/stats', verificarToken, async (req: AuthRequest, res) => {
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

// Finalmente, servir archivos estáticos (login.html, app.js, styles.css, etc.)
app.use(express.static(join(__dirname, '../public')))

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Dashboard disponible en: http://localhost:${PORT}`)
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`)
})
