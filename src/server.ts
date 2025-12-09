import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import multer from 'multer'
import Cliente from './models/Cliente.js'
import Pedido from './models/Pedido.js'
import Conversacion from './models/Conversacion.js'
import Evento from './models/Evento.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Usuario from './models/Usuario.js'
import { verificarToken, soloAdmin, adminOOperador, permisoEscritura, filtrarPedidosPorOperador, AuthRequest } from './middleware/auth.js'
import sgMail from '@sendgrid/mail'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3009 // Puerto diferente al del bot

// Configurar multer para manejar archivos (imágenes de eventos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes'))
    }
  }
})

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@avellano.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Avellano'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
  console.log('📧 SendGrid configurado correctamente')
} else {
  console.warn('⚠️ SENDGRID_API_KEY no configurada. Los emails se mostrarán en consola.')
}

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
    const rolesValidos = ['administrador', 'operador', 'soporte']
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
      rol: rol || 'soporte',
      nombre: nombre || email.split('@')[0],
      activo: true
    })
    await user.save()
    
    // Generar tokens para el nuevo usuario
    const payload = { 
      uid: user._id, 
      email: user.email, 
      rol: user.rol,
      tipoOperador: user.tipoOperador,
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
        tipoOperador: user.tipoOperador,
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
      tipoOperador: user.tipoOperador,
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
        tipoOperador: user.tipoOperador,
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
    
    // Generar nuevos tokens (IMPORTANTE: incluir tipoOperador)
    const newPayload = { 
      uid: user._id, 
      email: user.email, 
      rol: user.rol,
      tipoOperador: user.tipoOperador,  // ⭐ Preservar tipoOperador
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
      refreshToken: newRefreshToken,
      user: {  // ⭐ Incluir datos completos del usuario
        _id: user._id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        tipoOperador: user.tipoOperador,
        activo: user.activo
      }
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

// Solicitar recuperación de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requerido' })
    }

    const user = await Usuario.findOne({ email: email.toLowerCase() })
    
    // Por seguridad, siempre responder lo mismo aunque el usuario no exista
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'Si el correo existe, recibirás un enlace de recuperación' 
      })
    }

    // Generar token de reseteo (válido por 1 hora)
    const resetToken = jwt.sign(
      { uid: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Guardar token y fecha de expiración en la BD
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hora
    await user.save()

    // Construir URL de reseteo
    const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}`
    
    console.log('🔐 Token de recuperación generado exitosamente')

    // Enviar email con SendGrid
    if (SENDGRID_API_KEY) {
      try {
        const msg = {
          to: user.email,
          from: {
            email: SENDGRID_FROM_EMAIL,
            name: SENDGRID_FROM_NAME
          },
          subject: 'Recuperación de Contraseña - Avellano',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      
                      <!-- Header con gradiente -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #D1132A 0%, #F2A904 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Avellano</h1>
                          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Alimentar es amar</p>
                        </td>
                      </tr>
                      
                      <!-- Contenido -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Recuperación de Contraseña</h2>
                          
                          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                            Hola <strong>${user.nombre || user.email}</strong>,
                          </p>
                          
                          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                            Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Panel de Administración de Avellano.
                          </p>
                          
                          <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                            Haz clic en el siguiente botón para crear una nueva contraseña:
                          </p>
                          
                          <!-- Botón -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 20px 0;">
                                <a href="${resetUrl}" style="background: linear-gradient(135deg, #D1132A 0%, #F2A904 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(209, 19, 42, 0.3);">
                                  Restablecer Contraseña
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; padding: 20px 0 0 0; border-top: 1px solid #eee;">
                            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
                          </p>
                          
                          <p style="color: #D1132A; font-size: 12px; word-break: break-all; margin: 10px 0 20px 0;">
                            ${resetUrl}
                          </p>
                          
                          <div style="background-color: #fff9e6; border-left: 4px solid #F2A904; padding: 15px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.6;">
                              <strong>⏰ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
                            </p>
                          </div>
                          
                          <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">
                            Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
                            © ${new Date().getFullYear()} Avellano - Todos los derechos reservados
                          </p>
                          <p style="color: #999; font-size: 12px; margin: 0;">
                            Este es un correo automático, por favor no responder.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
          text: `
Recuperación de Contraseña - Avellano

Hola ${user.nombre || user.email},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, visita el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora por motivos de seguridad.

Si no solicitaste este cambio, puedes ignorar este correo.

---
© ${new Date().getFullYear()} Avellano - Todos los derechos reservados
          `.trim()
        }

        await sgMail.send(msg)
        console.log('✅ Email de recuperación enviado exitosamente')

        res.json({ 
          success: true, 
          message: 'Si el correo existe, recibirás un enlace de recuperación'
        })
      } catch (emailError: any) {
        console.error('❌ Error enviando email:', emailError.response?.body || emailError)
        
        // Aún así devolver éxito (para no revelar si el email existe)
        res.json({ 
          success: true, 
          message: 'Si el correo existe, recibirás un enlace de recuperación'
        })
      }
    } else {
      // Modo desarrollo: mostrar enlace en consola y respuesta
      console.log('⚠️ Modo desarrollo: Email no enviado (SENDGRID_API_KEY no configurada)')
      
      res.json({ 
        success: true, 
        message: 'Si el correo existe, recibirás un enlace de recuperación',
        // Solo en desarrollo:
        resetUrl: resetUrl,
        token: resetToken
      })
    }
  } catch (e) {
    console.error('Error en forgot-password:', e)
    res.status(500).json({ success: false, error: 'Error procesando solicitud' })
  }
})

// Verificar token de reseteo
app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params
    
    // Verificar que el token sea válido
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Buscar usuario con ese token
    const user = await Usuario.findOne({
      _id: decoded.uid,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      })
    }

    res.json({ 
      success: true, 
      email: user.email 
    })
  } catch (e) {
    res.status(400).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    })
  }
})

// Resetear contraseña con token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token y nueva contraseña requeridos' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'La contraseña debe tener mínimo 6 caracteres' 
      })
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Buscar usuario
    const user = await Usuario.findOne({
      _id: decoded.uid,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      })
    }

    // Actualizar contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10)
    user.passwordHash = passwordHash
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.refreshToken = undefined // Invalidar sesiones activas
    await user.save()

    console.log('✅ Contraseña actualizada exitosamente')

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    })
  } catch (e) {
    console.error('Error en reset-password:', e)
    res.status(400).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    })
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
    const { rol, tipoOperador } = req.body
    const rolesValidos = ['administrador', 'operador', 'soporte']
    
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' })
    }
    
    const updateData: any = { rol, updatedAt: new Date() }
    
    // Si es operador, debe tener tipoOperador
    if (rol === 'operador') {
      const tiposValidos = ['coordinador_masivos', 'director_comercial', 'ejecutivo_horecas', 'mayorista']
      if (!tipoOperador || !tiposValidos.includes(tipoOperador)) {
        return res.status(400).json({ success: false, error: 'Tipo de operador inválido' })
      }
      updateData.tipoOperador = tipoOperador
    } else {
      updateData.tipoOperador = null
    }
    
    const user = await Usuario.findByIdAndUpdate(
      req.params.id,
      updateData,
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

// Crear nuevo usuario (solo admin)
app.post('/api/usuarios', verificarToken, soloAdmin, async (req: AuthRequest, res) => {
  try {
    const { nombre, email, password, rol, tipoOperador } = req.body
    
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' })
    }
    
    // Validar rol
    const rolesValidos = ['administrador', 'operador', 'soporte']
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' })
    }
    
    // Validar tipoOperador si es operador
    if (rol === 'operador') {
      const tiposValidos = ['coordinador_masivos', 'director_comercial', 'ejecutivo_horecas', 'mayorista']
      if (!tipoOperador || !tiposValidos.includes(tipoOperador)) {
        return res.status(400).json({ success: false, error: 'Tipo de operador requerido para rol operador' })
      }
    }
    
    // Verificar si el email ya existe
    const existingUser = await Usuario.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'El email ya está registrado' })
    }
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Crear usuario
    const newUser = new Usuario({
      nombre,
      email: email.toLowerCase(),
      passwordHash,
      rol,
      tipoOperador: rol === 'operador' ? tipoOperador : null,
      activo: true
    })
    
    await newUser.save()
    
    res.json({ 
      success: true, 
      message: 'Usuario creado exitosamente',
      data: {
        _id: newUser._id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        tipoOperador: newUser.tipoOperador
      }
    })
  } catch (e) {
    console.error('Error creando usuario:', e)
    res.status(500).json({ success: false, error: 'Error creando usuario' })
  }
})

// Crear múltiples usuarios desde CSV (solo admin)
app.post('/api/usuarios/bulk', verificarToken, soloAdmin, async (req: AuthRequest, res) => {
  try {
    const { usuarios } = req.body
    
    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de usuarios' })
    }
    
    let creados = 0
    let errores = 0
    const detalles = []
    
    for (const userData of usuarios) {
      try {
        const { nombre, email, password, rol, tipoOperador } = userData
        
        // Validar campos
        if (!nombre || !email || !password || !rol) {
          errores++
          detalles.push({ email, error: 'Faltan campos requeridos' })
          continue
        }
        
        // Verificar si ya existe
        const existingUser = await Usuario.findOne({ email: email.toLowerCase() })
        if (existingUser) {
          errores++
          detalles.push({ email, error: 'Email ya existe' })
          continue
        }
        
        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10)
        
        // Crear usuario
        const newUser = new Usuario({
          nombre,
          email: email.toLowerCase(),
          passwordHash,
          rol,
          tipoOperador: rol === 'operador' ? tipoOperador : null,
          activo: true
        })
        
        await newUser.save()
        creados++
      } catch (error) {
        errores++
        detalles.push({ email: userData.email, error: 'Error al crear' })
      }
    }
    
    res.json({ 
      success: true, 
      message: `Importación completada: ${creados} creados, ${errores} errores`,
      data: { creados, errores, detalles }
    })
  } catch (e) {
    console.error('Error en importación bulk:', e)
    res.status(500).json({ success: false, error: 'Error en importación masiva' })
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
  // Servir el dashboard sin validación - la validación ocurre en app.js
  return res.sendFile(join(__dirname, '../public/index.html'))
})

// 📊 Clientes - Filtrados por responsable del operador
app.get('/api/clientes', verificarToken, async (req: AuthRequest, res) => {
  try {
    let filtro: any = {}
    
    // Soporte no debería ver clientes
    if (req.user!.rol === 'soporte') {
      return res.json({ success: true, total: 0, data: [] })
    }
    
    // Si es operador, filtrar por su tipo de responsabilidad
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      filtro = { responsable: req.user!.tipoOperador }
    }
    
    // Administrador ve todos los clientes (filtro vacío)
    
    const clientes = await Cliente.find(filtro).sort({ fechaRegistro: -1 })
    
    res.json({
      success: true,
      total: clientes.length,
      data: clientes,
    })
  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error)
    res.status(500).json({
      success: false,
      error: 'Error obteniendo clientes',
    })
  }
})

// 🔍 Obtener un cliente por teléfono (solo admin y operador)
app.get('/api/clientes/:telefono', verificarToken, adminOOperador, async (req: AuthRequest, res) => {
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

// 📋 Obtener todos los pedidos (admin, operador y soporte)
app.get('/api/pedidos', verificarToken, async (req: AuthRequest, res) => {
  try {
    let pedidos = []
    
    console.log('📋 Cargando pedidos para usuario:', {
      rol: req.user!.rol,
      tipoOperador: req.user!.tipoOperador,
      filtroTelefono: req.query.telefono
    })
    
    // Si se proporciona un teléfono específico, filtrar solo por ese
    if (req.query.telefono) {
      pedidos = await Pedido.find({ telefono: req.query.telefono }).sort({ fechaPedido: -1 }).lean()
      // Log seguro - solo cantidad
      console.log('📞 Consulta de pedidos por teléfono: encontrados', pedidos.length)
      
      return res.json({
        success: true,
        total: pedidos.length,
        data: pedidos,
      })
    }
    
    // Si es operador, filtrar pedidos solo de clientes asignados a él
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      // Primero obtener los teléfonos de los clientes asignados al operador
      const clientesAsignados = await Cliente.find(
        { responsable: req.user!.tipoOperador },
        { telefono: 1 }
      ).lean()
      
      // Log seguro - solo cantidades
      console.log('👥 Filtrado de pedidos para operador - Clientes asignados:', clientesAsignados.length)
      
      const telefonos = clientesAsignados.map(c => c.telefono)
      
      // Si no hay clientes asignados, retornar array vacío
      if (telefonos.length === 0) {
        console.log('⚠️ Operador sin clientes asignados')
        return res.json({
          success: true,
          total: 0,
          data: []
        })
      }
      
      // Filtrar pedidos solo de esos clientes
      pedidos = await Pedido.find({ telefono: { $in: telefonos } }).sort({ fechaPedido: -1 }).lean()
      console.log('📦 Pedidos filtrados encontrados:', pedidos.length)
    } else {
      // Administrador y soporte ven todos los pedidos
      pedidos = await Pedido.find({}).sort({ fechaPedido: -1 }).lean()
      console.log('📦 Pedidos totales:', pedidos.length)
    }
    
    res.json({
      success: true,
      total: pedidos.length,
      data: pedidos,
    })
  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error)
    res.status(500).json({
      success: false,
      error: 'Error obteniendo pedidos',
    })
  }
})

// 📦 Obtener un pedido específico por ID
app.get('/api/pedidos/:id', verificarToken, async (req: AuthRequest, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).lean()
    
    if (!pedido) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' })
    }
    
    // Verificar permisos: operadores solo pueden ver pedidos de sus clientes
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      const cliente = await Cliente.findOne({ telefono: pedido.telefono }).lean()
      
      if (!cliente || cliente.responsable !== req.user!.tipoOperador) {
        return res.status(403).json({ success: false, error: 'No tienes permiso para ver este pedido' })
      }
    }
    
    res.json({ success: true, data: pedido })
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo pedido' })
  }
})

// 📱 Enviar mensaje de WhatsApp
app.post('/api/whatsapp/enviar-mensaje', verificarToken, permisoEscritura, async (req: AuthRequest, res) => {
  try {
    const { telefono, mensaje } = req.body
    
    if (!telefono || !mensaje) {
      return res.status(400).json({ success: false, error: 'Teléfono y mensaje son requeridos' })
    }
    
    // Configuración de WhatsApp Business API
    const JWT_TOKEN = process.env.JWT_TOKEN
    const NUMBER_ID = process.env.NUMBER_ID
    const VERSION = process.env.PROVIDER_VERSION || 'v22.0'
    
    if (!JWT_TOKEN || !NUMBER_ID) {
      return res.status(500).json({ success: false, error: 'Configuración de WhatsApp incompleta' })
    }
    
    // Enviar mensaje a través de la API de WhatsApp
    const url = `https://graph.facebook.com/${VERSION}/${NUMBER_ID}/messages`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'text',
        text: {
          body: mensaje
        }
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Mensaje de WhatsApp enviado exitosamente')
      res.json({ success: true, data })
    } else {
      console.error('❌ Error enviando mensaje de WhatsApp')
      res.status(500).json({ success: false, error: 'Error enviando mensaje de WhatsApp', details: data })
    }
  } catch (error) {
    console.error('❌ Error en envío de WhatsApp:', error)
    res.status(500).json({ success: false, error: 'Error enviando mensaje' })
  }
})

// 🔄 Actualizar estado de un pedido
app.patch('/api/pedidos/:id/estado', verificarToken, permisoEscritura, async (req: AuthRequest, res) => {
  try {
    const { estado, notasCancelacion } = req.body
    
    const estadosPermitidos = ['pendiente', 'en_proceso', 'atendido', 'cancelado']
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' })
    }
    
    const pedido = await Pedido.findById(req.params.id)
    
    if (!pedido) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' })
    }
    
    // Verificar permisos: operadores solo pueden actualizar pedidos de sus clientes
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      const cliente = await Cliente.findOne({ telefono: pedido.telefono }).lean()
      
      if (!cliente || cliente.responsable !== req.user!.tipoOperador) {
        return res.status(403).json({ success: false, error: 'No tienes permiso para modificar este pedido' })
      }
    }
    
    // Actualizar estado
    pedido.estado = estado
    
    // Inicializar historialEstados si no existe
    if (!pedido.historialEstados) {
      pedido.historialEstados = []
    }
    
    // Agregar al historial de estados
    pedido.historialEstados.push({
      estado: estado as 'pendiente' | 'en_proceso' | 'atendido' | 'cancelado',
      fecha: new Date(),
      operadorEmail: req.user!.email,
      operadorId: req.user!.uid,
      nota: estado === 'cancelado' ? notasCancelacion : undefined
    })
    
    // Si se cancela, agregar notas de cancelación
    if (estado === 'cancelado' && notasCancelacion) {
      pedido.notasCancelacion = notasCancelacion
      pedido.notas = (pedido.notas ? pedido.notas + '\n\n' : '') + `CANCELADO: ${notasCancelacion}`
    }
    
    await pedido.save()
    
    console.log(`✅ Pedido actualizado: ${pedido.idPedido} - Estado: ${estado}`)
    
    res.json({ success: true, data: pedido })
  } catch (error) {
    console.error('❌ Error actualizando estado del pedido:', error)
    res.status(500).json({ success: false, error: 'Error actualizando estado del pedido' })
  }
})

// 💬 Obtener todas las conversaciones (solo admin y operador)
app.get('/api/conversaciones', verificarToken, adminOOperador, async (req: AuthRequest, res) => {
  try {
    let filtroConversaciones: any = {}
    
    // Si es operador, filtrar solo conversaciones de clientes asignados
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      const clientesAsignados = await Cliente.find(
        { responsable: req.user!.tipoOperador },
        { telefono: 1 }
      ).lean()
      
      const telefonos = clientesAsignados.map(c => c.telefono)
      
      if (telefonos.length === 0) {
        return res.json({
          success: true,
          total: 0,
          data: []
        })
      }
      
      filtroConversaciones = { telefono: { $in: telefonos } }
    }
    
    const conversaciones = await Conversacion.find(filtroConversaciones).sort({ fechaUltimoMensaje: -1 })
    
    // Enriquecer con datos del cliente
    const conversacionesEnriquecidas = await Promise.all(
      conversaciones.map(async (conv) => {
        const cliente = await Cliente.findOne({ telefono: conv.telefono })
        return {
          ...conv.toObject(),
          nombreCliente: cliente?.nombre || conv.nombreCliente,
          nombreNegocio: cliente?.nombreNegocio || conv.nombreNegocio,
          tipoCliente: cliente?.tipoCliente
        }
      })
    )
    
    res.json({
      success: true,
      total: conversacionesEnriquecidas.length,
      data: conversacionesEnriquecidas,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo conversaciones',
    })
  }
})

// 💬 Obtener detalle de una conversación específica
app.get('/api/conversaciones/:telefono', verificarToken, adminOOperador, async (req: AuthRequest, res) => {
  try {
    const conversacion = await Conversacion.findOne({ telefono: req.params.telefono })
    if (!conversacion) {
      return res.status(404).json({ success: false, error: 'Conversación no encontrada' })
    }
    
    const cliente = await Cliente.findOne({ telefono: req.params.telefono })
    
    res.json({
      success: true,
      data: {
        ...conversacion.toObject(),
        nombreCliente: cliente?.nombre,
        nombreNegocio: cliente?.nombreNegocio,
        tipoCliente: cliente?.tipoCliente,
        clienteInfo: cliente
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo conversación' })
  }
})

// 📊 Estadísticas generales (todos pueden ver)
app.get('/api/stats', verificarToken, async (req: AuthRequest, res) => {
  try {
    let filtro: any = {}
    
    // Soporte no debería ver estadísticas de clientes
    if (req.user!.rol === 'soporte') {
      return res.json({
        success: true,
        data: {
          clientes: { total: 0, hogar: 0, negocio: 0, hoy: 0 },
          pedidos: 0,
          conversaciones: 0
        }
      })
    }
    
    // Si es operador, filtrar por su tipo de responsabilidad
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      filtro = { responsable: req.user!.tipoOperador }
    }
    
    // Administrador ve todos los clientes (filtro vacío)
    
    const totalClientes = await Cliente.countDocuments(filtro)
    const clientesHogar = await Cliente.countDocuments({ ...filtro, tipoCliente: 'hogar' })
    const clientesNegocio = await Cliente.countDocuments({ ...filtro, tipoCliente: { $ne: 'hogar' } })
    
    // Filtrar pedidos también por operador
    let totalPedidos = 0
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      const clientesAsignados = await Cliente.find(filtro, { telefono: 1 }).lean()
      const telefonos = clientesAsignados.map(c => c.telefono)
      
      if (telefonos.length > 0) {
        totalPedidos = await Pedido.countDocuments({ telefono: { $in: telefonos } })
      }
    } else {
      totalPedidos = await Pedido.countDocuments({})
    }
    
    const totalConversaciones = await Conversacion.countDocuments()

    // Clientes registrados hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const clientesHoy = await Cliente.countDocuments({
      ...filtro,
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

// ==================== RUTAS DE EVENTOS ====================

// Obtener todos los eventos (admin y soporte)
app.get('/api/eventos', verificarToken, adminOOperador, async (req: AuthRequest, res) => {
  try {
    const eventos = await Evento.find()
      .sort({ fechaCreacion: -1 })
      .select('-destinatarios.lista') // No enviar la lista completa de destinatarios
    
    res.json({
      success: true,
      data: eventos,
    })
  } catch (error) {
    console.error('Error obteniendo eventos:', error)
    res.status(500).json({
      success: false,
      message: 'Error obteniendo eventos',
    })
  }
})

// Obtener un evento por ID (admin y soporte)
app.get('/api/eventos/:id', verificarToken, adminOOperador, async (req: AuthRequest, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
    
    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado',
      })
    }
    
    res.json({
      success: true,
      data: evento,
    })
  } catch (error) {
    console.error('Error obteniendo evento:', error)
    res.status(500).json({
      success: false,
      message: 'Error obteniendo evento',
    })
  }
})

// Crear y enviar evento (admin y soporte)
app.post('/api/eventos', verificarToken, permisoEscritura, upload.single('imagen'), async (req: AuthRequest, res) => {
  try {
    const { nombre, mensaje, filtros } = req.body
    
    console.log('📝 Datos recibidos:', { nombre, mensaje, filtros, hasFile: !!req.file })
    
    if (!nombre || !mensaje || !filtros) {
      console.error('❌ Faltan campos:', { nombre: !!nombre, mensaje: !!mensaje, filtros: !!filtros })
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      })
    }
    
    // Parsear filtros si viene como string
    const filtrosObj = typeof filtros === 'string' ? JSON.parse(filtros) : filtros
    
    // Obtener destinatarios según filtros
    const queryClientes: any = {}
    
    if (filtrosObj.tipo === 'hogar') {
      queryClientes.tipoCliente = 'hogar'
    } else if (filtrosObj.tipo === 'ciudad' && filtrosObj.ciudades?.length > 0) {
      queryClientes.ciudad = { $in: filtrosObj.ciudades }
    } else if (filtrosObj.tipo === 'tipo' && filtrosObj.tiposCliente?.length > 0) {
      queryClientes.tipoCliente = { $in: filtrosObj.tiposCliente }
    } else if (filtrosObj.tipo === 'personalizado') {
      if (filtrosObj.ciudades?.length > 0) {
        queryClientes.ciudad = { $in: filtrosObj.ciudades }
      }
      if (filtrosObj.tiposCliente?.length > 0) {
        queryClientes.tipoCliente = { $in: filtrosObj.tiposCliente }
      }
    }
    // Si tipo === 'todos', queryClientes queda vacío (todos los clientes)
    
    const clientes = await Cliente.find(queryClientes).select('telefono nombreNegocio ciudad tipoCliente')
    
    // Crear lista de destinatarios
    const destinatarios = clientes.map(cliente => ({
      telefono: cliente.telefono,
      nombreNegocio: cliente.nombreNegocio,
      ciudad: cliente.ciudad,
      tipoCliente: cliente.tipoCliente,
      enviado: false,
    }))
    
    // Crear evento
    const evento = new Evento({
      nombre,
      mensaje,
      filtros: filtrosObj,
      destinatarios: {
        total: destinatarios.length,
        enviados: 0,
        fallidos: 0,
        lista: destinatarios,
      },
      estado: 'enviado', // Marcar como enviado inmediatamente
      creadoPor: req.user!.email,
      fechaEnvio: new Date(),
    })
    
    await evento.save()
    
    // TODO: Aquí se integraría con el bot de WhatsApp para enviar mensajes
    // Por ahora, marcar todos como enviados
    console.log(`📧 Evento creado: ${nombre}`)
    console.log(`📊 Total destinatarios: ${destinatarios.length}`)
    console.log(`📝 Mensaje: ${mensaje.substring(0, 50)}...`)
    
    // Simular envío marcando como enviados
    evento.destinatarios.lista.forEach((dest: any) => {
      dest.enviado = true
      dest.fechaEnvio = new Date()
    })
    evento.destinatarios.enviados = destinatarios.length
    await evento.save()
    
    res.json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        _id: evento._id,
        nombre: evento.nombre,
        destinatarios: {
          total: evento.destinatarios.total,
          enviados: evento.destinatarios.enviados,
        },
      },
    })
  } catch (error) {
    console.error('Error creando evento:', error)
    res.status(500).json({
      success: false,
      message: 'Error creando evento',
    })
  }
})

// Eliminar evento (admin y soporte)
app.delete('/api/eventos/:id', verificarToken, permisoEscritura, async (req: AuthRequest, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
    
    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado',
      })
    }
    
    if (evento.estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar eventos en borrador',
      })
    }
    
    await Evento.findByIdAndDelete(req.params.id)
    
    res.json({
      success: true,
      message: 'Evento eliminado',
    })
  } catch (error) {
    console.error('Error eliminando evento:', error)
    res.status(500).json({
      success: false,
      message: 'Error eliminando evento',
    })
  }
})

// ==================== ENDPOINTS PARA POWER BI ====================

// Endpoint especial para Power BI - Obtener todos los clientes con formato optimizado
app.get('/api/powerbi/clientes', verificarToken, async (req: AuthRequest, res) => {
  try {
    const clientes = await Cliente.find().lean()
    
    // Formato optimizado para Power BI
    const datosFormateados = clientes.map(cliente => ({
      id: cliente._id.toString(),
      telefono: cliente.telefono,
      nombre: cliente.nombre || 'Sin nombre',
      tipoCliente: cliente.tipoCliente,
      nombreNegocio: cliente.nombreNegocio || null,
      ciudad: cliente.ciudad || 'Sin ciudad',
      direccion: cliente.direccion || null,
      personaContacto: cliente.personaContacto || null,
      responsable: cliente.responsable || null,
      productosInteres: cliente.productosInteres || null,
      fechaRegistro: cliente.fechaRegistro,
      ultimaInteraccion: cliente.ultimaInteraccion,
      conversaciones: cliente.conversaciones || 0
    }))
    
    res.json({
      success: true,
      count: datosFormateados.length,
      data: datosFormateados,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error en Power BI - Clientes:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo datos' })
  }
})

// Endpoint especial para Power BI - Obtener todos los pedidos con formato optimizado
app.get('/api/powerbi/pedidos', verificarToken, async (req: AuthRequest, res) => {
  try {
    const pedidos = await Pedido.find().lean()
    
    // Formato optimizado para Power BI
    const datosFormateados = pedidos.map(pedido => ({
      id: pedido._id.toString(),
      idPedido: pedido.idPedido,
      telefono: pedido.telefono,
      tipoCliente: pedido.tipoCliente,
      nombreNegocio: pedido.nombreNegocio || null,
      ciudad: pedido.ciudad || 'Sin ciudad',
      direccion: pedido.direccion || null,
      personaContacto: pedido.personaContacto || null,
      estado: pedido.estado,
      total: pedido.total || 0,
      cantidadProductos: pedido.productos?.length || 0,
      coordinadorAsignado: pedido.coordinadorAsignado,
      telefonoCoordinador: pedido.telefonoCoordinador,
      fechaPedido: pedido.fechaPedido,
      productos: JSON.stringify(pedido.productos || []), // Serializado para Power BI
      historialEstados: JSON.stringify(pedido.historialEstados || []),
      notas: pedido.notas || null
    }))
    
    res.json({
      success: true,
      count: datosFormateados.length,
      data: datosFormateados,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error en Power BI - Pedidos:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo datos' })
  }
})

// Endpoint especial para Power BI - Obtener productos de pedidos (tabla expandida)
app.get('/api/powerbi/productos', verificarToken, async (req: AuthRequest, res) => {
  try {
    const pedidos = await Pedido.find().lean()
    
    // Expandir productos para análisis detallado
    const productosExpandidos: any[] = []
    
    pedidos.forEach(pedido => {
      if (pedido.productos && pedido.productos.length > 0) {
        pedido.productos.forEach((producto: any) => {
          productosExpandidos.push({
            idPedido: pedido.idPedido,
            telefonoCliente: pedido.telefono,
            nombreNegocio: pedido.nombreNegocio || 'Sin nombre',
            ciudad: pedido.ciudad || 'Sin ciudad',
            estadoPedido: pedido.estado,
            fechaPedido: pedido.fechaPedido,
            nombreProducto: producto.nombre,
            cantidadProducto: producto.cantidad || 1,
            precioUnitario: producto.precioUnitario || 0,
            subtotal: producto.subtotal || ((producto.cantidad || 1) * (producto.precioUnitario || 0))
          })
        })
      }
    })
    
    res.json({
      success: true,
      count: productosExpandidos.length,
      data: productosExpandidos,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error en Power BI - Productos:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo datos' })
  }
})

// Endpoint especial para Power BI - Estadísticas resumidas
app.get('/api/powerbi/estadisticas', verificarToken, async (req: AuthRequest, res) => {
  try {
    const [totalClientes, totalPedidos, clientesHoy] = await Promise.all([
      Cliente.countDocuments(),
      Pedido.countDocuments(),
      Cliente.countDocuments({
        fechaRegistro: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ])
    
    const pedidosPorEstado = await Pedido.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } }
    ])
    
    const pedidosPorCiudad = await Pedido.aggregate([
      { $group: { _id: '$ciudad', count: { $sum: 1 }, total: { $sum: '$total' } } },
      { $sort: { count: -1 } }
    ])
    
    const clientesPorTipo = await Cliente.aggregate([
      { $group: { _id: '$tipoCliente', count: { $sum: 1 } } }
    ])
    
    res.json({
      success: true,
      data: {
        resumenGeneral: {
          totalClientes,
          totalPedidos,
          clientesHoy
        },
        pedidosPorEstado: pedidosPorEstado.map(e => ({
          estado: e._id,
          cantidad: e.count
        })),
        pedidosPorCiudad: pedidosPorCiudad.map(c => ({
          ciudad: c._id || 'Sin ciudad',
          cantidad: c.count,
          totalVentas: c.total || 0
        })),
        clientesPorTipo: clientesPorTipo.map(t => ({
          tipo: t._id,
          cantidad: t.count
        }))
      },
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error en Power BI - Estadísticas:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo datos' })
  }
})

// Finalmente, servir archivos estáticos (login.html, app.js, styles.css, etc.)
app.use(express.static(join(__dirname, '../public')))

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Dashboard disponible en: http://localhost:${PORT}`)
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`)
})
