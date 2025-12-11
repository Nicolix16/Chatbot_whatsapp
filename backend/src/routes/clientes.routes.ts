import { Router, Response } from 'express'
import Cliente from '../models/Cliente.js'
import { verificarToken, adminOOperador, adminOSoporte, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Obtener todos los clientes (con filtros según rol)
router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    let filtro: any = {}
    
    console.log('🔍 [CLIENTES] Usuario:', req.user?.email, 'Rol:', req.user?.rol, 'TipoOperador:', req.user?.tipoOperador)
    
    // Admin y soporte ven todos los clientes (sin filtro)
    if (req.user!.rol === 'administrador' || req.user!.rol === 'soporte') {
      filtro = {}
      console.log('👑 [CLIENTES] Admin/Soporte - sin filtros, ve todos')
    }
    // Rol hogares solo ve clientes tipo 'hogar'
    else if (req.user!.rol === 'hogares') {
      filtro = { tipoCliente: 'hogar' }
      console.log('🏠 [CLIENTES] Aplicando filtro hogares:', filtro)
    }
    // Si es operador, filtrar por su tipo de responsabilidad
    else if (req.user!.rol === 'operador' && req.user!.tipoOperador) {
      filtro = { responsable: req.user!.tipoOperador }
      console.log('👔 [CLIENTES] Aplicando filtro operador:', filtro)
    }
    
    console.log('📊 [CLIENTES] Filtro final:', filtro)
    
    const clientes = await Cliente.find(filtro).sort({ fechaRegistro: -1 })
    
    console.log('✅ [CLIENTES] Clientes encontrados:', clientes.length)
    
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

// Obtener un cliente por teléfono (admin, soporte y operadores)
router.get('/:telefono', verificarToken, async (req: AuthRequest, res: Response) => {
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

export default router
