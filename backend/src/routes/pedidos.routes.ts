import { Router, Response } from 'express'
import Pedido from '../models/Pedido.js'
import Cliente from '../models/Cliente.js'
import { verificarToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Obtener todos los pedidos (con filtros según rol)
router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    let pedidos = []
    
    // Si se proporciona un teléfono específico, filtrar solo por ese
    if (req.query.telefono) {
      pedidos = await Pedido.find({ telefono: req.query.telefono as string }).sort({ fechaPedido: -1 }).lean()
      
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
      
      const telefonos = clientesAsignados.map(c => c.telefono)
      
      // Si no hay clientes asignados, retornar array vacío
      if (telefonos.length === 0) {
        return res.json({
          success: true,
          total: 0,
          data: []
        })
      }
      
      // Filtrar pedidos solo de esos clientes
      pedidos = await Pedido.find({ telefono: { $in: telefonos } }).sort({ fechaPedido: -1 }).lean()
    } else if (req.user!.rol === 'hogares') {
      // Rol hogares solo ve pedidos de clientes tipo 'hogar'
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
      
      pedidos = await Pedido.find({ telefono: { $in: telefonos } }).sort({ fechaPedido: -1 }).lean()
    } else if (req.user!.rol === 'administrador' || req.user!.rol === 'soporte') {
      // Administrador y soporte ven todos los pedidos sin filtros
      pedidos = await Pedido.find({}).sort({ fechaPedido: -1 }).lean()
    } else {
      // Cualquier otro rol no tiene acceso
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver pedidos'
      })
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

// Obtener un pedido específico por ID
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const pedido = await Pedido.findById(req.params.id).lean()
    
    if (!pedido) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' })
    }
    
    // Admin y soporte pueden ver todos los pedidos
    // Operadores solo pueden ver pedidos de sus clientes
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      const cliente = await Cliente.findOne({ telefono: pedido.telefono }).lean()
      
      if (!cliente || cliente.responsable !== req.user!.tipoOperador) {
        return res.status(403).json({ success: false, error: 'No tienes permiso para ver este pedido' })
      }
    }
    // Hogares solo pueden ver pedidos de clientes tipo hogar
    else if (req.user!.rol === 'hogares') {
      const cliente = await Cliente.findOne({ telefono: pedido.telefono }).lean()
      
      if (!cliente || cliente.tipoCliente !== 'hogar') {
        return res.status(403).json({ success: false, error: 'No tienes permiso para ver este pedido' })
      }
    }
    
    res.json({ success: true, data: pedido })
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo pedido' })
  }
})

// Actualizar estado de un pedido
router.patch('/:id/estado', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const { estado, notasCancelacion } = req.body
    
    if (!estado || !['pendiente', 'en_proceso', 'atendido', 'cancelado'].includes(estado)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estado inválido. Debe ser: pendiente, en_proceso, atendido o cancelado' 
      })
    }
    
    const pedido = await Pedido.findById(req.params.id)
    
    if (!pedido) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' })
    }
    
    // Verificar permisos
    if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      const cliente = await Cliente.findOne({ telefono: pedido.telefono }).lean()
      
      if (!cliente || cliente.responsable !== req.user!.tipoOperador) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para modificar este pedido' 
        })
      }
    } else if (req.user!.rol === 'hogares') {
      const cliente = await Cliente.findOne({ telefono: pedido.telefono }).lean()
      
      if (!cliente || cliente.tipoCliente !== 'hogar') {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permiso para modificar este pedido' 
        })
      }
    } else if (req.user!.rol !== 'administrador' && req.user!.rol !== 'soporte') {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para modificar pedidos' 
      })
    }
    
    // Actualizar estado
    pedido.estado = estado
    if (notasCancelacion) {
      pedido.notasCancelacion = notasCancelacion
    }
    
    await pedido.save()
    
    console.log(`✅ Pedido ${pedido.idPedido} actualizado a estado: ${estado} por usuario: ${req.user!.nombre}`)
    
    res.json({ success: true, data: pedido })
  } catch (error) {
    console.error('❌ Error actualizando estado del pedido:', error)
    res.status(500).json({ success: false, error: 'Error actualizando estado del pedido' })
  }
})

export default router
