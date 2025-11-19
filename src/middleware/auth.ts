import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { RolUsuario } from '../models/Usuario.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export interface AuthRequest extends Request {
  user?: {
    uid: string
    email: string
    rol: RolUsuario
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

export const soloAdmin = requiereRol('administrador')
export const adminOOperario = requiereRol('administrador', 'operario')
export const todosLosRoles = requiereRol('administrador', 'operario', 'visitante')
