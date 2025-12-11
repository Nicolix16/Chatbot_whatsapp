import { Router, Response } from 'express'
import Conversacion from '../models/Conversacion.js'
import Cliente from '../models/Cliente.js'
import { verificarToken, adminOOperador, adminOSoporte, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Obtener todas las conversaciones (con filtros según rol)
router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    let filtroConversaciones: any = {}
    
    // Admin y soporte ven todas las conversaciones sin filtro
    if (req.user!.rol === 'administrador' || req.user!.rol === 'soporte') {
      filtroConversaciones = {}
    }
    // Si es operador, filtrar solo conversaciones de clientes asignados
    else if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
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
    } else if (req.user!.rol === 'hogares') {
      // Rol hogares solo ve conversaciones de clientes tipo 'hogar'
      const clientesHogar = await Cliente.find(
        { tipoCliente: 'hogar' },
        { telefono: 1 }
      ).lean()
      
      const telefonos = clientesHogar.map(c => c.telefono)
      
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

// Obtener detalle de una conversación específica
router.get('/:telefono', verificarToken, async (req: AuthRequest, res: Response) => {
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

export default router
