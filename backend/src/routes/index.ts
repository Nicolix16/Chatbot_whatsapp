import { Router } from 'express'
import authRoutes from './auth.routes.js'
import clientesRoutes from './clientes.routes.js'
import pedidosRoutes from './pedidos.routes.js'
import conversacionesRoutes from './conversaciones.routes.js'
import eventosRoutes from './eventos.routes.js'
import usuariosRoutes from './usuarios.routes.js'
import powerbiRoutes from './powerbi.routes.js'
import notificacionesRoutes from './notificaciones.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/clientes', clientesRoutes)
router.use('/pedidos', pedidosRoutes)
router.use('/conversaciones', conversacionesRoutes)
router.use('/eventos', eventosRoutes)
router.use('/usuarios', usuariosRoutes)
router.use('/powerbi', powerbiRoutes)
router.use('/notificaciones', notificacionesRoutes)

export default router
