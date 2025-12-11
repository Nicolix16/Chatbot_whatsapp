import { Router, Response } from 'express'
import { verificarToken, AuthRequest } from '../middleware/auth.js'
import {
  obtenerNotificacionesUsuario,
  marcarComoLeida,
  marcarTodasComoLeidas
} from '../services/notificaciones.service.js'

const router = Router()

// Obtener notificaciones del usuario autenticado
router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user!.uid
    const soloNoLeidas = req.query.noLeidas === 'true'

    const notificaciones = await obtenerNotificacionesUsuario(usuarioId, soloNoLeidas)

    res.json({
      success: true,
      total: notificaciones.length,
      data: notificaciones
    })
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error)
    res.status(500).json({
      success: false,
      error: 'Error obteniendo notificaciones'
    })
  }
})

// Marcar una notificación como leída
router.patch('/:id/leer', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const notificacion = await marcarComoLeida(req.params.id)

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      })
    }

    res.json({
      success: true,
      data: notificacion
    })
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error)
    res.status(500).json({
      success: false,
      error: 'Error marcando notificación como leída'
    })
  }
})

// Marcar todas las notificaciones del usuario como leídas
router.patch('/leer-todas', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user!.uid
    const resultado = await marcarTodasComoLeidas(usuarioId)

    res.json({
      success: true,
      message: `${resultado.modifiedCount} notificaciones marcadas como leídas`
    })
  } catch (error) {
    console.error('❌ Error marcando todas como leídas:', error)
    res.status(500).json({
      success: false,
      error: 'Error marcando todas como leídas'
    })
  }
})

export default router
