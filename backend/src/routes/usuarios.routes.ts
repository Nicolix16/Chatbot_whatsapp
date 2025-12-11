import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import Usuario from '../models/Usuario.js'
import { verificarToken, soloAdmin, adminOSoporte, AuthRequest } from '../middleware/auth.js'
import { notificarUsuarioDesactivado, notificarUsuarioEliminado } from '../services/notificaciones.service.js'

const router = Router()

// Obtener todos los usuarios (admin y soporte)
router.get('/', verificarToken, adminOSoporte, async (req: AuthRequest, res: Response) => {
  try {
    const usuarios = await Usuario.find().select('-passwordHash -refreshToken').sort({ createdAt: -1 })
    res.json({ success: true, data: usuarios })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error obteniendo usuarios' })
  }
})

// Crear nuevo usuario (admin y soporte)
router.post('/', verificarToken, adminOSoporte, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password, rol, tipoOperador } = req.body
    
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' })
    }
    
    // Validar rol
    const rolesValidos = ['administrador', 'operador', 'soporte', 'hogares']
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

// Crear múltiples usuarios desde CSV (admin y soporte)
router.post('/bulk', verificarToken, adminOSoporte, async (req: AuthRequest, res: Response) => {
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

// Actualizar rol de usuario (solo admin)
router.patch('/:id/rol', verificarToken, soloAdmin, async (req: AuthRequest, res: Response) => {
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

// Activar/Desactivar usuario (solo admin)
router.patch('/:id/estado', verificarToken, soloAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { activo } = req.body
    
    // Obtener el usuario antes de actualizarlo para tener su información
    const usuarioAntes = await Usuario.findById(req.params.id)
    
    if (!usuarioAntes) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    
    const user = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo, updatedAt: new Date() },
      { new: true }
    ).select('-passwordHash -refreshToken')
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    
    // Si se está desactivando un usuario, notificar a los administradores
    if (!activo && usuarioAntes.activo) {
      try {
        await notificarUsuarioDesactivado(user.email, user.nombre)
      } catch (notifError) {
        console.error('⚠️ Error enviando notificación de desactivación:', notifError)
        // No fallar la operación si la notificación falla
      }
    }
    
    res.json({ success: true, data: user })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error actualizando estado' })
  }
})

// Eliminar usuario (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await Usuario.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' })
    }
    
    // Guardar información del usuario antes de eliminarlo
    const usuarioInfo = {
      email: user.email,
      nombre: user.nombre
    }
    
    // Eliminar el usuario
    await Usuario.findByIdAndDelete(req.params.id)
    
    // Notificar a los administradores sobre la eliminación
    try {
      await notificarUsuarioEliminado(usuarioInfo.email, usuarioInfo.nombre)
    } catch (notifError) {
      console.error('⚠️ Error enviando notificación de eliminación:', notifError)
      // No fallar la operación si la notificación falla
    }
    
    res.json({ success: true, message: 'Usuario eliminado exitosamente' })
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error eliminando usuario' })
  }
})

export default router
