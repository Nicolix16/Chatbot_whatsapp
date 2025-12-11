import { Router } from 'express'
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Usuario from '../models/Usuario.js'
import { config } from '../config/environment.js'
import sgMail from '@sendgrid/mail'
import { verificarToken } from '../middleware/auth.js'

const router = Router()

// Configurar SendGrid
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey)
}

// Funciones para generar tokens
function generateAccessToken(payload: any) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' })
}

function generateRefreshToken(payload: any) {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: '7d' })
}

// Registro
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, rol, nombre } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y password requeridos' })
    }
    
    const rolesValidos = ['administrador', 'operador', 'soporte', 'hogares']
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
        id: user._id.toString(),
        email: user.email,
        rol: user.rol,
        tipoOperador: user.tipoOperador,
        nombre: user.nombre,
        activo: user.activo
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error registrando usuario' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response) => {
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
        id: user._id.toString(),
        email: user.email,
        rol: user.rol,
        tipoOperador: user.tipoOperador,
        nombre: user.nombre,
        activo: user.activo
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error en login' })
  }
})

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ success: false, error: 'Refresh token requerido' })
    
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as any
    
    const user = await Usuario.findById(payload.uid)
    if (!user || user.refreshToken !== refreshToken || !user.activo) {
      return res.status(401).json({ success: false, error: 'Refresh token inválido' })
    }
    
    const newPayload = { 
      uid: user._id, 
      email: user.email, 
      rol: user.rol,
      tipoOperador: user.tipoOperador,
      nombre: user.nombre 
    }
    const newAccessToken = generateAccessToken(newPayload)
    const newRefreshToken = generateRefreshToken(newPayload)
    
    user.refreshToken = newRefreshToken
    await user.save()
    
    res.json({ 
      success: true, 
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
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

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization || ''
    const [, token] = auth.split(' ')
    
    if (token) {
      const payload = jwt.verify(token, config.jwt.secret) as any
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

// Obtener usuario actual
router.get('/me', verificarToken, async (req: any, res: Response) => {
  try {
    const user = await Usuario.findById(req.user.uid).select('-passwordHash -refreshToken')
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    res.json({ success: true, user })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error obteniendo usuario' })
  }
})

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requerido' })
    }

    const user = await Usuario.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'Si el correo existe, recibirás un enlace de recuperación' 
      })
    }

    const resetToken = jwt.sign(
      { uid: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    )

    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = new Date(Date.now() + 3600000)
    await user.save()

    const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`

    if (config.sendgrid.apiKey) {
      const msg = {
        to: user.email,
        from: { email: config.sendgrid.fromEmail, name: 'Avellano' },
        subject: '🔒 Recuperación de Contraseña - Avellano',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #D1132A 0%, #F2A904 100%); padding: 40px 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #D1132A 0%, #9E0F20 100%); padding: 30px; text-align: center;">
                  <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#D1132A" stroke-width="2"/>
                      <path d="M8 11V7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V11" stroke="#D1132A" stroke-width="2" stroke-linecap="round"/>
                      <circle cx="12" cy="16" r="1" fill="#D1132A"/>
                    </svg>
                  </div>
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Recuperación de Contraseña</h1>
                </div>
                
                <!-- Body -->
                <div style="padding: 40px 30px;">
                  <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hola <strong>${user.nombre}</strong>,
                  </p>
                  
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta en Avellano.
                  </p>
                  
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Haz clic en el siguiente botón para crear una nueva contraseña:
                  </p>
                  
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #D1132A 0%, #9E0F20 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(209, 19, 42, 0.4); transition: all 0.2s;">
                      RESTABLECER CONTRASEÑA
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 10px 0;">
                    O copia y pega este enlace en tu navegador:
                  </p>
                  
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; word-break: break-all;">
                    <a href="${resetUrl}" style="color: #3b82f6; font-size: 13px; text-decoration: none;">${resetUrl}</a>
                  </div>
                  
                  <!-- Warning Box -->
                  <div style="background: #fef3c7; border-left: 4px solid #F2A904; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e; font-size: 14px;">
                      ⚠️ Importante:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px; line-height: 1.6;">
                      <li>Este enlace expirará en <strong>1 hora</strong></li>
                      <li>Si no solicitaste este cambio, ignora este correo</li>
                      <li>Tu contraseña actual seguirá siendo válida hasta que crees una nueva</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">
                    Este es un correo automático, por favor no respondas a este mensaje.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                    © 2025 Avellano - Alimentar es Amar
                  </p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0; text-align: center;">
                    Panel de Control: <a href="${config.frontend.url}" style="color: #D1132A; text-decoration: none;">${config.frontend.url}</a>
                  </p>
                </div>
                
              </div>
            </div>
          </body>
          </html>
        `
      }

      await sgMail.send(msg)
    } else {
      console.log(`📧 [DEV] Email de recuperación: ${resetUrl}`)
    }

    res.json({ 
      success: true, 
      message: 'Si el correo existe, recibirás un enlace de recuperación' 
    })
  } catch (e: any) {
    console.error('Error en forgot-password:', e)
    res.status(500).json({ success: false, error: 'Error procesando solicitud' })
  }
})

// Resetear contraseña
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body
    
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token y nueva contraseña requeridos' })
    }

    const payload = jwt.verify(token, config.jwt.secret) as any
    const user = await Usuario.findById(payload.uid)
    
    if (!user || user.resetPasswordToken !== token) {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado' })
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return res.status(401).json({ success: false, error: 'Token expirado' })
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.refreshToken = undefined
    await user.save()

    res.json({ success: true, message: 'Contraseña actualizada exitosamente' })
  } catch (e) {
    console.error('Error en reset-password:', e)
    res.status(401).json({ success: false, error: 'Token inválido o expirado' })
  }
})

export default router
