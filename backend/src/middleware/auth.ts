import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { RolUsuario, TipoOperador } from '../models/Usuario.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export interface AuthRequest extends Request {
  user?: {
    uid: string
    email: string
    rol: RolUsuario
    tipoOperador?: TipoOperador
    nombre?: string
  }
}

export function verificarToken(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  const [, token] = auth.split(' ')
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' })
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    
    // ⭐ Validar que operadores (no hogares) tengan tipoOperador
    if (payload.rol === 'operador' && !payload.tipoOperador) {
      console.warn('⚠️ Token de operador sin tipoOperador detectado:', payload.email)
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido - por favor vuelve a iniciar sesión' 
      })
    }
    
    req.user = payload
    return next()
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido' })
  }
}

export function requiereRol(...rolesPermitidos: RolUsuario[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' })
    }
    
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para esta acción',
        requiere: rolesPermitidos,
        tuRol: req.user.rol
      })
    }
    
    return next()
  }
}

// Middleware para verificar permisos de escritura (solo admin y soporte)
export function permisoEscritura(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'No autenticado' })
  }
  
  // Solo admin y soporte pueden crear/modificar eventos
  if (req.user.rol !== 'administrador' && req.user.rol !== 'soporte') {
    return res.status(403).json({ 
      success: false, 
      error: 'No tienes permisos para modificar datos. Solo administradores y soporte pueden crear eventos.'
    })
  }
  
  return next()
}

// Middleware para filtrar pedidos según el tipo de operador
export function filtrarPedidosPorOperador(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'No autenticado' })
  }
  
  // Administrador ve todo
  if (req.user.rol === 'administrador') {
    return next()
  }
  
  // Operador solo ve sus pedidos asignados
  if (req.user.rol === 'operador' && req.user.tipoOperador) {
    // Agregar filtro a la query
    const coordinadorMap: Record<string, string> = {
      'coordinador_masivos': 'Coordinador de Masivos',
      'director_comercial': 'Director Comercial',
      'ejecutivo_horecas': 'Ejecutivo Horecas',
      'mayorista': 'Coordinador Mayoristas'
    }
    
    req.query.coordinadorAsignado = coordinadorMap[req.user.tipoOperador] || ''
    return next()
  }
  
  // Soporte ve todo (solo lectura)
  if (req.user.rol === 'soporte') {
    return next()
  }
  
  // Hogares ve todo (sus clientes hogar se filtran en la ruta)
  if (req.user.rol === 'hogares') {
    return next()
  }
  
  return res.status(403).json({ success: false, error: 'Rol no válido' })
}

export const soloAdmin = requiereRol('administrador')
export const adminOSoporte = requiereRol('administrador', 'soporte')
export const adminOOperador = requiereRol('administrador', 'operador', 'hogares')
export const todosLosRoles = requiereRol('administrador', 'operador', 'soporte', 'hogares')
